// se maneja la peticion http extrayendo los datos del req.body y llamndo el servicio desede docente.service.ts
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../middlewares/auth.midleware.js";
import {
  registrarDocente,
  obtenerDocentes,
  generarCodigoDOcente,
  obtenerDocenteConArchivosPorId,
  buscarUsuarioDisponibleParaDocencia,
  vincularDocenteAUsuarioExistente,
  //actualizarDocente,
  cambiarEstadoDocente,
  actualizarDatosDocente,
  actualizarDocumentosDocenteService

} from "../services/docente.service.js";
import {
  buscarUsuarioDocenteSchema,
  vincularDocenteAUsuarioSchema,
} from "../validators/docente.validator.js";
import {subirArchivo} from "../services/storage.service.js";
import {guardarOActualizarArchivosEnBD} from "../services/archivos.service.js";
import type { InsertDocente } from "../types/docentes.types.js";
import { EstadoDocente } from "../types/docentes.types.js";
import { AppError } from "../utils/appError.utils.js";
import { cleanupTemporaryFiles } from "../utils/uploadCleanup.utils.js";

const isErrorWithCode = (error: unknown, code: string) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === code;

const mapDocenteError = (
  error: unknown,
  mapDatabaseDuplicate = false
): unknown => {
  if (error instanceof AppError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "";
  if (
    message === "DOCUMENTO_IDENTIDAD_DUPLICADO" ||
    (mapDatabaseDuplicate && isErrorWithCode(error, "23505"))
  ) {
    return new AppError(
      "No se pudo completar el registro del docente.",
      409,
      "DOCUMENTO_DUPLICADO",
      [
        {
          field: "numeroDocumento",
          message:
            "El número de documento de identidad ingresado ya se encuentra registrado en el sistema.",
        },
      ]
    );
  }

  if (message === "DOCENTE_NO_ENCONTRADO") {
    return new AppError("El docente especificado no existe.", 404, "DOCENTE_NO_ENCONTRADO");
  }

  if (message === "USUARIO_COORDINADOR_NO_ENCONTRADO") {
    return new AppError(
      "No se encontró una cuenta vinculada a un perfil de coordinador.",
      404,
      "USUARIO_NO_DISPONIBLE",
    );
  }

  if (message === "PERFIL_DOCENTE_YA_EXISTE") {
    return new AppError(
      "Esta cuenta ya tiene un perfil docente asociado.",
      409,
      "PERFIL_DOCENTE_DUPLICADO",
    );
  }

  if (message === "MOTIVO_INACTIVACION_REQUERIDO") {
    return new AppError(
      "Es obligatorio ingresar un motivo para inactivar al docente.",
      400,
      "MOTIVO_INACTIVACION_REQUERIDO",
      [{ field: "motivoInactivacion", message: "Este campo es obligatorio." }]
    );
  }

  return error;
};

const validationError = (error: ZodError) =>
  new AppError(
    "Error de validación en los datos de entrada.",
    400,
    "VALIDATION_ERROR",
    error.issues.map((issue) => ({
      field: issue.path.join(".") || "general",
      message: issue.message,
    })),
  );

export const buscarUsuarioDisponibleParaDocenciaController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { documentoIdentidad } = buscarUsuarioDocenteSchema.parse(req.query);
    const perfil = await buscarUsuarioDisponibleParaDocencia(documentoIdentidad);

    if (!perfil) {
      throw new AppError(
        "No se encontró un perfil de coordinador disponible con ese documento.",
        404,
        "USUARIO_NO_DISPONIBLE",
      );
    }

    return res.status(200).json({
      success: true,
      message: "Perfil disponible para vincular como docente.",
      data: perfil,
    });
  } catch (error: unknown) {
    return next(error instanceof ZodError ? validationError(error) : mapDocenteError(error));
  }
};

export const vincularDocenteAUsuarioExistenteController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const usuarioId = Array.isArray(req.params.usuarioId)
      ? req.params.usuarioId[0]
      : req.params.usuarioId;
    if (!usuarioId) {
      throw new AppError("El ID del usuario es obligatorio.", 400, "ID_REQUERIDO", [
        { field: "usuarioId", message: "Este parámetro es obligatorio." },
      ]);
    }

    const usuarioAdminId = req.user?.usuarioId;
    if (!usuarioAdminId) {
      throw new AppError("No autorizado.", 401, "NO_AUTORIZADO");
    }

    const datos = vincularDocenteAUsuarioSchema.parse(req.body);
    const docente = await vincularDocenteAUsuarioExistente(
      usuarioId,
      datos,
      usuarioAdminId,
    );

    return res.status(201).json({
      success: true,
      message: "Perfil docente asociado a la cuenta existente y rol DOCENTE asignado.",
      data: docente,
    });
  } catch (error: unknown) {
    return next(error instanceof ZodError ? validationError(error) : mapDocenteError(error, true));
  }
};

export const registrarDocenteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const uploadFilesPaths: string[] = []; // Para limpieza si ocurre un error global
  let requestSucceeded = false;
  try {
    //1. obtner el ID del ADmin logueado desde el token midleware
 const usuarioAdminId = (req as any).user?.usuarioId;
 

    const rawUsuarioId = req.body.usuarioId;
    const usuarioIdLimpio = (!rawUsuarioId || rawUsuarioId === 'null' || rawUsuarioId === '') ? undefined : rawUsuarioId;
    const codigogenerado =  await generarCodigoDOcente();

    // Agrupamos limpiamente los campos en el objeto data
    const data: InsertDocente = {
      codigo: codigogenerado,
      usuarioId: usuarioIdLimpio,

      tipoDocumento: req.body.tipoDocumento,
      numeroDocumento: req.body.numeroDocumento,

      nombre: req.body.nombre,
      apellidos: req.body.apellidos,
      fechaNacimiento: req.body.fechaNacimiento,

      telefono: req.body.telefono ?? null,
      correo: req.body.correo ?? null,
      formacionAcademica: req.body.formacionAcademica ?? null,
      experienciaLaboral: req.body.experienciaLaboral ?? null,

      reportaDiscapacidad: req.body.reportaDiscapacidad ?? false,
    };
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const documentPaths: Record<string, string> = {};
    //1. Validacion: definir que campos de archivos son obligatorios y cuales opcionales
    const camposObligatorios = ['profilePicture', 'identityDocument'];
    const archivosFaltantes: string[] = [];

    for (const campo of camposObligatorios) {
      if (!files || !files[campo] || files[campo].length === 0) {
        archivosFaltantes.push(campo);
      }
    }

    if(archivosFaltantes.length > 0) {
      throw new AppError(
        `Faltan archivos obligatorios: ${archivosFaltantes.join(", ")}`,
        400,
        "ARCHIVOS_FALTANTES"
      );
    }

    //2.procesar y subir los archivos a storage supabase si existen
    if(files){

      for(const [fieldname, fileArray] of Object.entries(files)){

        if(fileArray && fileArray.length > 0){

          const file = fileArray[0];
          uploadFilesPaths.push(file.path); // Guardamos la ruta local para limpieza
          //definir carpeta sehun el campo del formulario
          let carpetaSupabase = 'Otros';
          if(fieldname === 'profilePicture') carpetaSupabase = 'FotosPerfil';
          if(fieldname === 'identityDocument') carpetaSupabase = 'DocumentosIdentidad';
          if(fieldname === 'disabilityCertificate') carpetaSupabase = 'CertificadosDiscapacidad';
          if(fieldname === 'cv') carpetaSupabase = 'HojasDeVida';// para el estudiante esto se remueve

          const storagePath = await subirArchivo(
            file.path,
            carpetaSupabase,
            file.mimetype
          );

          // guardamso al ruta que ira en la base de datos 
          documentPaths[fieldname] = storagePath;
        }
      }
    }

    // (Opcional por seguridad) Validar que exista
    if (!usuarioAdminId) {
      throw new AppError("Falta información del usuario en el token.", 401, "NO_AUTORIZADO");
    }
    // Pasamos el objeto completo al servicio
    const nuevoDocente = await registrarDocente(data, usuarioAdminId);

    if (Object.keys(documentPaths).length > 0) {
      await guardarOActualizarArchivosEnBD(
        nuevoDocente.id, 
        "DOCENTE", 
        documentPaths
      );
    }

    requestSucceeded = true;
    return res.status(201).json({
      success: true,
      message: "Docente registrado con éxito",
      data: nuevoDocente,
      documentPaths
    });
  } catch (error: unknown) {
    return next(mapDocenteError(error, true));
  } finally {
    if (requestSucceeded) {
      await cleanupTemporaryFiles(uploadFilesPaths);
    }
  }
}

// obetner usuarios controller

export const listarDocentesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const estado = req.query.estado as string | undefined;
    const busqueda = req.query.busqueda as string | undefined;
    const docentesListados = await obtenerDocentes({ estado, busqueda });
    return res.status(200).json({
      success: true,
      message: "Docentes listados exitosamente",
      data: docentesListados,
    });
  } catch (error: unknown) {
    return next(mapDocenteError(error));
  }
};


// controlador para obetner los datos del docente y los documentos mediante url
export const obtenerDocenteConArchivosPorIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) {
      throw new AppError("El ID del docente es obligatorio.", 400, "ID_REQUERIDO", [
        { field: "id", message: "Este parámetro es obligatorio." },
      ]);
    }

    const docenteConArchivos = await obtenerDocenteConArchivosPorId(id);
    if (!docenteConArchivos) {
      throw new AppError("El docente especificado no existe.", 404, "DOCENTE_NO_ENCONTRADO");
    }

    return res.status(200).json({
      success: true,
      message: "Docente encontrado exitosamente",
      data: docenteConArchivos,
    });
  } catch (error: unknown) {
    return next(mapDocenteError(error));
  }
};

export const cambiarEstadoDocenteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    const { id } = req.params;
    const { nuevoEstado, motivoInactivacion } = req.body;

    if (!Object.values(EstadoDocente).includes(nuevoEstado)) {
      throw new AppError("El estado proporcionado no es válido.", 400, "ESTADO_INVALIDO", [
        { field: "nuevoEstado", message: "Seleccione un estado válido." },
      ]);
    }

    if (!id) {
      throw new AppError("El ID del docente es obligatorio.", 400, "ID_REQUERIDO", [
        { field: "id", message: "Este parámetro es obligatorio." },
      ]);
    }

    const docenteModificado = await cambiarEstadoDocente({
      docenteId: String(id),
      nuevoEstado: nuevoEstado as EstadoDocente,
      motivoInactivacion
    });

    return res.status(200).json({
      success: true,
      message: `El estado del docente ha sido cambiado a ${nuevoEstado} exitosamente.`,
      data: docenteModificado
    });

  } catch (error: unknown) {
    return next(mapDocenteError(error));
  }
}



export const actualizarDatosDocenteController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const usuarioAdminId = (req as any).user?.usuarioId;
    const params = req.params as Record<string, string>
    const docenteId = params.id;

    if (!usuarioAdminId) {
      throw new AppError(
        "No autorizado: falta información del usuario.",
        401,
        "NO_AUTORIZADO"
      );
    }

    if (!docenteId) {
      throw new AppError("El ID del docente es obligatorio.", 400, "ID_REQUERIDO", [
        { field: "id", message: "Este parámetro es obligatorio." },
      ]);
    }

    // Mapeamos EXCLUSIVAMENTE los campos que sí son editables tras el registro
    // se hace de esta manera para que solo se actualize el dato que viene en l apeticion  y no semodifique ningun otro 
    const data = {
      nombre: req.body.nombre,
      apellidos: req.body.apellidos,
      fechaNacimiento: req.body.fechaNacimiento,
      telefono: req.body.telefono,
      formacionAcademica: req.body.formacionAcademica,
      experienciaLaboral: req.body.experienciaLaboral,
      reportaDiscapacidad: req.body.reportaDiscapacidad,
      
    };

    // Eliminar claves undefined para permitir actualizaciones parciales (PATCH/PUT flexible)
    Object.keys(data).forEach((key) => {
      if ((data as any)[key] === undefined) {
        delete (data as any)[key];
      }
    });

    const docenteActualizado = await actualizarDatosDocente(docenteId, data, usuarioAdminId);

    return res.status(200).json({
      success: true,
      message: "Datos del docente actualizados correctamente",
      data: docenteActualizado,
    });

  } catch (error: unknown) {
    return next(mapDocenteError(error));
  }
};



export const actualizarDocumentosDocenteController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const uploadFilesPaths: string[] = []; // Para limpieza local si ocurre error
  let requestSucceeded = false;
  try {
    const usuarioAdminId = (req as any).user?.usuarioId;
    const params = req.params as Record<string, string>;
    const docenteId = params.id;

    if (!usuarioAdminId) {
      throw new AppError(
        "No autorizado: falta información del usuario en el token.",
        401,
        "NO_AUTORIZADO"
      );
    }

    if (!docenteId) {
      throw new AppError(
        "El ID del docente es obligatorio en los parámetros.",
        400,
        "ID_REQUERIDO",
        [{ field: "id", message: "Este parámetro es obligatorio." }]
      );
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const documentPaths: Record<string, string> = {};

    if (!files || Object.keys(files).length === 0) {
      throw new AppError(
        "Debe adjuntar al menos un documento para realizar la actualización.",
        400,
        "ARCHIVOS_REQUERIDOS",
        [{ field: "files", message: "Adjunte al menos un documento." }]
      );
    }

    // 1. Procesar y subir los nuevos archivos a Supabase Storage
    for (const [fieldname, fileArray] of Object.entries(files)) {
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0];
        uploadFilesPaths.push(file.path); // Guardamos la ruta local para limpieza posterior

        let carpetaSupabase = 'Otros';
        if (fieldname === 'profilePicture') carpetaSupabase = 'FotosPerfil';
        if (fieldname === 'identityDocument') carpetaSupabase = 'DocumentosIdentidad';
        if (fieldname === 'disabilityCertificate') carpetaSupabase = 'CertificadosDiscapacidad';
        if (fieldname === 'cv') carpetaSupabase = 'HojasDeVida';

        const storagePath = await subirArchivo(
          file.path,
          carpetaSupabase,
          file.mimetype
        );

        documentPaths[fieldname] = storagePath;
      }
    }

    // 2. Ejecutar servicio de actualización transaccional
    await actualizarDocumentosDocenteService(docenteId, documentPaths, usuarioAdminId);

    requestSucceeded = true;
    return res.status(200).json({
      success: true,
      message: "Documentos del docente actualizados con éxito (versiones anteriores archivadas como inactivas)",
      data:{
        documentPaths
      }
    });

  } catch (error: unknown) {
    return next(mapDocenteError(error));
  } finally {
    if (requestSucceeded) {
      await cleanupTemporaryFiles(uploadFilesPaths);
    }
  }
};