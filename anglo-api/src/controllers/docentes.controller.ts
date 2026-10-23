// se maneja la peticion http extrayendo los datos del req.body y llamndo el servicio desede docente.service.ts
import { Request, Response } from "express";
import {
  registrarDocente,
  obtnerDocentes,
  //obtenerDocentePorId,
  //actualizarDocente
} from "../services/docente.service.js";
import {subirArchivo, obtenerUrlFirmada} from "../services/storage.service.js";
import {guardarArchivosEnBD} from "../services/archivos.service.js";
import type { InsertDocente } from "../types/docentes.types.js";
import fs from "fs/promises";

export const obtenerDocentesController = async (
  req: Request,
  res: Response,
) => {
  try {
    const listaDocentes = await obtnerDocentes();
    console.log(listaDocentes);
    return res.status(200).json({
      succes: true,
      message: "Docentes obtenidos con exito",
      data: listaDocentes, // aqui va el arreglo que devolvio drizzle de la base de datos
    });
  } catch (error: any) {
    return res.status(500).json({
      succes: false,
      message: error.message,
    });
  }
};

export const registrarDocenteController = async (
  req: Request,
  res: Response,
) => {
  const uploadFilesPaths: string[] = []; // Para limpieza si ocurre un error global
  try {

    const rawUsuarioId = req.body.usuarioId;
    const usuarioIdLimpio = (!rawUsuarioId || rawUsuarioId === 'null' || rawUsuarioId === '') ? undefined : rawUsuarioId;
    // Agrupamos limpiamente los campos en el objeto data
    const data: InsertDocente = {
      codigo: req.body.codigo,
      usuarioId: usuarioIdLimpio,

      tipoDocumento: req.body.tipoDocumento,
      numeroDocumento: req.body.numeroDocumento,

      nombre: req.body.nombre,
      apellidos: req.body.apellidos,
      fechaNacimiento: req.body.fechaNacimiento,

      telefono: req.body.telefono ?? null,
      formacionAcademica: req.body.formacionAcademica ?? null,

      reportaDiscapacidad: req.body.reportaDiscapacidad ?? false,
    };
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const documentPaths: Record<string, string> = {};

    //1.procesar y subir los archivos a storage supabase si existen
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

    // Pasamos el objeto completo al servicio
    const nuevoDocente = await registrarDocente(data);

    if (Object.keys(documentPaths).length > 0) {
      await guardarArchivosEnBD(
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
      if (error.code === '23505') {
  return res.status(400).json({
    success: false,
    error: 'Ya existe un docente registrado con este número de documento o código.'
  });
}
      console.error('Error al registrar estudiante:', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Error interno al registrar el docente'
      });
  
};
}





/*
export const obtenerDocentePorIdController = async (req: Request, res: Response) => {
    try{
        const id = Number(req.params.id);
        const docente = await obtenerDocentePorId(id);

        if(!docente){
            return res.status(404).json({
                success:false,message: "Docente no encontrado"
        });
    }
        return res.status(200).json({
            succes:true,
            data:docente
        });

    }catch(error: any){
        return res.status(500).json(
            {
                success:false,
                message: error.message
            }
        );
    }
}

export const actualizarDocenteController = async (req: Request, res: Response) => {

try{
    const id= Number(req.params.id);
    //mapeamos lso campos que el cliente permite editar 

    const data: Partial<InsertDocente> = {
        nombre: req.body.nombre,
        apellido: req.body.apellido,
        correo: req.body.correo,
        telefono: req.body.telefono
    };

    console.log("Datos a actualizar:", data);
    const  docenteActualizado = await actualizarDocente(id, data);
    if(!docenteActualizado){
        return res.status( 404).json({

            succes:false,
            message: 'No se pudo actualizar. El docente  no existe'
        });
    }
    return res.status(200).json({
        succes:true,
        message: 'Docente actualizado con exito',

    });

}catch(error: any){
    return res.status(500).json({succes: false, massage: error.massage});
}

}

*/
