// este servicio tendra la logica de negocio y las funciones del superadministrador
//CrearUsuarios(CoordinadorAcademico,CoordinadorAdministrativo), cambiarRolUsuarios, CambiarEstadoUsuarios, ListarUsuarios, ListarUsuariosPorRol, ListarUsuariosPorEstado, restaurarContraseñaUsuarios.

import { eq, and, sql, ilike, exists, inArray } from "drizzle-orm";
import { db } from "../config/db.js";
import { encriptarPassword } from "../utils/security.utils.js";
import { generarUsername } from "../utils/security.utils.js";

import {
  usuarios,
  usuarioRoles,
  docentes,
  estudiantes,
  rolUsuarioEnum,
  coordinadores,
} from "../config/db/schema.js";

type RolUsuario = (typeof rolUsuarioEnum.enumValues)[number];

const obtenerRolesPorUsuarios = async (usuarioIds: string[]) => {
  if (usuarioIds.length === 0) {
    return new Map<string, RolUsuario[]>();
  }

  const asignaciones = await db
    .select({ usuarioId: usuarioRoles.usuarioId, rol: usuarioRoles.rol })
    .from(usuarioRoles)
    .where(inArray(usuarioRoles.usuarioId, usuarioIds));
  const rolesPorUsuario = new Map<string, RolUsuario[]>();

  for (const { usuarioId, rol } of asignaciones) {
    const roles = rolesPorUsuario.get(usuarioId) ?? [];
    roles.push(rol);
    rolesPorUsuario.set(usuarioId, roles);
  }

  return rolesPorUsuario;
};

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
      const coordinadorExistente = await tx
        .select({ usuarioId: coordinadores.usuarioId })
        .from(coordinadores)
        .where(eq(coordinadores.documentoIdentidad, datos.documentoIdentidad))
        .limit(1);

      if (coordinadorExistente.length > 0) {
        throw new Error("DOCUMENTO_IDENTIDAD_DUPLICADO");
      }

      // 3.1. Crear la cuenta y asignar el rol en la tabla intermedia dentro de la misma transacción.
      const [nuevoUsuario] = await tx
        .insert(usuarios)
        .values({
          username,
          contrasenaHash,
          estado: "ACTIVO",
          requiereCambioContrasena: true,
          versionToken: 1,
        })
        .returning();

      await tx.insert(usuarioRoles).values({
        usuarioId: nuevoUsuario.usuarioId,
        rol: datos.rol,
      });

      // 3.2. Insertar los datos personales del coordinador con el ID de la cuenta creada.
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
      roles: [datos.rol],
      estado: resultado.estado,
      mensaje: `Usuario ${resultado.username} creado exitosamente. La contraseña temporal es su número de documento.`,
    };
  },

  buscarUsuarioParaPromocionCoordinador: async (documentoIdentidad: string) => {
    // Buscar coincidencias exactas en perfiles que pueden estar asociados a una cuenta.
    const [docente, estudiante, coordinador] = await Promise.all([
      db
        .select({
          usuarioId: usuarios.usuarioId,
          username: usuarios.username,
          documentoIdentidad: docentes.numeroDocumento,
          nombre: docentes.nombre,
          apellidos: docentes.apellidos,
          fechaNacimiento: docentes.fechaNacimiento,
          origen: sql<string>`'DOCENTE'`,
        })
        .from(docentes)
        .innerJoin(usuarios, eq(docentes.usuarioId, usuarios.usuarioId))
        .where(eq(docentes.numeroDocumento, documentoIdentidad))
        .limit(1),
      db
        .select({
          usuarioId: usuarios.usuarioId,
          username: usuarios.username,
          documentoIdentidad: estudiantes.numeroDocumento,
          nombre: estudiantes.nombre,
          apellidos: estudiantes.apellidos,
          fechaNacimiento: estudiantes.fechaNacimiento,
          origen: sql<string>`'ESTUDIANTE'`,
        })
        .from(estudiantes)
        .innerJoin(usuarios, eq(estudiantes.usuarioId, usuarios.usuarioId))
        .where(eq(estudiantes.numeroDocumento, documentoIdentidad))
        .limit(1),
      db
        .select({
          usuarioId: usuarios.usuarioId,
          username: usuarios.username,
          documentoIdentidad: coordinadores.documentoIdentidad,
          nombre: sql<string>`CONCAT_WS(' ', ${coordinadores.primerNombre}, ${coordinadores.segundoNombre})`,
          apellidos: sql<string>`CONCAT_WS(' ', ${coordinadores.primerApellido}, ${coordinadores.segundoApellido})`,
          fechaNacimiento: sql<string>`NULL`,
          origen: sql<string>`'COORDINADOR'`,
        })
        .from(coordinadores)
        .innerJoin(usuarios, eq(coordinadores.usuarioId, usuarios.usuarioId))
        .where(eq(coordinadores.documentoIdentidad, documentoIdentidad))
        .limit(1),
    ]);

    const perfiles = [...docente, ...estudiante, ...coordinador];
    const usuarioIds = [...new Set(perfiles.map(({ usuarioId }) => usuarioId))];
    if (usuarioIds.length === 0) {
      return null;
    }
    if (usuarioIds.length > 1) {
      throw new Error("DOCUMENTO_IDENTIDAD_AMBIGUO");
    }

    const perfil = perfiles[0];
    const roles = await db
      .select({ rol: usuarioRoles.rol })
      .from(usuarioRoles)
      .where(eq(usuarioRoles.usuarioId, perfil.usuarioId));

    return {
      ...perfil,
      roles: roles.map(({ rol }) => rol),
      rolesCoordinador: roles
        .map(({ rol }) => rol)
        .filter((rol) => rol === "COORD_ACADEMICO" || rol === "COORD_ADMINISTRATIVO"),
    };
  },

  convertirUsuarioEnCoordinador: async (
    documentoIdentidad: string,
    rol: "COORD_ACADEMICO" | "COORD_ADMINISTRATIVO",
  ) => {
    return db.transaction(async (tx) => {
      // Repetir la búsqueda dentro de la transacción para que perfil, coordinador y rol
      // se creen de forma atómica a partir de los datos persistidos, no del cliente.
      const [docente, estudiante, coordinador] = await Promise.all([
        tx
          .select({
            usuarioId: usuarios.usuarioId,
            username: usuarios.username,
            documentoIdentidad: docentes.numeroDocumento,
            nombre: docentes.nombre,
            apellidos: docentes.apellidos,
            fechaNacimiento: docentes.fechaNacimiento,
          })
          .from(docentes)
          .innerJoin(usuarios, eq(docentes.usuarioId, usuarios.usuarioId))
          .where(eq(docentes.numeroDocumento, documentoIdentidad))
          .limit(1),
        tx
          .select({
            usuarioId: usuarios.usuarioId,
            username: usuarios.username,
            documentoIdentidad: estudiantes.numeroDocumento,
            nombre: estudiantes.nombre,
            apellidos: estudiantes.apellidos,
            fechaNacimiento: estudiantes.fechaNacimiento,
          })
          .from(estudiantes)
          .innerJoin(usuarios, eq(estudiantes.usuarioId, usuarios.usuarioId))
          .where(eq(estudiantes.numeroDocumento, documentoIdentidad))
          .limit(1),
        tx
          .select({
            usuarioId: usuarios.usuarioId,
            username: usuarios.username,
            documentoIdentidad: coordinadores.documentoIdentidad,
            nombre: sql<string>`CONCAT_WS(' ', ${coordinadores.primerNombre}, ${coordinadores.segundoNombre})`,
            apellidos: sql<string>`CONCAT_WS(' ', ${coordinadores.primerApellido}, ${coordinadores.segundoApellido})`,
            diaCumpleanos: coordinadores.diaCumpleanos,
          })
          .from(coordinadores)
          .innerJoin(usuarios, eq(coordinadores.usuarioId, usuarios.usuarioId))
          .where(eq(coordinadores.documentoIdentidad, documentoIdentidad))
          .limit(1),
      ]);

      const perfiles = [
        ...docente.map((perfil) => ({ ...perfil, diaCumpleanos: Number(perfil.fechaNacimiento.slice(8, 10)) })),
        ...estudiante.map((perfil) => ({ ...perfil, diaCumpleanos: Number(perfil.fechaNacimiento.slice(8, 10)) })),
        ...coordinador,
      ];
      const perfilesUnicos = [...new Map(perfiles.map((perfil) => [perfil.usuarioId, perfil])).values()];

      if (perfilesUnicos.length === 0) {
        throw new Error("USUARIO_PROMOCION_NO_ENCONTRADO");
      }
      if (perfilesUnicos.length > 1) {
        throw new Error("DOCUMENTO_IDENTIDAD_AMBIGUO");
      }

      const perfil = perfilesUnicos[0];
      const [coordinadorExistente] = await tx
        .select({ id: coordinadores.id })
        .from(coordinadores)
        .where(eq(coordinadores.usuarioId, perfil.usuarioId))
        .limit(1);

      // Crear datos de coordinador solo cuando la cuenta todavía no tiene ese perfil.
      if (!coordinadorExistente) {
        const [primerNombre, ...otrosNombres] = perfil.nombre.trim().split(/\s+/);
        const [primerApellido, ...otrosApellidos] = perfil.apellidos.trim().split(/\s+/);

        await tx.insert(coordinadores).values({
          usuarioId: perfil.usuarioId,
          primerNombre,
          segundoNombre: otrosNombres.join(" ") || null,
          primerApellido,
          segundoApellido: otrosApellidos.join(" ") || null,
          documentoIdentidad: perfil.documentoIdentidad,
          diaCumpleanos: perfil.diaCumpleanos,
        });
      }

      // El rol se agrega sin quitar los otros roles de la cuenta.
      await tx
        .insert(usuarioRoles)
        .values({ usuarioId: perfil.usuarioId, rol })
        .onConflictDoNothing({
          target: [usuarioRoles.usuarioId, usuarioRoles.rol],
        });

      const rolesActualizados = await tx
        .select({ rol: usuarioRoles.rol })
        .from(usuarioRoles)
        .where(eq(usuarioRoles.usuarioId, perfil.usuarioId));

      return {
        usuarioId: perfil.usuarioId,
        username: perfil.username,
        documentoIdentidad: perfil.documentoIdentidad,
        roles: rolesActualizados.map(({ rol: rolAsignado }) => rolAsignado),
      };
    });
  },

  obtenerUsuarios: async (filtros?: {
    rol?: string;
    estado?: string;
    busqueda?: string;
  }) => {
    // obtiene todos los usurios de la base de datos con filtros opcionales por rol y estado
    const conditions = [];
    if (filtros?.rol) {
      if (!(rolUsuarioEnum.enumValues as readonly string[]).includes(filtros.rol)) {
        throw new Error("ROL_INVALIDO");
      }
      const rol = filtros.rol as RolUsuario;
      conditions.push(
        exists(
          db
            .select({ usuarioId: usuarioRoles.usuarioId })
            .from(usuarioRoles)
            .where(
              and(
                eq(usuarioRoles.usuarioId, usuarios.usuarioId),
                eq(usuarioRoles.rol, rol),
              ),
            ),
        ),
      );
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
    const usuariosEncontrados =
      conditions.length > 0 ? await query.where(and(...conditions)) : await query;
    const rolesPorUsuario = await obtenerRolesPorUsuarios(
      usuariosEncontrados.map(({ usuarioId }) => usuarioId),
    );

    // Se adjunta la lista completa de roles sin duplicar filas de usuario por cada rol.
    return usuariosEncontrados.map((usuario) => ({
      ...usuario,
      roles: rolesPorUsuario.get(usuario.usuarioId) ?? [],
    }));
  },

  //obtener usuaurio por id.
  obtenerUsuarioPorId: async (usuarioId: string) => {
    const [usuario] = await db
      .select({
        usuarioId: usuarios.usuarioId,
        username: usuarios.username,
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
    if (!usuario) {
      return null;
    }

    const rolesPorUsuario = await obtenerRolesPorUsuarios([usuario.usuarioId]);
    return {
      ...usuario,
      roles: rolesPorUsuario.get(usuario.usuarioId) ?? [],
    };
  },

  asignarRolUsuario: async (usuarioId: string, rol: RolUsuario) => {
    return db.transaction(async (tx) => {
      // 1. Confirmar la cuenta antes de crear la asignación.
      const [usuario] = await tx
        .select({ usuarioId: usuarios.usuarioId })
        .from(usuarios)
        .where(eq(usuarios.usuarioId, usuarioId))
        .limit(1);

      if (!usuario) {
        throw new Error("Usuario no encontrado");
      }

      // 2. Agregar el rol sin borrar los existentes; repetir la petición es seguro.
      await tx
        .insert(usuarioRoles)
        .values({ usuarioId, rol })
        .onConflictDoNothing({
          target: [usuarioRoles.usuarioId, usuarioRoles.rol],
        });

      // 3. Devolver el estado final de roles para reflejar cualquier asignación previa.
      const roles = await tx
        .select({ rol: usuarioRoles.rol })
        .from(usuarioRoles)
        .where(eq(usuarioRoles.usuarioId, usuarioId));

      return roles.map(({ rol: rolAsignado }) => rolAsignado);
    });
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
