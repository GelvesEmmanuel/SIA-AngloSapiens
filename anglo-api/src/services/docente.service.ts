import { db } from "../config/db/conexion.js";
import {
  archivos,
  coordinadores,
  docentes,
  usuarioRoles,
  usuarios,
  grupos
} from "../config/db/schema.js";

import type {
  InsertDocente,
  Docente,
  FiltrosDocente,
  DocenteConExpediente
} from "../types/docentes.types.js";
import { EstadoDocente } from "../types/docentes.types.js";
import { eq, ilike, sql, and, inArray } from "drizzle-orm"; // usado para el filtro WHERE
import { desc } from "drizzle-orm";
import { crearUsuarioBaseParaModulo } from "../utils/usuario.utils.js";
import { registrarAuditoria } from "./auditoriaSis.service.js";
import {guardarOActualizarArchivosEnBD} from "./archivos.service.js";
import { obtenerUrlFirmada } from "./storage.service.js";
import { AppError } from "../utils/appError.utils.js";
export const registrarDocente = async (
  data: InsertDocente,
  usuarioAdminId: string,
) => {
  console.log(
    "entrando servicio - iniciando transacción atómica de docente y usuario",
  );

  // Usamos una transacción para que si algo falla, no quede huérfano ni el usuario ni el docente
  const resultado = await db.transaction(async (tx) => {
    // Validacion: DOcumento de indentidad unico
    const docenteExistente = await tx
      .select()
      .from(docentes)
      .where(eq(docentes.numeroDocumento, data.numeroDocumento))
      .limit(1);

    if (docenteExistente.length > 0) {
      throw new Error("DOCUMENTO_IDENTIDAD_DUPLICADO");
    }
    // 1. Extraer el día de cumpleaños de la fecha de nacimiento (viene en string ej: "1995-10-14")
    const fecha = new Date(data.fechaNacimiento);
    const diaCumpleanos = fecha.getDate(); // Extrae el número del día (ej: 14)

    // 2. Crear el usuario centralizado de seguridad llamando al helper reutilizable
    const nuevoUsuario = await crearUsuarioBaseParaModulo(tx, {
      nombre: data.nombre,
      apellidos: data.apellidos,
      numeroDocumento: data.numeroDocumento, // Se usa para la contraseña temporal (bcrypt)
      diaCumpleanos: diaCumpleanos, // Se usa para el algoritmo del username
      rol: "DOCENTE", // Automáticamente establece requiereCambioContrasena = true
    });

    // 3. Insertar el docente en la base de datos asignándole el usuarioId generado
    const [nuevoDocente] = await tx
      .insert(docentes)
      .values({
        ...data,
        usuarioId: nuevoUsuario.usuarioId, // Vinculamos la clave foránea de seguridad
      })
      .returning();
    // registrar auditoria del sistea de forma atomica
    await registrarAuditoria({
      usuarioId: usuarioAdminId, // O el ID del admin que está realizando la acción si lo tienes disponible en el req
      tablaAfectada: "docentes",
      registroId: nuevoDocente.id, // Asegúrate de que sea el ID de la tabla docentes
      accion: "CREATE",
      datosNuevos: {
        codigo: nuevoDocente.codigo,
        nombre: nuevoDocente.nombre,
        apellidos: nuevoDocente.apellidos,
        username: nuevoUsuario.username,
      },
      motivo: "Creación inicial de docente con usuario de acceso al SIA",
    });
    return {
      ...nuevoDocente,
      usernameGenerado: nuevoUsuario.username, // Opcional: para que el controlador o la respuesta sepan el usuario
    };
  });

  return resultado;
};

export const buscarUsuarioDisponibleParaDocencia = async (
  documentoIdentidad: string,
) => {
  // Solo se permite seleccionar cuentas existentes con perfil de coordinador.
  const [perfil] = await db
    .select({
      usuarioId: usuarios.usuarioId,
      username: usuarios.username,
      documentoIdentidad: coordinadores.documentoIdentidad,
      primerNombre: coordinadores.primerNombre,
      segundoNombre: coordinadores.segundoNombre,
      primerApellido: coordinadores.primerApellido,
      segundoApellido: coordinadores.segundoApellido,
    })
    .from(coordinadores)
    .innerJoin(usuarios, eq(coordinadores.usuarioId, usuarios.usuarioId))
    .where(eq(coordinadores.documentoIdentidad, documentoIdentidad))
    .limit(1);

  if (!perfil) {
    return null;
  }

  const [docenteExistente] = await db
    .select({ id: docentes.id })
    .from(docentes)
    .where(eq(docentes.usuarioId, perfil.usuarioId))
    .limit(1);

  if (docenteExistente) {
    return null;
  }

  const rolesAsignados = await db
    .select({ rol: usuarioRoles.rol })
    .from(usuarioRoles)
    .where(eq(usuarioRoles.usuarioId, perfil.usuarioId));

  return {
    usuarioId: perfil.usuarioId,
    username: perfil.username,
    documentoIdentidad: perfil.documentoIdentidad,
    nombre: [perfil.primerNombre, perfil.segundoNombre].filter(Boolean).join(' '),
    apellidos: [perfil.primerApellido, perfil.segundoApellido].filter(Boolean).join(' '),
    roles: rolesAsignados.map(({ rol }) => rol),
  };
};

export const vincularDocenteAUsuarioExistente = async (
  usuarioId: string,
  datos: {
    tipoDocumento: InsertDocente['tipoDocumento'];
    fechaNacimiento: string;
    telefono?: string | null;
    correo?: string | null;
    formacionAcademica?: string | null;
    experienciaLaboral?: string | null;
    reportaDiscapacidad: boolean;
  },
  usuarioAdminId: string,
) => {
  const codigo = await generarCodigoDOcente();

  const docenteCreado = await db.transaction(async (tx) => {
    // Recuperar el perfil base garantiza que nombre y documento no se dupliquen desde el cliente.
    const [perfil] = await tx
      .select({
        usuarioId: usuarios.usuarioId,
        documentoIdentidad: coordinadores.documentoIdentidad,
        primerNombre: coordinadores.primerNombre,
        segundoNombre: coordinadores.segundoNombre,
        primerApellido: coordinadores.primerApellido,
        segundoApellido: coordinadores.segundoApellido,
      })
      .from(coordinadores)
      .innerJoin(usuarios, eq(coordinadores.usuarioId, usuarios.usuarioId))
      .where(eq(usuarios.usuarioId, usuarioId))
      .limit(1);

    if (!perfil) {
      throw new Error('USUARIO_COORDINADOR_NO_ENCONTRADO');
    }

    const docenteExistente = await tx
      .select({ id: docentes.id })
      .from(docentes)
      .where(eq(docentes.usuarioId, usuarioId))
      .limit(1);

    if (docenteExistente.length > 0) {
      throw new Error('PERFIL_DOCENTE_YA_EXISTE');
    }

    // Crear el perfil docente y asociar DOCENTE de forma atómica; conservar roles previos.
    const [nuevoDocente] = await tx
      .insert(docentes)
      .values({
        usuarioId,
        codigo,
        tipoDocumento: datos.tipoDocumento,
        numeroDocumento: perfil.documentoIdentidad,
        nombre: [perfil.primerNombre, perfil.segundoNombre].filter(Boolean).join(' '),
        apellidos: [perfil.primerApellido, perfil.segundoApellido].filter(Boolean).join(' '),
        fechaNacimiento: datos.fechaNacimiento,
        telefono: datos.telefono ?? null,
        correo: datos.correo ?? null,
        formacionAcademica: datos.formacionAcademica ?? null,
        experienciaLaboral: datos.experienciaLaboral ?? null,
        reportaDiscapacidad: datos.reportaDiscapacidad,
      })
      .returning();

    await tx
      .insert(usuarioRoles)
      .values({ usuarioId, rol: 'DOCENTE' })
      .onConflictDoNothing({
        target: [usuarioRoles.usuarioId, usuarioRoles.rol],
      });

    return nuevoDocente;
  });

  await registrarAuditoria({
    usuarioId: usuarioAdminId,
    tablaAfectada: 'docentes',
    registroId: docenteCreado.id,
    accion: 'CREATE',
    datosNuevos: {
      usuarioId,
      codigo: docenteCreado.codigo,
      numeroDocumento: docenteCreado.numeroDocumento,
      rolAsignado: 'DOCENTE',
    },
    motivo: 'Vinculación de perfil docente a una cuenta de coordinador existente',
  });

  return docenteCreado;
};

export const generarCodigoDOcente = async (): Promise<string> => {
  // buscar en la base de datos el ultimo docente registrado
  const ultimoDocente = await db
    .select({ codigo: docentes.codigo })
    .from(docentes)
    .orderBy(desc(docentes.createdAt))
    .limit(1);

  let siguienteNumero = 1;

  if (ultimoDocente.length > 0 && ultimoDocente[0].codigo) {
    //formato DOC-000
    const partes = ultimoDocente[0].codigo.split("-");
    const numeroActual = parseInt(partes[1], 10);
    if (!isNaN(numeroActual)) {
      siguienteNumero = numeroActual + 1;
    }
  }

  const numeroFormateado = String(siguienteNumero).padStart(3, "0");

  return `DOC-${numeroFormateado}`;
};
// funcion obtener docentes

export const obtenerDocentes = async (
  filtros?: FiltrosDocente,
): Promise<Docente[]> => {
  const conditions = [];
  if (filtros?.estado) {
    conditions.push(eq(docentes.estado, filtros.estado as any));
  }
  if (filtros?.busqueda) {
    const termino = `%${filtros.busqueda}%`;
    conditions.push(
      ilike(
        sql`CONCAT(
      COALESCE(${docentes.nombre}, ''), ' ',
      COALESCE(${docentes.apellidos}, ''), ' ',
      COALESCE(${docentes.numeroDocumento}, '')
    )`,
        termino,
      ),
    );
  }

  const docentesResultado = await db
    .select()
    .from(docentes)
    .where(and(...conditions));

  // 1. Si quieres alertar que no hay registros en la base de datos (Ej: Tabla vacía)
  if (conditions.length === 0 && docentesResultado.length === 0) {
    throw new Error("SISTEMA_SIN_DOCENTES"); // No hay ningún docente registrado en todo el sistema
  }

  // 2. Si se aplicaron filtros pero nadie coincidió
  if (conditions.length > 0 && docentesResultado.length === 0) {
    // RECOMENDACIÓN: En vez de un throw, puedes retornar el array vacío []
    // o un mensaje controlado para que el frontend pinte "0 coincidencias".
    console.log("La búsqueda no arrojó resultados para los filtros aplicados.");
  }

  return docentesResultado;
};

// Función para obtener un docente por su ID obtener datos y documentos

export const obtenerDocenteConArchivosPorId = async (
  docenteId: string,
): Promise<DocenteConExpediente> => {
  //1 buscamos el docente
  const [docente] = await db
    .select()
    .from(docentes)
    .where(eq(docentes.id, docenteId));

  if (!docente) {
    throw new Error("DOCENTE_NO_ENCONTRADO");
  }

  //2. buscamos los archivos vigentes asociados a este docente
  const documentosVigentes = await db
  .select()
  .from(archivos)
  .where(and(
    eq(archivos.entidadId, docenteId),
    eq(archivos.tipoEntidad, "DOCENTE"),
    eq(archivos.estado, "VIGENTE")
  ));

  //3, se mapea y se genera la url firmada para cada Docuemtno vigente del docente de forma concurrente
  const documentosConUrlFirmada = await Promise.all(

    documentosVigentes.map(async (doc) =>{

      let urlFirmada = null;
      try {
        // genear url firmada validad por una hora = 3600 segundos
        urlFirmada = await obtenerUrlFirmada(doc.urlArchivo, 3600);
      } catch (error) {
        console.error(`Error generando URL firmada para el archivo ${doc.id}:`, error)
        
      }
      return {
        id: doc.id,
        categoria: doc.categoria, // 'FOTO', 'CEDULA', 'DISCAPACIDAD', 'CV'
        pathOriginal: doc.urlArchivo, // Guardamos el path por si acaso
        url: urlFirmada, // 👈 ¡La URL firmada lista para usar en el frontend!
        estado: doc.estado,
      };
    })
  );
  return{
    ...docente,
    documentos: documentosConUrlFirmada,
  };
};



// cambiar estado de docente
interface ParamsCambioEstado {
  docenteId: string;
  nuevoEstado: EstadoDocente;
  motivoInactivacion?: string;
}

export const cambiarEstadoDocente = async ({
  docenteId,
  nuevoEstado,
  motivoInactivacion,
}: ParamsCambioEstado) => {
  //1. veririficar si el docente existe
  const [docente] = await db
    .select({ id: docentes.id, estadoActual: docentes.estado })
    .from(docentes)
    .where(eq(docentes.id, docenteId))
    .limit(1);

  if (!docente) {
    throw new Error("DOCENTE_NO_ENCONTRADO");
  }
  //2. validacion de negocio : si pasa a inactivo, exigir motivo de inactivacion.
  if (
    nuevoEstado === EstadoDocente.INACTIVO &&
    (!motivoInactivacion || motivoInactivacion.trim() === "")
  ) {
    throw new Error("MOTIVO_INACTIVACION_REQUERIDO");
  }

  //2.2 validacion de negocio , veiricar si el grupo al que esta vinculado el docente no est programado o activo

  const [grupoAsignado] = await db
  .select({ id: grupos.id, estado: grupos.estado })
      .from(grupos)
      .where(
        and(
          eq(grupos.docenteId, docenteId),
          inArray(grupos.estado, ["PROGRAMADO", "EN_CURSO"])
        )
      )
      .limit(1);

      if(grupoAsignado){
        throw new AppError("No se puede inactivar el docente porque tiene grupos programados o en_curso",400,"DOCENTE_TIENE_GRUPOS_EN_CUROS_O_PROGRAMADOS");
      }

  //3. Preparar los datos a aactualizar
  const datosActualizar: any = { estado: nuevoEstado };

  // si pasa a Activo, limpiamos cualquier motivo de inactivacion previo
  if (nuevoEstado === EstadoDocente.ACTIVO) {
    datosActualizar.motivoInactivacion = null;
  } else if (nuevoEstado === EstadoDocente.INACTIVO) {
    datosActualizar.motivoInactivacion = motivoInactivacion;
  }
  //4. ejecutar actualiazcion en base de datos
  const [docenteActualizado] = await db
    .update(docentes)
    .set(datosActualizar)
    .where(eq(docentes.id, docenteId))
    .returning();
};

export const actualizarDatosDocente = async (
  docenteId: string,
  data: Partial<Omit<InsertDocente, 'numeroDocumento' | 'tipoDocumento' | 'codigo' | 'usuarioId'>>,
  usuarioAdminId: string,
) => {
  console.log("entrando servicio - actualizando datos personales del docente (campos mutables)");

  const resultado = await db.transaction(async (tx) => {
    // 1. Verificar existencia del docente
    const [docenteActual] = await tx
      .select()
      .from(docentes)
      .where(eq(docentes.id, docenteId))
      .limit(1);

    if (!docenteActual) {
      throw new Error("DOCENTE_NO_ENCONTRADO");
    }

    // 2. Actualizar únicamente campos mutables
    const [docenteActualizado] = await tx
      .update(docentes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(docentes.id, docenteId))
      .returning();

    // 3. Auditoría atómica de la modificación
    await registrarAuditoria({
      usuarioId: usuarioAdminId,
      tablaAfectada: "docentes",
      registroId: docenteActualizado.id,
      accion: "UPDATE",
      datosAntiguos: {
        nombre: docenteActual.nombre,
        apellidos: docenteActual.apellidos,
        telefono: docenteActual.telefono,
        formacionAcademica: docenteActual.formacionAcademica,
        reportaDiscapacidad: docenteActual.reportaDiscapacidad,
      },
      datosNuevos: {
        nombre: docenteActualizado.nombre,
        apellidos: docenteActualizado.apellidos,
        telefono: docenteActualizado.telefono,
        formacionAcademica: docenteActualizado.formacionAcademica,
        reportaDiscapacidad: docenteActualizado.reportaDiscapacidad,
      },
      motivo: "Actualización de datos informativos del docente en el SIA",
    });

    return docenteActualizado;
  });

  return resultado;
};

// Servicio principal de actualización de documentos del docente
export const actualizarDocumentosDocenteService = async (
  docenteId: string,
  documentPaths: Record<string, string>,
  usuarioAdminId: string,
) => {
  console.log("entrando servicio - actualizando documentos y gestionando historial de docente");

  const resultado = await db.transaction(async (tx) => {
    // 1. Verificar existencia del docente
    const [docenteActual] = await tx
      .select()
      .from(docentes)
      .where(eq(docentes.id, docenteId))
      .limit(1);

    if (!docenteActual) {
      throw new Error("DOCENTE_NO_ENCONTRADO");
    }

    // 2. Ejecutar la inactivación de viejos y guardado de nuevos documentos dentro de la transacción
    await guardarOActualizarArchivosEnBD(docenteId, "DOCENTE", documentPaths, tx);

    // 3. Registrar auditoría del sistema
    await registrarAuditoria({
      usuarioId: usuarioAdminId,
      tablaAfectada: "archivos",
      registroId: docenteId,
      accion: "UPDATE",
      datosNuevos: { categoriasActualizadas: Object.keys(documentPaths) },
      motivo: "Actualización de soportes documentales del docente (versión anterior marcada como historicas)",
    });

    return { success: true, documentosActualizados: Object.keys(documentPaths) };
  });

  return resultado;
};