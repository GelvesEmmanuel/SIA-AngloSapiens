// se maneja la peticion http extrayendo los datos del req.body y llamndo el servicio desede docente.service.ts
import { Request, Response } from "express";
import {
  registrarDocente,
  obtnerDocentes,
  //obtenerDocentePorId,
  //actualizarDocente
} from "../services/docente.service.js";
import type { InsertDocente } from "../types/docentes.types.js";

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
  try {
    // Agrupamos limpiamente los campos en el objeto data
    const data: InsertDocente = {
      codigo: req.body.codigo,
      usuarioId: req.body.usuarioId ?? null,

      tipoDocumento: req.body.tipoDocumento,
      numeroDocumento: req.body.numeroDocumento,

      nombre: req.body.nombre,
      apellidos: req.body.apellidos,
      fechaNacimiento: req.body.fechaNacimiento,

      telefono: req.body.telefono ?? null,
      formacionAcademica: req.body.formacionAcademica ?? null,

      reportaDiscapacidad: req.body.reportaDiscapacidad ?? false,
    };

    console.log(data);
    // Pasamos el objeto completo al servicio
    const nuevoDocente = await registrarDocente(data);

    return res.status(201).json({
      success: true,
      message: "Docente registrado con éxito",
      data: nuevoDocente,
    });
  } catch (error) {
    return res.status(500).json("Docente no pudo er registrado");
  }
};

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
