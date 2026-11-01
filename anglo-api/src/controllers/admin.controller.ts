// controlador encargado de manejar las peticiones hhtp del superadministrador y delegar la logica de negocio al servicio correspondiente admin.service.ts
import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.midleware.js";
import { AdminService } from "../services/admin.service.js";
import { crearUsuarioAdminSchema } from "../validators/user.validator.js";

export const crearUSuarioAdminController = async (req: AuthRequest, res: Response)=>{

    try{
        const datosValidados = crearUsuarioAdminSchema.parse(req.body);
        const resultado = await AdminService.crearUsuarioPorAdmin({
      primerNombre: datosValidados.primerNombre,
      segundoNombre: datosValidados.segundoNombre,
      primerApellido: datosValidados.primerApellido,
      segundoApellido: datosValidados.segundoApellido,
      documentoIdentidad: datosValidados.documentoIdentidad,
      diaCumpleanos: datosValidados.diaCumpleanos,
      rol: datosValidados.rol as  'COORD_ACADEMICO' | 'COORD_ADMINISTRATIVO',
    });
        return res.status(201).json({
            exito:true,
            mensaje:resultado,
        });
    }catch(error: any){

        return res.status(400).json({
            exito: false,
            error: error.message || 'Error al cambiar la contraseña',
        });
    };
}

// controaldor para listar los suaurios por rol y estado tambien se puede listar todos los usuarios sin filtros

export const listarUsuariosController = async (req: AuthRequest, res: Response) => {

    try{    
          const{rol,estado,busqueda} = req.query;
         const usuariosListados = await AdminService.obtenerUsuarios({rol: rol as string, estado: estado as string, busqueda: busqueda as string});

         return res.status(200).json({
            exito:true,
            mensaje: 'Usuarios listados exitosamente',
            datos: usuariosListados,
         });

    }catch(error: any){
        console.error('Error al listar usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno al obtener los usuarios.',
        error: error.message,
      });
    }


}

// conrolador para obtener el usuario por id.

export const obtenerUsuarioPorIdController = async (req: AuthRequest, res: Response) => {


    try{
        const {id} = req.params;
        // Verificamos que el ID esté presente
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'El ID del usuario es obligatorio.',
        });
        return;
      }
        const usuario = await AdminService.obtenerUsuarioPorId(id as string);
        if (!usuario){
            res.status(404).json({
          success: false,
          message: 'Usuario no encontrado.',
        });
        return;
        }
        res.status(200).json({
        success: true,
        data: usuario,
      });

    }catch(error: any){
        console.error('Error al obtener usuario por ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno al obtener el usuario.',
        error: error.message,
      });
    }
}

export const cambiarEstadoUsuarioController = async (req: AuthRequest, res: Response) => {

  try{
    const {id} = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'El ID del usuario es obligatorio.',
      });
      return;
    }
    const usuarioActualizado = await AdminService.cambiarEstadoUsuario(id as string);
    if (!usuarioActualizado) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `El estado del usuario ${usuarioActualizado.username} ha cambiado exitosamente a ${usuarioActualizado.estado}.`,
      data: usuarioActualizado,
    });

  }catch(error: any){
  console.error('Error al cambiar estado del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al cambiar el estado del usuario.',
      error: error.message,
    });


  }
  
}

export const restablecerContrasenaUsuarioController = async (req: AuthRequest, res: Response) => {


  try{
    const {id} = req.params;
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'El ID del usuario es obligatorio.',
      });
      return;
    }

    const resultado = await AdminService.restablecerContrasenaUsuario(id as string);
    res.status(200).json(resultado);

  }catch(error: any){
    console.error('Error al restablecer contraseña:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno al restablecer la contraseña.',
      });
  }
}