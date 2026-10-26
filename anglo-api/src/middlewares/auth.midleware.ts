import {Request,Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken'
import {eq} from 'drizzle-orm'
import {db} from '../config/db.js'
import { usuarios } from '../config/db/schema.js';

const JWT_SECRET = process.env.JWT_SECRET;

// interfaz extendidad prar incluir los datps del usuario en la requeste de express
export interface AuthRequest extends Request{
    user?:{

        usuarioId: string;
        username: string;
        rol: string;
        estado: string;
        versionToken: number;
        requiereCambioContrasena: boolean;

    };
}

export const verificarToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado o formato inválido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verificar la firma y vigencia del JWT
    const decoded = jwt.verify(token, JWT_SECRET as string) as any;

    // 2. Validación de seguridad en Base de Datos (RQF-SEG-01 y RQF-SEG-02)
    // Comparamos el versionToken y el estado actual para revocar accesos inmediatamente si es necesario.
    const [usuarioActual] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.usuarioId, decoded.usuarioId));

    if (!usuarioActual) {
      return res.status(401).json({ error: 'Usuario no encontrado o sesión inválida' });
    }

    if (usuarioActual.estado !== 'ACTIVO') {
      return res.status(403).json({ error: 'Su cuenta se encuentra inactiva. Contacte al administrador.' });
    }

    if (usuarioActual.versionToken !== decoded.versionToken) {
      return res.status(401).json({ error: 'La sesión ha sido invalidada o expiró. Por favor inicie sesión nuevamente.' });
    }

    // 3. Control de cambio obligatorio de contraseña (RQF-SEG-01 / RQF-SEG-04)
    if (
      usuarioActual.requiereCambioContrasena &&
      !req.path.includes('/cambiar-contrasena')
    ) {
      return res.status(403).json({
        error: 'Debe actualizar su contraseña temporal antes de continuar.',
        requiereCambioContrasena: true,
      });
    }

    // Inyectar la identidad validada en la petición
    req.user = {
      usuarioId: usuarioActual.usuarioId,
      username: usuarioActual.username,
      rol: usuarioActual.rol,
      estado: usuarioActual.estado,
      versionToken: usuarioActual.versionToken,
      requiereCambioContrasena: usuarioActual.requiereCambioContrasena,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware para validación de Roles (RBAC - RQF-SEG-02)
export const autorizarRoles = (...rolesPermitidos: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No cuenta con los permisos necesarios para realizar esta acción' });
    }
    next();
  };
};