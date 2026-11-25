import {
  asc,
  and,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  sql,
} from "drizzle-orm";
import { db } from "../config/db.js";
import { estudiantes, grupos, matriculas } from "../config/db/schema.js";
import type {
  ActualizarMatricula,
  CambiarGrupoMatricula,
  CrearMatricula,
  EstadoMatricula,
  FiltrosMatricula,
} from "../types/matriculas.types.js";
import { AppError } from "../utils/appError.utils.js";
import { registrarAuditoria } from "./auditoriaSis.service.js";

type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];

const obtenerMotivoCancelacion = (motivo?: string) => {
  const normalizado = motivo?.trim();
  if (!normalizado) {
    throw new AppError(
      "El motivo de cancelación es obligatorio.",
      400,
      "MOTIVO_CANCELACION_REQUERIDO",
      [{ field: "motivoCancelacion", message: "Este campo es obligatorio." }],
    );
  }
  return normalizado;
};

const generarCodigoMatricula = async (tx: Transaccion) => {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('matriculas_codigo'))`);
  const registros = await tx
    .select({ codigo: matriculas.codigo })
    .from(matriculas);
  const mayorNumero = registros.reduce((mayor, { codigo }) => {
    const coincidencia = /^MAT-(\d+)$/.exec(codigo);
    return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
  }, 0);

  return `MAT-${String(mayorNumero + 1).padStart(4, "0")}`;
};

/** Finaliza las matrículas activas de los grupos indicados dentro de la transacción. */
export const finalizarMatriculasDeGrupos = async (
  tx: Transaccion,
  grupoIds: string[],
  usuarioId: string,
  motivo: string,
) => {
  if (grupoIds.length === 0) return 0;

  const activas = await tx
    .select()
    .from(matriculas)
    .where(
      and(
        inArray(matriculas.grupoId, grupoIds),
        eq(matriculas.estadoMatricula, "ACTIVA"),
      ),
    )
    .for("update");
  if (activas.length === 0) return 0;

  const actualizadas = await tx
    .update(matriculas)
    .set({
      estadoMatricula: "FINALIZADA",
      fechaFinalizacion: sql`COALESCE(${matriculas.fechaFinalizacion}, CURRENT_DATE)`,
      updatedAt: new Date(),
    })
    .where(
      and(
        inArray(matriculas.id, activas.map(({ id }) => id)),
        eq(matriculas.estadoMatricula, "ACTIVA"),
      ),
    )
    .returning();

  for (const actualizada of actualizadas) {
    const anterior = activas.find(({ id }) => id === actualizada.id);
    await registrarAuditoria(
      {
        usuarioId,
        tablaAfectada: "matriculas",
        registroId: actualizada.id,
        accion: "UPDATE",
        datosAntiguos: {
          estadoMatricula: anterior?.estadoMatricula,
          fechaFinalizacion: anterior?.fechaFinalizacion,
        },
        datosNuevos: {
          estadoMatricula: actualizada.estadoMatricula,
          fechaFinalizacion: actualizada.fechaFinalizacion,
        },
        motivo,
      },
      tx,
    );
  }

  return actualizadas.length;
};

/** Registra una matrícula, actualiza el estudiante y reserva un cupo atómicamente. */
export const crearMatricula = async (datos: CrearMatricula, usuarioId: string) =>
  db.transaction(async (tx) => {
    const [estudiante] = await tx
      .select()
      .from(estudiantes)
      .where(and(eq(estudiantes.id, datos.estudianteId), isNull(estudiantes.deletedAt)))
      .limit(1)
      .for("update");
    if (!estudiante) {
      throw new AppError("El estudiante especificado no existe.", 404, "ESTUDIANTE_NO_ENCONTRADO");
    }
    if (estudiante.estado !== "REGISTRADO") {
      throw new AppError(
        "Solo se pueden matricular estudiantes en estado REGISTRADO.",
        409,
        "ESTUDIANTE_NO_DISPONIBLE",
      );
    }

    const [grupo] = await tx
      .select()
      .from(grupos)
      .where(and(eq(grupos.id, datos.grupoId), isNull(grupos.deletedAt)))
      .limit(1)
      .for("update");
    if (!grupo) {
      throw new AppError("El grupo especificado no existe.", 404, "GRUPO_NO_ENCONTRADO");
    }
    if (grupo.estado !== "PROGRAMADO" && grupo.estado !== "EN_CURSO") {
      throw new AppError(
        "Solo se pueden matricular estudiantes en grupos programados o en curso.",
        409,
        "GRUPO_NO_DISPONIBLE",
      );
    }

    const [matriculaExistente] = await tx
      .select({ id: matriculas.id })
      .from(matriculas)
      .where(
        and(
          eq(matriculas.estudianteId, datos.estudianteId),
          eq(matriculas.grupoId, datos.grupoId),
        ),
      )
      .limit(1);
    if (matriculaExistente) {
      throw new AppError(
        "El estudiante ya tiene una matrícula registrada para este grupo.",
        409,
        "MATRICULA_DUPLICADA",
      );
    }

    const [grupoConCupo] = await tx
      .update(grupos)
      .set({
        cuposDisponibles: sql`${grupos.cuposDisponibles} - 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(grupos.id, grupo.id), gt(grupos.cuposDisponibles, 0)))
      .returning({ id: grupos.id });
    if (!grupoConCupo) {
      throw new AppError("El grupo no tiene cupos disponibles.", 409, "GRUPO_SIN_CUPOS");
    }

    const codigo = await generarCodigoMatricula(tx);
    const [matricula] = await tx
      .insert(matriculas)
      .values({
        ...datos,
        valorAcordado:
          datos.valorAcordado == null ? datos.valorAcordado : datos.valorAcordado.toFixed(2),
        descuentoAplicado:
          datos.descuentoAplicado == null
            ? datos.descuentoAplicado
            : datos.descuentoAplicado.toFixed(2),
        codigo,
      })
      .returning();

    await tx
      .update(estudiantes)
      .set({ estado: "MATRICULADO", updatedAt: new Date() })
      .where(eq(estudiantes.id, estudiante.id));

    await registrarAuditoria({
      usuarioId,
      tablaAfectada: "matriculas",
      registroId: matricula.id,
      accion: "CREATE",
      datosNuevos: matricula,
      motivo: "Matrícula de estudiante en grupo académico",
    });
    return matricula;
  });

/** Lista matrículas aplicando filtros opcionales por estudiante, grupo o estado. */
export const obtenerMatriculas = async (filtros: FiltrosMatricula = {}) => {
  const condiciones = [];
  if (filtros.estudianteId) {
    condiciones.push(eq(matriculas.estudianteId, filtros.estudianteId));
  }
  if (filtros.grupoId) condiciones.push(eq(matriculas.grupoId, filtros.grupoId));
  if (filtros.estadoMatricula) {
    condiciones.push(eq(matriculas.estadoMatricula, filtros.estadoMatricula));
  }
  if (filtros.estadoPago) condiciones.push(eq(matriculas.estadoPago, filtros.estadoPago));

  return db
    .select()
    .from(matriculas)
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(desc(matriculas.fechaMatricula), desc(matriculas.createdAt));
};

/** Obtiene una matrícula por su identificador o responde con un error 404. */
export const obtenerMatriculaPorId = async (id: string) => {
  const [matricula] = await db
    .select()
    .from(matriculas)
    .where(eq(matriculas.id, id))
    .limit(1);
  if (!matricula) {
    throw new AppError("La matrícula especificada no existe.", 404, "MATRICULA_NO_ENCONTRADA");
  }
  return matricula;
};

/** Actualiza únicamente los campos no críticos de una matrícula activa. */
export const actualizarMatricula = async (
  id: string,
  datos: ActualizarMatricula,
  usuarioId: string,
) =>
  db.transaction(async (tx) => {
    const [actual] = await tx
      .select()
      .from(matriculas)
      .where(eq(matriculas.id, id))
      .limit(1)
      .for("update");
    if (!actual) {
      throw new AppError("La matrícula especificada no existe.", 404, "MATRICULA_NO_ENCONTRADA");
    }
    if (actual.estadoMatricula !== "ACTIVA") {
      throw new AppError(
        "Solo se pueden editar matrículas activas.",
        409,
        "MATRICULA_NO_ACTIVA",
      );
    }

    const [actualizada] = await tx
      .update(matriculas)
      .set({
        ...datos,
        valorAcordado:
          datos.valorAcordado == null ? datos.valorAcordado : datos.valorAcordado.toFixed(2),
        descuentoAplicado:
          datos.descuentoAplicado == null
            ? datos.descuentoAplicado
            : datos.descuentoAplicado.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(matriculas.id, id))
      .returning();

    await registrarAuditoria({
      usuarioId,
      tablaAfectada: "matriculas",
      registroId: id,
      accion: "UPDATE",
      datosAntiguos: actual,
      datosNuevos: actualizada,
      motivo: "Actualización de datos no críticos de matrícula",
    });
    return actualizada;
  });

/** Traslada una matrícula activa y actualiza los cupos de ambos grupos atómicamente. */
export const cambiarGrupoMatricula = async (
  id: string,
  datos: CambiarGrupoMatricula,
  usuarioId: string,
) =>
  db.transaction(async (tx) => {
    const motivo = datos.motivo.trim();
    if (!motivo) {
      throw new AppError(
        "El motivo del cambio de grupo es obligatorio.",
        400,
        "MOTIVO_CAMBIO_GRUPO_REQUERIDO",
        [{ field: "motivo", message: "Este campo es obligatorio." }],
      );
    }

    const [actual] = await tx
      .select()
      .from(matriculas)
      .where(eq(matriculas.id, id))
      .limit(1)
      .for("update");
    if (!actual) {
      throw new AppError("La matrícula especificada no existe.", 404, "MATRICULA_NO_ENCONTRADA");
    }
    if (actual.estadoMatricula !== "ACTIVA") {
      throw new AppError(
        "Solo se puede cambiar de grupo una matrícula activa.",
        409,
        "MATRICULA_NO_ACTIVA",
      );
    }
    if (actual.grupoId === datos.grupoId) {
      throw new AppError(
        "La matrícula ya pertenece al grupo especificado.",
        409,
        "MISMO_GRUPO_MATRICULA",
      );
    }

    const gruposBloqueados = await tx
      .select()
      .from(grupos)
      .where(inArray(grupos.id, [actual.grupoId, datos.grupoId]))
      .orderBy(asc(grupos.id))
      .for("update");
    const grupoAnterior = gruposBloqueados.find(({ id: grupoId }) => grupoId === actual.grupoId);
    const grupoNuevo = gruposBloqueados.find(({ id: grupoId }) => grupoId === datos.grupoId);
    if (!grupoNuevo || grupoNuevo.deletedAt !== null) {
      throw new AppError("El grupo especificado no existe.", 404, "GRUPO_NO_ENCONTRADO");
    }
    if (grupoNuevo.estado !== "PROGRAMADO" && grupoNuevo.estado !== "EN_CURSO") {
      throw new AppError(
        "Solo se puede cambiar a grupos programados o en curso.",
        409,
        "GRUPO_NO_DISPONIBLE",
      );
    }
    if (!grupoAnterior) {
      throw new AppError("El grupo actual de la matrícula no existe.", 404, "GRUPO_NO_ENCONTRADO");
    }

    const [matriculaExistente] = await tx
      .select({ id: matriculas.id })
      .from(matriculas)
      .where(
        and(
          eq(matriculas.estudianteId, actual.estudianteId),
          eq(matriculas.grupoId, datos.grupoId),
        ),
      )
      .limit(1);
    if (matriculaExistente) {
      throw new AppError(
        "El estudiante ya tiene una matrícula registrada para este grupo.",
        409,
        "MATRICULA_DUPLICADA",
      );
    }

    const [grupoConCupo] = await tx
      .update(grupos)
      .set({
        cuposDisponibles: sql`${grupos.cuposDisponibles} - 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(grupos.id, grupoNuevo.id), gt(grupos.cuposDisponibles, 0)))
      .returning({ id: grupos.id });
    if (!grupoConCupo) {
      throw new AppError("El grupo no tiene cupos disponibles.", 409, "GRUPO_SIN_CUPOS");
    }

    await tx
      .update(grupos)
      .set({
        cuposDisponibles: sql`LEAST(${grupos.cupoMaximo}, ${grupos.cuposDisponibles} + 1)`,
        updatedAt: new Date(),
      })
      .where(eq(grupos.id, grupoAnterior.id));

    const [actualizada] = await tx
      .update(matriculas)
      .set({
        grupoId: grupoNuevo.id,
        motivoCambioGrupo: motivo,
        updatedAt: new Date(),
      })
      .where(eq(matriculas.id, id))
      .returning();

    await registrarAuditoria({
      usuarioId,
      tablaAfectada: "matriculas",
      registroId: id,
      accion: "UPDATE",
      datosAntiguos: { grupoId: actual.grupoId },
      datosNuevos: {
        grupoId: actualizada.grupoId,
        motivoCambioGrupo: actualizada.motivoCambioGrupo,
      },
      motivo: `Cambio de grupo de ${grupoAnterior.codigo} a ${grupoNuevo.codigo}: ${motivo}`,
    });
    return actualizada;
  });

/** Cancela o finaliza una matrícula activa y sincroniza cupos y estado del estudiante. */
export const cambiarEstadoMatricula = async (
  id: string,
  estado: Exclude<EstadoMatricula, "ACTIVA">,
  usuarioId: string,
  motivoCancelacion?: string,
) =>
  db.transaction(async (tx) => {
    const [actual] = await tx
      .select()
      .from(matriculas)
      .where(eq(matriculas.id, id))
      .limit(1)
      .for("update");
    if (!actual) {
      throw new AppError("La matrícula especificada no existe.", 404, "MATRICULA_NO_ENCONTRADA");
    }
    if (actual.estadoMatricula !== "ACTIVA") {
      throw new AppError(
        "Solo se pueden cancelar o finalizar matrículas activas.",
        409,
        "MATRICULA_NO_ACTIVA",
      );
    }
    const datosEstado =
      estado === "CANCELADA"
        ? {
            estadoMatricula: estado,
            fechaCancelacion: sql<string>`CURRENT_DATE`,
            motivoCancelacion: obtenerMotivoCancelacion(motivoCancelacion),
          }
        : { estadoMatricula: estado, fechaFinalizacion: sql<string>`CURRENT_DATE` };
    const [actualizada] = await tx
      .update(matriculas)
      .set({ ...datosEstado, updatedAt: new Date() })
      .where(eq(matriculas.id, id))
      .returning();

    if (estado === "CANCELADA") {
      await tx
        .update(grupos)
        .set({
          cuposDisponibles: sql`LEAST(${grupos.cupoMaximo}, ${grupos.cuposDisponibles} + 1)`,
          updatedAt: new Date(),
        })
        .where(and(eq(grupos.id, actual.grupoId), isNull(grupos.deletedAt)));
    }

    if (estado === "CANCELADA") {
      await tx
        .update(estudiantes)
        .set({ estado: "REGISTRADO", updatedAt: new Date() })
        .where(
          and(
            eq(estudiantes.id, actual.estudianteId),
            eq(estudiantes.estado, "MATRICULADO"),
          ),
        );
    }

    await registrarAuditoria({
      usuarioId,
      tablaAfectada: "matriculas",
      registroId: id,
      accion: "UPDATE",
      datosAntiguos: { estadoMatricula: actual.estadoMatricula },
      datosNuevos: {
        estadoMatricula: actualizada.estadoMatricula,
        fechaCancelacion: actualizada.fechaCancelacion,
        fechaFinalizacion: actualizada.fechaFinalizacion,
        motivoCancelacion: actualizada.motivoCancelacion,
      },
      motivo:
        estado === "CANCELADA"
          ? `Matrícula cancelada: ${actualizada.motivoCancelacion}`
          : `Matrícula ${estado.toLowerCase()}`,
    });
    return actualizada;
  });