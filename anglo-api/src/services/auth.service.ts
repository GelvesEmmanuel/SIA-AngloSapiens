import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js' // Ajusta la ruta a tu instancia de Drizzle según tu estructura
import { usuarios } from '../config/db/schema.js'; // Ajusta la ruta a tu esquema de usuarios
import { compararPassword, encriptarPassword, generarUsername } from '../utils/security.utils.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const AuthService = {


  // creacion del usuario por parte del superAdmin en este caso 'COORD_ACADEMICO', 'COORD_ADMINISTRATIVO'

  crearUsuarioPorAdmin: async(datos:{
    primerNombre: string;
    segundoNombre?: string;
    primerApellido: string;
    segundoApellido?: string;
    documentoIdentidad: string;
    diaCumpleanos: number;
    rol: 'COORD_ACADEMICO' | 'COORD_ADMINISTRATIVO';
  })=>{

    //1 generar username algoritmicamente

    const username = generarUsername(

      datos.primerNombre,
      datos.primerApellido,
      datos.diaCumpleanos,
      datos.segundoNombre,
      datos.segundoApellido,
    );
    //2 . la contraseña temporal por defecto documentoIdentidad
    const contrasenaHash = await encriptarPassword(datos.documentoIdentidad);

  // 3. instertar el nuevo usuario administrativo a la base de datos 
  const[nuevoUsuario]= await db.insert(usuarios).values({username,contrasenaHash, rol:datos.rol, estado: 'ACTIVO', requiereCambioContrasena: true, versionToken: 1})
  .returning();
  return{

    usuarioId: nuevoUsuario.usuarioId,
    username: nuevoUsuario.username,
    rol: nuevoUsuario.rol,
    estado: nuevoUsuario.estado,
    mensaje: `Usuario ${nuevoUsuario.username} creado exitosamente. La contraseña temporal es su número de documento.`,

  }


  },
  // RQF-SEG-01: Autenticación de Usuarios (Login)
  login: async (usernameInput: string, contrasenaPlain: string) => {
    // 1. Buscar el usuario por username
    const [usuario] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.username, usernameInput));

    // Mensaje genérico por seguridad (CA-02 del RQF-SEG-01)
    const errorMensajeGenerico = 'Credenciales incorrectas';

    if (!usuario) {
      throw new Error(errorMensajeGenerico);
    }

    // 2. Validación de Estado (CA-03 del RQF-SEG-01: ACTIVO / INACTIVO)
    if (usuario.estado !== 'ACTIVO') {
      throw new Error('Su cuenta se encuentra inactiva. Contacte al administrador.');
    }

    // 3. Validación de Contraseña con bcrypt
    const esPasswordValida = await compararPassword(contrasenaPlain, usuario.contrasenaHash);
    if (!esPasswordValida) {
      throw new Error(errorMensajeGenerico);
    }

    // 4. Generación del token JWT incluyendo id, rol, estado y versionToken (RQF-SEG-01 y RQF-SEG-02)
    const tokenPayload = {
      usuarioId: usuario.usuarioId,
      username: usuario.username,
      rol: usuario.rol,
      estado: usuario.estado,
      versionToken: usuario.versionToken,
      requiereCambioContrasena: usuario.requiereCambioContrasena,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET as string, { expiresIn: '8h' });

    return {
      token,
      requiereCambioContrasena: usuario.requiereCambioContrasena,
      rol: usuario.rol,
    };
  },

  // RQF-SEG-04: Cambio Obligatorio o Voluntario de Contraseña
  cambiarContrasena: async (
    usuarioId: string,
    contrasenaActual: string,
    nuevaContrasena: string
  ) => {
    // 1. Buscar usuario
    const [usuario] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.usuarioId, usuarioId));

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Verificar contraseña actual
    const esValida = await compararPassword(contrasenaActual, usuario.contrasenaHash);
    if (!esValida) {
      throw new Error('La contraseña actual es incorrecta');
    }

    // 3. Encriptar nueva contraseña
    const nuevoHash = await encriptarPassword(nuevaContrasena);

    // 4. Actualizar en base de datos: cambiar contraseña, poner flag en false e incrementar versionToken (invalida sesiones anteriores)
    await db
      .update(usuarios)
      .set({
        contrasenaHash: nuevoHash,
        requiereCambioContrasena: false,
        versionToken: usuario.versionToken + 1,
        updatedAt: new Date(),
      })
      .where(eq(usuarios.usuarioId, usuarioId));

    return {
      mensaje: 'Contraseña actualizada exitosamente. Por favor inicie sesión nuevamente.',
    };
  },
};