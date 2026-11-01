// este servicio tendra la logica de negocio y las funciones del superadministrador
//CrearUsuarios(CoordinadorAcademico,CoordinadorAdministrativo), cambiarRolUsuarios, CambiarEstadoUsuarios, ListarUsuarios, ListarUsuariosPorRol, ListarUsuariosPorEstado, restaurarContraseñaUsuarios.

import { eq, and, sql, ilike, or } from "drizzle-orm";
import { db } from "../config/db.js";
import { encriptarPassword } from "../utils/security.utils.js";
import { generarUsername } from "../utils/security.utils.js";

import {
  usuarios,
  docentes,
  estudiantes,
  rolUsuarioEnum,
  estadoUsuarioEnum,
  coordinadores,
} from "../config/db/schema.js";
import { es } from "zod/locales";
import { success } from "zod";

export const AdminService = {
  // creacion del usuario por parte del superAdmin en este caso 'COORD_ACADEMICO', 'COORD_ADMINISTRATIVO'

  crearUsuarioPorAdmin: async (datos: {
    primerNombre: string;
    segundoNombre?: string;
    primerApellido: string;
    segundoApellido?: string;
    documentoIdentidad: string;
    diaCumpleanos: number;
    rol: "COORD_ACADEMICO" | "COORD_ADMINISTRATIVO";
  }) => {
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
    // 3. Usamos una transacción para asegurar que o se guardan ambos (usuario y coordinador) o ninguno

    const resultado = await db.transaction(async (tx) => {
      // 3.1. instertar el nuevo usuario administrativo a la base de datos
      const [nuevoUsuario] = await tx
        .insert(usuarios)
        .values({
          username,
          contrasenaHash,
          rol: datos.rol,
          estado: "ACTIVO",
          requiereCambioContrasena: true,
          versionToken: 1,
        })
        .returning();

      // 3.2. Insertar los datos personales en la tabla coordinadores usando el usuarioId generado
      await tx.insert(coordinadores).values({
        usuarioId: nuevoUsuario.usuarioId,
        primerNombre: datos.primerNombre,
        segundoNombre: datos.segundoNombre,
        primerApellido: datos.primerApellido,
        segundoApellido: datos.segundoApellido,
        documentoIdentidad: datos.documentoIdentidad,
        diaCumpleanos: datos.diaCumpleanos,
      });
      // retorno el nuevo suaurio el cual ya tambien se registro en la tabla coordimnadores
      return nuevoUsuario;
    });
    // 4. Retornar la respuesta final una vez completada la transacción con éxito
    return {
      usuarioId: resultado.usuarioId,
      username: resultado.username,
      rol: resultado.rol,
      estado: resultado.estado,
      mensaje: `Usuario ${resultado.username} creado exitosamente. La contraseña temporal es su número de documento.`,
    };
  },

  obtenerUsuarios: async (filtros?: {
    rol?: string;
    estado?: string;
    busqueda?: string;
  }) => {
    // obtiene todos los usurios de la base de datos con filtros opcionales por rol y estado
    const conditions = [];
    if (filtros?.rol) {
      conditions.push(eq(usuarios.rol, filtros.rol as any));
    }
    if (filtros?.estado) {
      conditions.push(eq(usuarios.estado, filtros.estado as any));
    }

    // filtros de busqueda global para obtener (nombre, apellidos, documento de identidad o username)
    if (filtros?.busqueda) {
      const termino = `%${filtros.busqueda}%`;
      conditions.push(
        ilike(
          sql`CONCAT(
            COALESCE(${usuarios.username}, ''), ' ',
            COALESCE(${coordinadores.primerNombre}, ''), ' ',
            COALESCE(${coordinadores.primerApellido}, ''), ' ',
            COALESCE(${docentes.nombre}, ''), ' ',
            COALESCE(${docentes.apellidos}, ''), ' ',
            COALESCE(${estudiantes.nombre}, ''), ' ',
            COALESCE(${estudiantes.apellidos}, ''), ' ',
            COALESCE(${coordinadores.documentoIdentidad}, ''), ' ',
            COALESCE(${docentes.numeroDocumento}, ''), ' ',
            COALESCE(${estudiantes.numeroDocumento}, '')
          )`,
          termino,
        ),
      );
    }

    // se hace una consulta d ebase de datos con join : para poder obtener el nombre completo del usuario y su documento de identidad desde la tabla coordinadores,estudiantes y docentes ,ya que los usuarios administrativos se registran en ambas tablas (usuarios y coordinadores)

    const query = db
      .select({
        usuarioId: usuarios.usuarioId,
        username: usuarios.username,
        rol: usuarios.rol,
        estado: usuarios.estado,
        requiereCambioContrasena: usuarios.requiereCambioContrasena,
        createAt: usuarios.createdAt,
        updatedAt: usuarios.updatedAt,
        // Agregamos los mismos campos unificados para la lista completa
        nombre: sql<string>`COALESCE(${coordinadores.primerNombre}, ${docentes.nombre}, ${estudiantes.nombre}, 'N/A')`,
        apellidos: sql<string>`COALESCE(${coordinadores.primerApellido}, ${docentes.apellidos}, ${estudiantes.apellidos}, '')`,
        documentoIdentidad: sql<string>`COALESCE(${coordinadores.documentoIdentidad}, ${docentes.numeroDocumento}, ${estudiantes.numeroDocumento}, 'N/A')`,
      })
      .from(usuarios)
      .leftJoin(coordinadores, eq(usuarios.usuarioId, coordinadores.usuarioId))
      .leftJoin(docentes, eq(usuarios.usuarioId, docentes.usuarioId))
      .leftJoin(estudiantes, eq(usuarios.usuarioId, estudiantes.usuarioId));
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    return await query;
  },

  //obtener usuaurio por id.
  obtenerUsuarioPorId: async (usuarioId: string) => {
    const [usuario] = await db
      .select({
        usuarioId: usuarios.usuarioId,
        username: usuarios.username,
        rol: usuarios.rol,
        estado: usuarios.estado,
        requiereCambioContrasena: usuarios.requiereCambioContrasena,
        createAt: usuarios.createdAt,
        updatedAt: usuarios.updatedAt,
        // Agregamos los mismos campos unificados para la lista completa
        nombre: sql<string>`COALESCE(${coordinadores.primerNombre}, ${docentes.nombre}, ${estudiantes.nombre}, 'N/A')`,
        apellidos: sql<string>`COALESCE(${coordinadores.primerApellido}, ${docentes.apellidos}, ${estudiantes.apellidos}, '')`,
        documentoIdentidad: sql<string>`COALESCE(${coordinadores.documentoIdentidad}, ${docentes.numeroDocumento}, ${estudiantes.numeroDocumento}, 'N/A')`,
      })
      .from(usuarios)
      .leftJoin(coordinadores, eq(usuarios.usuarioId, coordinadores.usuarioId))
      .leftJoin(docentes, eq(usuarios.usuarioId, docentes.usuarioId))
      .leftJoin(estudiantes, eq(usuarios.usuarioId, estudiantes.usuarioId))
      .where(eq(usuarios.usuarioId, usuarioId))
      .limit(1);
    return usuario || null;
  },

  cambiarEstadoUsuario: async (usuarioId: string) => {
    // 1. consultar el usuario por id para verificar si existe
    const [usuario] = await db
      .select({
        usuarioId: usuarios.usuarioId,
        username: usuarios.username,
        estado: usuarios.estado,
      })
      .from(usuarios)
      .where(eq(usuarios.usuarioId, usuarioId))
      .limit(1);

    if (!usuario) {
      throw new Error("Usuario no encontrado");
      return null;
    }
    //2. determinar el nuevoe stado invertido
    const nuevoEstado = usuario.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    //3. actualizar el estado del usuario en la base de datos
    const [usuarioActualizado] = await db
      .update(usuarios)
      .set({ estado: nuevoEstado, updatedAt: new Date() })
      .where(eq(usuarios.usuarioId, usuarioId))
      .returning({
        usuarioId: usuarios.usuarioId,
        username: usuarios.username,
        estado: usuarios.estado,
        updatedAt: usuarios.updatedAt,
      });
    return usuarioActualizado;
  },

  restablecerContrasenaUsuario: async (usuarioId: string) => {
    const [usuario] = await db
      .select({
        usuarioId: usuarios.usuarioId,
        username: usuarios.username,
        documentoIdentidad:sql<string>`COALESCE(${coordinadores.documentoIdentidad}, ${docentes.numeroDocumento}, ${estudiantes.numeroDocumento}, '')`,
      })
      .from(usuarios)
      .leftJoin(coordinadores, eq(usuarios.usuarioId, coordinadores.usuarioId))
      .leftJoin(docentes, eq(usuarios.usuarioId, docentes.usuarioId))
      .leftJoin(estudiantes, eq(usuarios.usuarioId, estudiantes.usuarioId))
      .where(eq(usuarios.usuarioId, usuarioId))
      .limit(1);

      if (!usuario) {
      throw new Error("Usuario no encontrado");
      
      }
      if (!usuario.documentoIdentidad) {  
      throw new Error("No se puede restablecer la contraseña: No se encontró el documento de identidad del usuario.");
      }

      //2 hashear la contraseña temporal con el documento de identidad del usuario
    const nuevaContrasenaHash = await encriptarPassword(usuario.documentoIdentidad);

    //3. actualizar en la base de datos con el nuevo hash de contraseña, poner el flag requiereCambioContrasena en true y aumentar el versionToken para invalidar sesiones anteriores

    const [usuarioActualizado] = await db
    .update(usuarios)
    .set({contrasenaHash: nuevaContrasenaHash, requiereCambioContrasena: true, versionToken: sql`${usuarios.versionToken} + 1`, updatedAt: new Date()})
    .where(eq(usuarios.usuarioId, usuarioId))
    .returning({
        usuarioId: usuarios.usuarioId,
        username: usuarios.username,
        estado: usuarios.estado,
        requiereCambioContrasena: usuarios.requiereCambioContrasena,
        versionToken: usuarios.versionToken,
        updatedAt: usuarios.updatedAt,
    });


    return{
      succes: true,
      mensaje: `Contraseña restablecida exitosamente para el usuario ${usuario.username}. La nueva contraseña temporal es su número de documento.`,
      usuario: usuarioActualizado,
    };
  
    
    },

};
