import { Request, Response, NextFunction} from 'express';
import {
    generarCodigoEstudiante,
    obtenerEstudiantes,
    preRegistrarEstudiante,
    registrarEstudianteConFirma,
    obtenerEstudianteConArchivosPorId,
    cambiarEstadoEstudiante,
    actualizarDatosEstudiante,
    actualizarDatosContacto,
    actualizarDocumentosEstudianteService
} from '../services/estudiante.service.js';

import type {
  DatosActualizacionContacto,
  InsertContacto,
} from '../types/contactoEstudiante.types.js';
import { guardarOActualizarArchivosEnBD } from '../services/archivos.service.js';
import { AppError } from '../utils/appError.utils.js';
import { cleanupTemporaryFiles } from '../utils/uploadCleanup.utils.js';
import { eliminarArchivo, subirArchivo } from '../services/storage.service.js';
import { EstadoEstudiante } from '../types/estudiantes.types.js';




const isErrorWithCode = (error: unknown, code: string) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === code;

const mapEstudianteError = (
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

export const preRegistrarEstudianteController = async (
    req: Request,
    res: Response,
    next: NextFunction
    ) => {
    const uploadFilesPaths: string[] = []; 
    let requestSucceeded = false;

    try {
        const usuarioAdminId = (req as any).user?.usuarioId;
        if (!usuarioAdminId) {
        throw new AppError("Falta información del usuario en el token.", 401, "NO_AUTORIZADO");
        }

        // ==========================================
        // PASO 1: VALIDAR DATOS Y CONTACTOS PRIMERO
        // ==========================================
        let contactos: InsertContacto[] = [];
        try {
        if (req.body.contactos) {
            contactos = typeof req.body.contactos === 'string' 
            ? JSON.parse(req.body.contactos) 
            : req.body.contactos;
        }
        } catch (e) {
        throw new AppError("El formato de los contactos/acudientes no es un JSON válido.", 400, "CONTACTOS_INVALIDOS");
        }

        if (!Array.isArray(contactos) || contactos.length === 0) {
        throw new AppError("Debe enviar los contactos o acudientes obligatorios.", 400, "CONTACTOS_FALTANTES");
        }

        // ==========================================
        // PASO 2: VALIDAR QUE LOS ARCHIVOS EXISTAN
        // ==========================================
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const camposObligatorios = ['profilePicture', 'identityDocument'];
        const archivosFaltantes: string[] = [];

        for (const campo of camposObligatorios) {
        if (!files || !files[campo] || files[campo].length === 0) {
            archivosFaltantes.push(campo);
        }
        }

        if (archivosFaltantes.length > 0) {
        throw new AppError(
            `Faltan archivos obligatorios: ${archivosFaltantes.join(", ")}`,
            400,
            "ARCHIVOS_FALTANTES"
        );
        }

        // ==========================================
        // PASO 3: PREPARAR DATOS DEL ESTUDIANTE
        // ==========================================
        const codigoGenerado = await generarCodigoEstudiante();
        const dataEstudiante = {
        codigo: codigoGenerado,
        usuarioId: null,
        tipoDocumento: req.body.tipoDocumento,
        numeroDocumento: req.body.numeroDocumento,
        nombre: req.body.nombre,
        apellidos: req.body.apellidos,
        fechaNacimiento: req.body.fechaNacimiento,
        telefono: req.body.telefono ?? null,
        gradoAcademico: req.body.gradoAcademico ?? null,
        institucionEducativa: req.body.institucionEducativa ?? null,
        reportaDiscapacidad: req.body.reportaDiscapacidad === 'true' || req.body.reportaDiscapacidad === true,
        estado: "PRE_REGISTRADO" as const,
        };

        // ==========================================
        // PASO 4: SUBIR A SUPABASE (AHORA SÍ, SEGUROS)
        // ==========================================
        const documentPaths: Record<string, string> = {};
        for (const [fieldname, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
            const file = fileArray[0];
            uploadFilesPaths.push(file.path); // Guardamos la ruta local por si falla el servicio de BD

            let carpetaSupabase = 'Estudiantes/Otros';
            if (fieldname === 'profilePicture') carpetaSupabase = 'Estudiantes/FotosPerfil';
            if (fieldname === 'identityDocument') carpetaSupabase = 'Estudiantes/DocumentosIdentidad';
            if (fieldname === 'disabilityCertificate') carpetaSupabase = 'Estudiantes/CertificadosDiscapacidad';

            const storagePath = await subirArchivo(file.path, carpetaSupabase, file.mimetype);
            documentPaths[fieldname] = storagePath;
        }
        }

        // ==========================================
        // PASO 5: EJECUTAR TRANSACCIÓN EN BASE DE DATOS
        // ==========================================
        const nuevoEstudiante = await preRegistrarEstudiante(dataEstudiante, contactos, usuarioAdminId);

        if (Object.keys(documentPaths).length > 0) {
        await guardarOActualizarArchivosEnBD(nuevoEstudiante.id, "ESTUDIANTE", documentPaths);
        }

        requestSucceeded = true;
        return res.status(201).json({
        success: true,
        message: "Estudiante pre-registrado con éxito",
        data: nuevoEstudiante,
        documentPaths
        });

    } catch (error: unknown) {
        // Si ocurre cualquier error de validación o en la BD, entra aquí 
        // y el bloque 'finally' limpiará los archivos locales de Multer.
        return next(error);
    } finally {
        if (uploadFilesPaths.length > 0) {
        await cleanupTemporaryFiles(uploadFilesPaths);
        }
    }
    };

export const registrarEstudianteConFirmaController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const uploadFilesPaths: string[] = [];
    let firmaStoragePath: string | undefined;

    try {
        const usuarioAdminId = (req as any).user?.usuarioId;
        if (!usuarioAdminId) {
            throw new AppError("Falta información del usuario en el token.", 401, "NO_AUTORIZADO");
        }

        const numeroDocumento = typeof req.body.numeroDocumento === "string"
            ? req.body.numeroDocumento.trim()
            : "";
        if (!numeroDocumento) {
            throw new AppError("El número de documento es obligatorio.", 400, "DOCUMENTO_FALTANTE");
        }

        const parsearConfirmacion = (valor: unknown, campo: string): boolean => {
            if (valor === true || valor === "true") return true;
            if (valor === false || valor === "false") return false;
            throw new AppError(
                `El campo ${campo} debe ser una confirmación booleana.`,
                400,
                "CONFIRMACION_INVALIDA",
                [{ field: campo, message: "Envíe true o false." }]
            );
        };

        const terminosyCondiciones = parsearConfirmacion(
            req.body.terminosyCondiciones,
            "terminosyCondiciones"
        );
        const consentimientoUsoImagen = parsearConfirmacion(
            req.body.consentimientoUsoImagen,
            "consentimientoUsoImagen"
        );
        if (!terminosyCondiciones) {
            throw new AppError(
                "Para registrar al estudiante debe aceptar los términos y condiciones.",
                400,
                "TERMINOS_REQUERIDOS"
            );
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const firma = files?.firmaDigital?.[0];
        if (!firma) {
            throw new AppError(
                "Falta el archivo obligatorio: firmaDigital.",
                400,
                "ARCHIVOS_FALTANTES"
            );
        }
        if (firma.mimetype !== "image/png" || !firma.originalname.toLowerCase().endsWith(".png")) {
            throw new AppError(
                "La firma digital debe ser un archivo PNG.",
                400,
                "TIPO_ARCHIVO_INVALIDO",
                [{ field: "firmaDigital", message: "Adjunte una imagen PNG." }]
            );
        }

        uploadFilesPaths.push(firma.path);
        firmaStoragePath = await subirArchivo(
            firma.path,
            "Estudiantes/FirmasDigitales",
            firma.mimetype
        );

        const estudianteRegistrado = await registrarEstudianteConFirma({
            numeroDocumento,
            terminosyCondiciones,
            consentimientoUsoImagen,
            firmaStoragePath,
            usuarioAdminId,
        });

        return res.status(201).json({
            success: true,
            message: "Estudiante registrado con éxito.",
            data: estudianteRegistrado,
            documentPaths: { firmaDigital: firmaStoragePath },
        });
    } catch (error: unknown) {
        if (firmaStoragePath) {
            try {
                await eliminarArchivo(firmaStoragePath);
            } catch (cleanupError) {
                console.error("No se pudo eliminar la firma de Storage tras fallar el registro:", cleanupError);
            }
        }
        return next(error);
    } finally {
        await cleanupTemporaryFiles(uploadFilesPaths);
    }
};

export const listarEstudiantesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const estado = req.query.estado as string | undefined;
    const busqueda = req.query.busqueda as string | undefined;
    const estudiantesListados = await obtenerEstudiantes({ estado, busqueda });
    return res.status(200).json({
      success: true,
      message: "Esdtudiantes listados exitosamente",
      data: estudiantesListados,
    });
  } catch (error: unknown) {
    return next(mapEstudianteError(error));
  }
};

// controlador para obetner los datos del estudiante y los documentos mediante url
export const obtenerEstudianteConArchivosPorIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    
    if (!id) {
      throw new AppError("El ID del estudiante es obligatorio.", 400, "ID_REQUERIDO", [
        { field: "id", message: "Este parámetro es obligatorio." },
      ]);
    }

    // Llamada al servicio renombrada correctamente a la entidad estudiante
    const estudianteConArchivos = await obtenerEstudianteConArchivosPorId(id);
    
    if (!estudianteConArchivos) {
      throw new AppError("El estudiante especificado no existe.", 404, "ESTUDIANTE_NO_ENCONTRADO");
    }

    return res.status(200).json({
      success: true,
      message: "Estudiante encontrado exitosamente",
      data: estudianteConArchivos,
    });
  } catch (error: unknown) {
    return next(mapEstudianteError(error));
  }
};

// cambiar estado 
export const cambiarEstadoEstudianteController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {
    const { id } = req.params;
    const { nuevoEstado, motivoInactivacion } = req.body;
    const usuarioAdminId = (req as any).user?.usuarioId;
        if (!usuarioAdminId) {
            throw new AppError("Falta información del usuario en el token.", 401, "NO_AUTORIZADO");
        }
    if (!Object.values(EstadoEstudiante).includes(nuevoEstado)) {
      throw new AppError("El estado proporcionado no es válido.", 400, "ESTADO_INVALIDO", [
        { field: "nuevoEstado", message: "Seleccione un estado válido." },
      ]);
    }

    if (!id) {
      throw new AppError("El ID del estudiante es obligatorio.", 400, "ID_REQUERIDO", [
        { field: "id", message: "Este parámetro es obligatorio." },
      ]);
    }

    const docenteModificado = await cambiarEstadoEstudiante({
      estudianteId: String(id),
      usuarioAdminId,
      nuevoEstado: nuevoEstado as EstadoEstudiante,
      motivoInactivacion
    });

    return res.status(200).json({
      success: true,
      message: `El estado del estudiante ha sido cambiado a ${nuevoEstado} exitosamente.`,
      data: docenteModificado
    });

  } catch (error: unknown) {
    return next(mapEstudianteError(error));
  }
}


// actualizar los datos del estudiante
export const actualizarDatosEstudianteController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const usuarioAdminId = (req as any).user?.usuarioId;
    const params = req.params as Record<string, string>
    const estudianteId = params.id;

    if (!usuarioAdminId) {
      throw new AppError(
        "No autorizado: falta información del usuario.",
        401,
        "NO_AUTORIZADO"
      );
    }

    if (!estudianteId) {
      throw new AppError("El ID del estudiante es obligatorio.", 400, "ID_REQUERIDO", [
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
      gradoAcademico: req.body.gradoAcademico,
      institucionEducativa: req.body.institucionEducativa,
      consentimientoUsoImagen: req.body.consentimientoUsoImagen,
      reportaDiscapacidad: req.body.reportaDiscapacidad,
      
    };

    // Eliminar claves undefined para permitir actualizaciones parciales (PATCH/PUT flexible)
    Object.keys(data).forEach((key) => {
      if ((data as any)[key] === undefined) {
        delete (data as any)[key];
      }
    });

    const estudianteActualizado = await actualizarDatosEstudiante(estudianteId, data, usuarioAdminId);

    return res.status(200).json({
      success: true,
      message: "Datos del estudiante actualizados correctamente",
      data: estudianteActualizado,
    });

  } catch (error: unknown) {
    return next(mapEstudianteError(error));
  }
};

export const actualizarDatosContactoEstudianteController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const usuarioAdminId = (req as any).user?.usuarioId;
    const params = req.params as Record<string, string>;
    const estudianteId = params.id;

    if (!usuarioAdminId) {
      throw new AppError(
        "No autorizado: falta información del usuario.",
        401,
        "NO_AUTORIZADO",
      );
    }

    if (!estudianteId) {
      throw new AppError("El ID del estudiante es obligatorio.", 400, "ID_REQUERIDO", [
        { field: "id", message: "Este parámetro es obligatorio." },
      ]);
    }

    let contactosRecibidos: unknown = req.body?.contactos;
    if (typeof contactosRecibidos === "string") {
      try {
        contactosRecibidos = JSON.parse(contactosRecibidos);
      } catch {
        throw new AppError(
          "El formato de los contactos no es un JSON válido.",
          400,
          "CONTACTOS_INVALIDOS",
        );
      }
    }

    if (!Array.isArray(contactosRecibidos) || contactosRecibidos.length === 0) {
      throw new AppError(
        "Debe enviar al menos un contacto para actualizar.",
        400,
        "CONTACTOS_FALTANTES",
      );
    }

    const contactos: DatosActualizacionContacto[] = contactosRecibidos.map(
      (contacto: unknown, index: number) => {
        if (typeof contacto !== "object" || contacto === null || Array.isArray(contacto)) {
          throw new AppError(
            `El contacto en la posición ${index} no tiene un formato válido.`,
            400,
            "CONTACTOS_INVALIDOS",
          );
        }

        const datos = contacto as Record<string, unknown>;
        const {
          id,
          tipo,
          nombre,
          apellidos,
          telefono,
          parentesco,
          tipoDocumento,
          numeroDocumento,
          direccion,
          ocupacion,
        } = datos;

        if (
          (tipo !== "ACUDIENTE_LEGAL" && tipo !== "EMERGENCIA") ||
          typeof nombre !== "string" ||
          typeof apellidos !== "string" ||
          typeof telefono !== "string" ||
          typeof parentesco !== "string" ||
          (id !== undefined && typeof id !== "string") ||
          (tipoDocumento !== undefined && tipoDocumento !== null && typeof tipoDocumento !== "string") ||
          (numeroDocumento !== undefined && numeroDocumento !== null && typeof numeroDocumento !== "string") ||
          (direccion !== undefined && direccion !== null && typeof direccion !== "string") ||
          (ocupacion !== undefined && ocupacion !== null && typeof ocupacion !== "string")
        ) {
          throw new AppError(
            `Los datos del contacto en la posición ${index} son inválidos.`,
            400,
            "CONTACTOS_INVALIDOS",
          );
        }

        return {
          ...(typeof id === "string" ? { id } : {}),
          tipo,
          nombre,
          apellidos,
          telefono,
          parentesco,
          tipoDocumento,
          numeroDocumento,
          direccion,
          ocupacion,
        };
      },
    );

    const contactosActualizados = await actualizarDatosContacto(
      estudianteId,
      contactos,
      usuarioAdminId,
    );

    return res.status(200).json({
      success: true,
      message: "Datos de contacto del estudiante actualizados correctamente.",
      data: contactosActualizados,
    });
  } catch (error: unknown) {
    return next(mapEstudianteError(error));
  }
};


export const actualizarDocumentosEstudianteController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const uploadFilesPaths: string[] = []; // Para limpieza local si ocurre error
  let requestSucceeded = false;
  try {
    const usuarioAdminId = (req as any).user?.usuarioId;
    const params = req.params as Record<string, string>;
    const estudianteId = params.id;

    if (!usuarioAdminId) {
      throw new AppError(
        "No autorizado: falta información del usuario en el token.",
        401,
        "NO_AUTORIZADO"
      );
    }

    if (!estudianteId) {
      throw new AppError(
        "El ID del estudiante es obligatorio en los parámetros.",
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
        if (fieldname === 'profilePicture') carpetaSupabase = 'Estudiantes/FotosPerfil';
        if (fieldname === 'identityDocument') carpetaSupabase = 'Estudiantes/DocumentosIdentidad';
        if (fieldname === 'disabilityCertificate') carpetaSupabase = 'Estudiantes/CertificadosDiscapacidad';
        if (fieldname === 'firmaDigital') carpetaSupabase = "Estudiantes/FirmasDigitales"
        
        const storagePath = await subirArchivo(
          file.path,
          carpetaSupabase,
          file.mimetype
        );

        documentPaths[fieldname] = storagePath;
      }
    }

    // 2. Ejecutar servicio de actualización transaccional
    await actualizarDocumentosEstudianteService(estudianteId, documentPaths, usuarioAdminId);

    requestSucceeded = true;
    return res.status(200).json({
      success: true,
      message: "Documentos del estudiante actualizados con éxito (versiones anteriores archivadas como inactivas)",
      data:{
        documentPaths
      }
    });

  } catch (error: unknown) {
    return next(mapEstudianteError(error));
  } finally {
    if (requestSucceeded) {
      await cleanupTemporaryFiles(uploadFilesPaths);
    }
  }
};