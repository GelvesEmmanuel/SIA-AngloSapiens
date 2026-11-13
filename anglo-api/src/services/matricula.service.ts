import {
  and,
  desc,
  eq,
  gt,
  isNull,
  ne,
  sql,
} from "drizzle-orm";
import { db } from "../config/db.js";
import { estudiantes, grupos, matriculas } from "../config/db/schema.js";
import type {
  ActualizarMatricula,
  CrearMatricula,
  EstadoMatricula,
  FiltrosMatricula,
} from "../types/matriculas.types.js";
import { AppError } from "../utils/appError.utils.js";
import { registrarAuditoria } from "./auditoriaSis.service.js";

type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];

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

/** Cancela o finaliza una matrícula activa y sincroniza cupos y estado del estudiante. */
export const cambiarEstadoMatricula = async (
  id: string,
  estado: Exclude<EstadoMatricula, "ACTIVA">,
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
        "Solo se pueden cancelar o finalizar matrículas activas.",
        409,
        "MATRICULA_NO_ACTIVA",
      );
    }

    const datosEstado =
      estado === "CANCELADA"
        ? { estadoMatricula: estado, fechaCancelacion: sql<string>`CURRENT_DATE` }
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

    const [otraMatriculaActiva] = await tx
      .select({ id: matriculas.id })
      .from(matriculas)
      .where(
        and(
          eq(matriculas.estudianteId, actual.estudianteId),
          eq(matriculas.estadoMatricula, "ACTIVA"),
          ne(matriculas.id, id),
        ),
      )
      .limit(1);
    if (!otraMatriculaActiva) {
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
      },
      motivo: `Matrícula ${estado.toLowerCase()}`,
    });
    return actualizada;
  });