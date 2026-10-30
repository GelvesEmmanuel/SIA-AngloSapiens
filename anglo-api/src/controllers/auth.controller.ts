import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.midleware.js';
import { AuthService } from '../services/auth.service.js';
import { loginSchema, cambiarContrasenaSchema, crearUsuarioAdminSchema } from '../validators/auth.validator.js';
import { error } from 'console';
import { ca } from 'zod/locales';

export const loginController = async (req: AuthRequest, res: Response) => {
  try {
    // Validar datos de entrada con Zod
    const datosValidados = loginSchema.parse(req.body);
    
    // Llamar al servicio
    const resultado = await AuthService.login(
      datosValidados.username, 
      datosValidados.contrasena
    );

    return res.status(200).json({
      exito: true,
      mensaje: 'Inicio de sesión exitoso',
      datos: resultado,
    });
  } catch (error: any) {
    return res.status(400).json({
      exito: false,
      error: error.message || 'Error en la autenticación',
    });
  }
};

export const cambiarContrasenaController = async (req: AuthRequest, res: Response) => {
  try {
    // Validar datos de entrada con Zod
    const datosValidados = cambiarContrasenaSchema.parse(req.body);
    const usuarioId = req.user?.usuarioId;

    if (!usuarioId) {
      return res.status(401).json({ exito: false, error: 'No autorizado' });
    }

    const resultado = await AuthService.cambiarContrasena(
      usuarioId,
      datosValidados.contrasenaActual,
      datosValidados.nuevaContrasena
    );

    return res.status(200).json({
      exito: true,
      ...resultado,
    });
  } catch (error: any) {
    return res.status(400).json({
      exito: false,
      error: error.message || 'Error al cambiar la contraseña',
    });
  }
};

export const crearUSuarioAdminController = async (req: AuthRequest, res: Response)=>{

    try{
        const datosValidados = crearUsuarioAdminSchema.parse(req.body);
        const resultado = await AuthService.crearUsuarioPorAdmin({
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

export const cerrarSesionUsuarioController = async (req: AuthRequest, res: Response) =>{


  try{
    //1 extrare iddel usuario autenticado de forma segura desde el token(midleare verificar token)
    const usuarioId =(req as any).user?.usuarioId;
    if (!usuarioId){
      return res.status(401).json({
        succes: false,
        error: 'No autorizado: No se encontro la sesion activa en la peticion'
      })
    }
    // 2. ejecutar logica del servicio para invalidar el token
      const resultado = await AuthService.cerrarSesion(usuarioId);

      return res.status(200).json({
        succes:true,
        error: resultado.mensaje,
      })
  }catch(error: any){
    console.error('Error al cerrar sesión:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al cerrar sesión',
    });

  };
};