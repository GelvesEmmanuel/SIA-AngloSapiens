import { and, eq, isNull } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js' // Ajusta la ruta a tu instancia de Drizzle según tu estructura
import {
  archivos,
  coordinadores,
  docentes,
  estudiantes,
  usuarioRoles,
  usuarios,
} from '../config/db/schema.js';
import { compararPassword, encriptarPassword } from '../utils/security.utils.js';
import { obtenerUrlFirmada } from './storage.service.js';

const JWT_SECRET = process.env.JWT_SECRET;

const actualizarContrasena = async (
  usuarioId: string,
  contrasenaActual: string,
  nuevaContrasena: string,
  exigirContrasenaDiferente = false,
) => {
  const [usuario] = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.usuarioId, usuarioId));

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  const esValida = await compararPassword(contrasenaActual, usuario.contrasenaHash);
  if (!esValida) {
    throw new Error('La contraseña actual es incorrecta');
  }

  if (exigirContrasenaDiferente && contrasenaActual === nuevaContrasena) {
    throw new Error('La nueva contraseña debe ser diferente de la actual');
  }

  const nuevoHash = await encriptarPassword(nuevaContrasena);

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
};

export const AuthService = {

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

    // 4. Los roles asociados se incluyen como arreglo en la respuesta y el token.
    const rolesUsuario = await db
      .select({ rol: usuarioRoles.rol })
      .from(usuarioRoles)
      .where(eq(usuarioRoles.usuarioId, usuario.usuarioId));
    const roles = rolesUsuario.map(({ rol }) => rol);

    const tokenPayload = {
      usuarioId: usuario.usuarioId,
      username: usuario.username,
      roles,
      estado: usuario.estado,
      versionToken: usuario.versionToken,
      requiereCambioContrasena: usuario.requiereCambioContrasena,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET as string, { expiresIn: '8h' });

    return {
      token,
      requiereCambioContrasena: usuario.requiereCambioContrasena,
      roles,
    };
  },

  obtenerPerfil: async (usuarioId: string, roles: string[]) => {
    const [usuario] = await db
      .select({ username: usuarios.username })
      .from(usuarios)
      .where(eq(usuarios.usuarioId, usuarioId));
    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    let nombre = usuario.username;
    let entidad: { id: string; tipo: 'DOCENTE' | 'ESTUDIANTE' } | null = null;

    if (roles.includes('DOCENTE')) {
      const [docente] = await db
        .select({ id: docentes.id, nombre: docentes.nombre, apellidos: docentes.apellidos })
        .from(docentes)
        .where(and(eq(docentes.usuarioId, usuarioId), isNull(docentes.deletedAt)))
        .limit(1);
      if (docente) {
        nombre = `${docente.nombre} ${docente.apellidos}`;
        entidad = { id: docente.id, tipo: 'DOCENTE' };
      }
    }

    if (!entidad && roles.includes('ESTUDIANTE')) {
      const [estudiante] = await db
        .select({ id: estudiantes.id, nombre: estudiantes.nombre, apellidos: estudiantes.apellidos })
        .from(estudiantes)
        .where(and(eq(estudiantes.usuarioId, usuarioId), isNull(estudiantes.deletedAt)))
        .limit(1);
      if (estudiante) {
        nombre = `${estudiante.nombre} ${estudiante.apellidos}`;
        entidad = { id: estudiante.id, tipo: 'ESTUDIANTE' };
      }
    }

    if (!entidad) {
      const [coordinador] = await db
        .select({
          primerNombre: coordinadores.primerNombre,
          segundoNombre: coordinadores.segundoNombre,
          primerApellido: coordinadores.primerApellido,
          segundoApellido: coordinadores.segundoApellido,
        })
        .from(coordinadores)
        .where(eq(coordinadores.usuarioId, usuarioId))
        .limit(1);
      if (coordinador) {
        nombre = [
          coordinador.primerNombre,
          coordinador.segundoNombre,
          coordinador.primerApellido,
          coordinador.segundoApellido,
        ]
          .filter(Boolean)
          .join(' ');
      }
    }

    let fotoPerfil: string | null = null;
    if (entidad) {
      const [foto] = await db
        .select({ urlArchivo: archivos.urlArchivo })
        .from(archivos)
        .where(
          and(
            eq(archivos.entidadId, entidad.id),
            eq(archivos.tipoEntidad, entidad.tipo),
            eq(archivos.categoria, 'FOTO'),
            eq(archivos.estado, 'VIGENTE'),
          ),
        )
        .limit(1);
      if (foto) fotoPerfil = await obtenerUrlFirmada(foto.urlArchivo, 3600);
    }

    return { username: usuario.username, nombre, fotoPerfil, roles };
  },

  // RQF-SEG-04: Cambio Obligatorio o Voluntario de Contraseña
  cambiarContrasena: async (
    usuarioId: string,
    contrasenaActual: string,
    nuevaContrasena: string
  ) => {
    return actualizarContrasena(usuarioId, contrasenaActual, nuevaContrasena);
  },

  cambiarContrasenaDesdeSesion: async (
    usuarioId: string,
    contrasenaActual: string,
    nuevaContrasena: string,
  ) => {
    return actualizarContrasena(usuarioId, contrasenaActual, nuevaContrasena, true);
  },

  cerrarSesion: async(usuarioId: string) =>{
    //verificamos que exista el usuario
    const[usuario] = await db.select().from(usuarios).where(eq(usuarios.usuarioId, usuarioId));
     if (!usuario){
      throw new Error ('Usuario no encontrado')
     }

     // incrementamos el version token
     await db.update(usuarios).set({versionToken: usuario.versionToken +1,
      updatedAt: new Date(),
     }). where(eq(usuarios.usuarioId, usuarioId));
     return {
      succes: true,
      mensaje: 'Sesión cerrada exitosamente'
     }


  }




};