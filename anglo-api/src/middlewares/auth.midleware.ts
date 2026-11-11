import {Request,Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken'
import {eq} from 'drizzle-orm'
import {db} from '../config/db.js'
import { usuarioRoles, usuarios } from '../config/db/schema.js';
import { AppError } from '../utils/appError.utils.js';

const JWT_SECRET = process.env.JWT_SECRET;

// interfaz extendidad prar incluir los datps del usuario en la requeste de express
export interface AuthRequest extends Request{
    user?:{

        usuarioId: string;
        username: string;
        roles: string[];
        estado: string;
        versionToken: number;
        requiereCambioContrasena: boolean;

    };
}

export const verificarToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token no proporcionado o formato inválido.', 401, 'NO_AUTORIZADO'));
  }

  const token = authHeader.split(' ')[1];
  let decoded: any;

  try {
    decoded = jwt.verify(token, JWT_SECRET as string);
  } catch {
    return next(new AppError('Token inválido o expirado.', 401, 'TOKEN_INVALIDO'));
  }

  // Compara el token con el estado actual para permitir su revocación inmediata.
  const [usuarioActual] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.usuarioId, decoded.usuarioId));

  if (!usuarioActual) {
    return next(new AppError('Usuario no encontrado o sesión inválida.', 401, 'SESION_INVALIDA'));
  }

  if (usuarioActual.estado !== 'ACTIVO') {
    return next(new AppError(
      'Su cuenta se encuentra inactiva. Contacte al administrador.',
      403,
      'CUENTA_INACTIVA'
    ));
  }

  if (usuarioActual.versionToken !== decoded.versionToken) {
    return next(new AppError(
      'La sesión ha sido invalidada o expiró. Por favor inicie sesión nuevamente.',
      401,
      'SESION_INVALIDA'
    ));
  }

  if (
    usuarioActual.requiereCambioContrasena &&
    !req.path.includes('/cambiar-contrasena')
  ) {
    return next(new AppError(
      'Debe actualizar su contraseña temporal antes de continuar.',
      403,
      'CAMBIO_CONTRASENA_REQUERIDO',
      [{ field: 'requiereCambioContrasena', message: 'Actualice su contraseña antes de continuar.' }]
    ));
  }

  // Se consultan los roles vigentes en la BD para aplicar cambios sin depender del JWT emitido antes.
  const rolesActuales = await db
    .select({ rol: usuarioRoles.rol })
    .from(usuarioRoles)
    .where(eq(usuarioRoles.usuarioId, usuarioActual.usuarioId));

  req.user = {
    usuarioId: usuarioActual.usuarioId,
    username: usuarioActual.username,
    roles: rolesActuales.map(({ rol }) => rol),
    estado: usuarioActual.estado,
    versionToken: usuarioActual.versionToken,
    requiereCambioContrasena: usuarioActual.requiereCambioContrasena,
  };

  return next();
};

// Middleware para validación de Roles (RBAC - RQF-SEG-02)
export const autorizarRoles = (...rolesPermitidos: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // Basta con que el usuario tenga al menos uno de los roles permitidos por la ruta.
    if (!req.user || !req.user.roles.some((rol) => rolesPermitidos.includes(rol))) {
      return next(new AppError(
        'No cuenta con los permisos necesarios para realizar esta acción.',
        403,
        'PERMISOS_INSUFICIENTES'
      ));
    }
    return next();
  };
};