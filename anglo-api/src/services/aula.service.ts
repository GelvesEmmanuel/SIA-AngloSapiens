import { and, desc, eq, ilike, isNull, inArray } from "drizzle-orm";
import { db } from "../config/db.js";
import { aulas, grupos } from "../config/db/schema.js";
import type { FiltrosAula } from "../types/aulas.types.js";
import { AppError } from "../utils/appError.utils.js";
import { registrarAuditoria } from "./auditoriaSis.service.js";

/** Registra una nueva aula disponible para la asignación de grupos. */
export const crearAula = async (nombre: string, usuarioId: string) => {
  const [aula] = await db.insert(aulas).values({ nombre }).returning();
  await registrarAuditoria({
    usuarioId,
    tablaAfectada: "aulas",
    registroId: aula.id,
    accion: "CREATE",
    datosNuevos: aula,
    motivo: "Creación de aula",
  });
  return aula;
};

/** Lista aulas no eliminadas con filtros opcionales de estado y nombre. */
export const obtenerAulas = async (filtros: FiltrosAula = {}) => {
  const condiciones = [isNull(aulas.deletedAt)];
  if (filtros.activa !== undefined) condiciones.push(eq(aulas.activa, filtros.activa));
  if (filtros.busqueda) condiciones.push(ilike(aulas.nombre, `%${filtros.busqueda}%`));
  return db
    .select()
    .from(aulas)
    .where(and(...condiciones))
    .orderBy(desc(aulas.createdAt));
};

/** Busca un aula por ID y evita exponer registros eliminados. */
export const obtenerAulaPorId = async (id: string) => {
  const [aula] = await db
    .select()
    .from(aulas)
    .where(and(eq(aulas.id, id), isNull(aulas.deletedAt)))
    .limit(1);
  if (!aula) throw new AppError("El aula especificada no existe.", 404, "AULA_NO_ENCONTRADA");
  return aula;
};




/** Actualiza el nombre del aula sin alterar su estado de disponibilidad. */
export const actualizarAula = async (id: string, nombre: string, usuarioId: string) => {
  const actual = await obtenerAulaPorId(id);
  const [actualizada] = await db
    .update(aulas)
    .set({ nombre, updatedAt: new Date() })
    .where(eq(aulas.id, id))
    .returning();
  await registrarAuditoria({
    usuarioId,
    tablaAfectada: "aulas",
    registroId: id,
    accion: "UPDATE",
    datosAntiguos: { nombre: actual.nombre },
    datosNuevos: { nombre: actualizada.nombre },
    motivo: "Actualización del nombre del aula",
  });
  return actualizada;
};



/** Activa o desactiva un aula para impedir o permitir asignarla a grupos. */
export const cambiarEstadoAula = async (id: string, activa: boolean, usuarioId: string) => {
  const actual = await obtenerAulaPorId(id);

  if (!actual) {
    throw new AppError("El aula especificada no existe.", 404, "AULA_NO_ENCONTRADA");
  }

  // Validación de negocio: Si se intenta DESACTIVAR (activa pasa a ser false)
  if (activa === false) {
    const [grupoVigente] = await db
      .select({ id: grupos.id, estado: grupos.estado })
      .from(grupos)
      .where(
        and(
          eq(grupos.aulaId, id),
          inArray(grupos.estado, ["PROGRAMADO", "EN_CURSO"])
        )
      )
      .limit(1);

    if (grupoVigente) {
      throw new AppError(
        "No se puede desactivar el aula porque está asignada a grupos vigentes (Programados o En Curso).",
        400,
        "AULA_TIENE_GRUPOS_VIGENTES"
      );
    }
  }
  const [actualizada] = await db
    .update(aulas)
    .set({ activa, updatedAt: new Date() })
    .where(eq(aulas.id, id))
    .returning();
  await registrarAuditoria({
    usuarioId,
    tablaAfectada: "aulas",
    registroId: id,
    accion: "UPDATE",
    datosAntiguos: { activa: actual.activa },
    datosNuevos: { activa: actualizada.activa },
    motivo: `Aula ${activa ? "activada" : "desactivada"}`,
  });
  return actualizada;
};
