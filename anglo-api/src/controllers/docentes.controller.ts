// se maneja la peticion http extrayendo los datos del req.body y llamndo el servicio desede docente.service.ts
import { Request, Response } from "express";
import {
  registrarDocente,
  obtenerDocentes,
  generarCodigoDOcente,
  obtenerDocenteConArchivosPorId,
  //actualizarDocente,
  cambiarEstadoDocente,
  actualizarDatosDocente,
  actualizarDocumentosDocenteService

} from "../services/docente.service.js";
import {subirArchivo, obtenerUrlFirmada} from "../services/storage.service.js";
import {guardarOActualizarArchivosEnBD} from "../services/archivos.service.js";
import type { InsertDocente } from "../types/docentes.types.js";
import { EstadoDocente } from "../types/docentes.types.js";
import fs from "fs/promises";



export const registrarDocenteController = async (
  req: Request,
  res: Response,
) => {
  const uploadFilesPaths: string[] = []; // Para limpieza si ocurre un error global
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
      return res.status(400).json({
        success: false,
        error: `Faltan archivos obligatorios: ${archivosFaltantes.join(', ')}`,
      });
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

    console.log(data+"datos del docente a registrar","archivos subidos: ", uploadFilesPaths);
    // (Opcional por seguridad) Validar que exista
    if (!usuarioAdminId) {
      return res.status(401).json({ success: false, error: 'No autorizado: Falta información del usuario en el token' });
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

    return res.status(201).json({
      success: true,
      message: "Docente registrado con éxito",
      data: nuevoDocente, documentPaths: documentPaths // Retornamos las rutas de los documentos subidos,
    });
  } catch (error: any) {
    for (const filePath of uploadFilesPaths) {
        await fs.unlink(filePath).catch(() => {});
      }
        // =================================================================
  // NUEVA VALIDACIÓN: Interceptar errores de lógica de negocio
  // =================================================================
  if (error.message === "DOCUMENTO_IDENTIDAD_DUPLICADO") {
    return res.status(400).json({
      status: "error",
      tipo: "VALIDACION_NEGOCIO",
      error: "El número de documento de identidad ingresado ya se encuentra registrado en el sistema."
    });
  
}
      console.error('Error al registrar estudiante:', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Error interno al registrar el docente'
      });
  
}finally{
  for (const filePath of uploadFilesPaths) {
      await fs.unlink(filePath).catch(() => {});
    }
}
}

// obetner usuarios controller

export const listarDocentesController =  async (req: Request, res: Response) => {

  try{
    
    const estado = req.query.estado as string | undefined;
    const busqueda = req.query.busqueda as string | undefined;
   const docentesListados = await obtenerDocentes({estado, busqueda});
    return res.status(200).json({
      success:true,
      mensaje: 'Docentes listados exitosamente',
      data: docentesListados,
    });

  }catch(error: any){
    console.error('Error al listar docentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al obtener los docentes.',
      error: error.message,
    });

  }



}


// controlador para obetner los datos del docente y los documentos mediante url
export const obtenerDocenteConArchivosPorIdController = async (req: Request, res: Response) => {
    try{

        const params = req.params as Record<string, string>;
        const id = params.id;
        if(!id){
          return res.status(400).json({
            success:false,
            message: "El ID del docente es obligatorio"
          });
          return;
        }
        console.log("ID del docente a buscar:", id);

        // servicio unifiado para datos y archivos
        const docenteConArchivos = await obtenerDocenteConArchivosPorId(id as string);

        if(!docenteConArchivos){
            return res.status(404).json({
                success:false,message: "Docente no encontrado"
        });
    }
        return res.status(200).json({
            success:true,
            message: "Dcoente encontrado exitosamente",
            data: docenteConArchivos
        });

    }catch(error: any){
      if(error.message === "DOCENTE_NO_ENCONTRADO") {
        return res.status(404).json({
          success: false,
          message: "Docente no encontrado",
        });
      }


        return res.status(500).json(
            {
                success:false,
                message: 'error interno al obtner el usuario',
                error: error.message
            }
        );
    }
}

export const cambiarEstadoDocenteController = async (req: Request, res: Response) =>{

  try {
    const { id } = req.params;
    const { nuevoEstado, motivoInactivacion } = req.body;

    // Validación rápida en el controlador de que el estado enviado sea válido en el ENUM
    if (!Object.values(EstadoDocente).includes(nuevoEstado)) {
      return res.status(400).json({
        success: false,
        error: "El estado proporcionado no es válido."
      });
    }

    // Llamamos al servicio pasando los parámetros estructurados
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

  } catch (error: any) {
    // Atrapamos los errores controlados del servicio
    if (error.message === "DOCENTE_NO_ENCONTRADO") {
      return res.status(404).json({ success: false, error: "El docente especificado no existe." });
    }
    
    if (error.message === "MOTIVO_INACTIVACION_REQUERIDO") {
      return res.status(400).json({ 
        success: false, 
        error: "Es obligatorio ingresar un motivo para inactivar al docente." 
      });
    }

    console.error("Error en actualizarEstadoController:", error);
    return res.status(500).json({ success: false, error: "Error interno del servidor." });
  }
}



export const actualizarDatosDocenteController = async (
  req: Request,
  res: Response,
) => {
  try {
    const usuarioAdminId = (req as any).user?.usuarioId;
    const params = req.params as Record<string, string>
    const docenteId = params.id;

    if (!usuarioAdminId) {
      return res.status(401).json({ success: false, error: 'No autorizado: Falta información del usuario' });
    }

    if (!docenteId) {
      return res.status(400).json({ success: false, error: 'El ID del docente es obligatorio' });
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

  } catch (error: any) {
    console.error('Error al actualizar datos del docente:', error);

    if (error.message === "DOCENTE_NO_ENCONTRADO") {
      return res.status(404).json({ success: false, error: "El docente especificado no existe." });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al actualizar los datos del docente'
    });
  }
};



export const actualizarDocumentosDocenteController = async (
  req: Request,
  res: Response,
) => {
  const uploadFilesPaths: string[] = []; // Para limpieza local si ocurre error
  try {
    const usuarioAdminId = (req as any).user?.usuarioId;
    const params = req.params as Record<string, string>;
    const docenteId = params.id;

    if (!usuarioAdminId) {
      return res.status(401).json({ success: false, error: 'No autorizado: Falta información del usuario en el token' });
    }

    if (!docenteId) {
      return res.status(400).json({ success: false, error: 'El ID del docente es obligatorio en los parámetros' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const documentPaths: Record<string, string> = {};

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({
        success: false,
        error: "Debe adjuntar al menos un documento para realizar la actualización.",
      });
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

    return res.status(200).json({
      success: true,
      message: "Documentos del docente actualizados con éxito (versiones anteriores archivadas como inactivas)",
      data:{
        documentPaths
      }
    });

  } catch (error: any) {
    // Limpieza de archivos locales en disco si hubo error
    for (const filePath of uploadFilesPaths) {
      await fs.unlink(filePath).catch(() => {});
    }

    console.error('Error al actualizar documentos del docente:', error);

    if (error.message === "DOCENTE_NO_ENCONTRADO") {
      return res.status(404).json({ success: false, error: "El docente especificado no existe en el sistema." });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al actualizar los documentos del docente'
    });
  } finally {
    // Garantizar limpieza de archivos temporales de Multer
    for (const filePath of uploadFilesPaths) {
      await fs.unlink(filePath).catch(() => {});
    }
  }
};