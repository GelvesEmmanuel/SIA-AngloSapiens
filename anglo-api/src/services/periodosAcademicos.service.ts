import {
  and,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { db } from "../config/db.js";
import { grupos, periodosAcademicos } from "../config/db/schema.js";
import type {
  ActualizarPeriodoAcademico,
  EstadoPeriodo,
  FiltrosPeriodoAcademico,
  InsertPeriodoAcademico,
} from "../types/periodosAcademicos.types.js";
import { AppError } from "../utils/appError.utils.js";
import { registrarAuditoria } from "./auditoriaSis.service.js";

/** Genera el siguiente código de periodo con el formato PER-0001. */
export const generarCodigoPeriodoAcademico = async (): Promise<string> => {
  const registros = await db
    .select({ codigo: periodosAcademicos.codigo })
    .from(periodosAcademicos);

  const mayorNumero = registros.reduce((mayor, { codigo }) => {
    const coincidencia = /^PER-(\d+)$/.exec(codigo);
    return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
  }, 0);

  return `PER-${String(mayorNumero + 1).padStart(4, "0")}`;
};

/** Crea un periodo académico con código autogenerado y auditoría. */
export const crearPeriodoAcademico = async (
  datos: Omit<InsertPeriodoAcademico, "id" | "codigo" | "estado" | "createdAt" | "updatedAt">,
  usuarioId: string,
) => {
  const codigo = await generarCodigoPeriodoAcademico();
  const [periodo] = await db
    .insert(periodosAcademicos)
    .values({ ...datos, codigo })
    .returning();

  await registrarAuditoria({
    usuarioId,
    tablaAfectada: "periodos_academicos",
    registroId: periodo.id,
    accion: "CREATE",
    datosNuevos: periodo,
    motivo: "Creación de periodo académico",
  });
  return periodo;
};

/** Consulta periodos por estado o nombre/código, ordenados por fecha reciente. */
export const obtenerPeriodosAcademicos = async (
  filtros: FiltrosPeriodoAcademico = {},
) => {
  const condiciones = [];
  if (filtros.estado) condiciones.push(eq(periodosAcademicos.estado, filtros.estado));
  if (filtros.busqueda) {
    const termino = `%${filtros.busqueda}%`;
    const coincidencia = or(
      ilike(periodosAcademicos.nombre, termino),
      ilike(periodosAcademicos.codigo, termino),
    );
    if (coincidencia) condiciones.push(coincidencia);
  }

  return db
    .select()
    .from(periodosAcademicos)
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(desc(periodosAcademicos.fechaInicio));
};

/** Obtiene un periodo por su identificador o responde con un error 404. */
export const obtenerPeriodoAcademicoPorId = async (id: string) => {
  const [periodo] = await db
    .select()
    .from(periodosAcademicos)
    .where(eq(periodosAcademicos.id, id))
    .limit(1);
  if (!periodo) {
    throw new AppError("El periodo académico especificado no existe.", 404, "PERIODO_NO_ENCONTRADO");
  }
  return periodo;
};

/** Actualiza nombre o fechas y registra los valores anteriores y nuevos. */
export const actualizarPeriodoAcademico = async (
  id: string,
  datos: ActualizarPeriodoAcademico,
  usuarioId: string,
) => {
  const actual = await obtenerPeriodoAcademicoPorId(id);
  const fechaInicio = datos.fechaInicio ?? actual.fechaInicio;
  const fechaFin = datos.fechaFin ?? actual.fechaFin;
  if (fechaFin < fechaInicio) {
    throw new AppError(
      "La fecha de fin debe ser igual o posterior a la fecha de inicio.",
      400,
      "RANGO_FECHAS_INVALIDO",
      [{ field: "fechaFin", message: "Debe ser igual o posterior a fechaInicio." }],
    );
  }
  const [grupoFueraDeRango] = await db
    .select({ id: grupos.id })
    .from(grupos)
    .where(
      and(
        eq(grupos.periodoId, id),
        isNull(grupos.deletedAt),
        or(
          lt(grupos.fechaInicio, fechaInicio),
          gt(grupos.fechaFin, fechaFin),
        ),
      ),
    )
    .limit(1);
  if (grupoFueraDeRango) {
    throw new AppError(
      "Las fechas del periodo no pueden excluir fechas de grupos existentes.",
      409,
      "PERIODO_CON_GRUPOS_FUERA_DE_RANGO",
    );
  }

  const [actualizado] = await db
    .update(periodosAcademicos)
    .set({ ...datos, updatedAt: new Date() })
    .where(eq(periodosAcademicos.id, id))
    .returning();
  await registrarAuditoria({
    usuarioId,
    tablaAfectada: "periodos_academicos",
    registroId: id,
    accion: "UPDATE",
    datosAntiguos: actual,
    datosNuevos: actualizado,
    motivo: "Actualización de periodo académico",
  });
  return actualizado;
};

/** Cambia el estado del periodo; los grupos solo admiten periodos activos/programados. */
export const cambiarEstadoPeriodoAcademico = async (
  id: string,
  estado: EstadoPeriodo,
  usuarioId: string,
) => {
  // validar si existe curso
  const actual = await obtenerPeriodoAcademicoPorId(id);
  
  if (!actual) {
    throw new Error("PERIODO_NO_ENCONTRADO");
  }

  // 2. Validación de negocio: Si el nuevo estado es FINALIZADO o INACTIVO
  const estadosRestringidos = ["FINALIZADO","INACTIVO"]; // O strings directos según tu enum
  if (estadosRestringidos.includes(estado)) {
    
    // Buscar si existe al menos un grupo con estado PROGRAMADO o EN_CURSO en este periodo
    const [grupoVigente] = await db
      .select({ id: grupos.id, estado: grupos.estado })
      .from(grupos)
      .where(
        and(
          eq(grupos.periodoId, id),
          inArray(grupos.estado, ["PROGRAMADO", "EN_CURSO"])
        )
      )
      .limit(1);
      
    throw new AppError(
        "No se puede finalizar o inactivar el periodo porque tiene grupos vigentes (Programados o En Curso).",
        400,
        "PERIODO_TIENE_GRUPOS_VIGENTES"
      );
  }

  const [actualizado] = await db
    .update(periodosAcademicos)
    .set({ estado, updatedAt: new Date() })
    .where(eq(periodosAcademicos.id, id))
    .returning();
  await registrarAuditoria({
    usuarioId,
    tablaAfectada: "periodos_academicos",
    registroId: id,
    accion: "UPDATE",
    datosAntiguos: { estado: actual.estado },
    datosNuevos: { estado: actualizado.estado },
    motivo: `Cambio de estado del periodo a ${estado}`,
  });
  return actualizado;
};

/** Finaliza periodos vencidos y sus grupos activos en una única transacción. */
// Esta funcion tiene el fin de que al momento de que se termina un periodo siendo valdiado con su fecha fin el periodo pase a finalizado , y los grupos que estan vinculaods al periodo pasan a finalizados tambien
export const finalizarPeriodosAcademicosVencidos = async () =>
  db.transaction(async (tx) => {
    const periodosVencidos = await tx
      .select({ id: periodosAcademicos.id })
      .from(periodosAcademicos)
      .where(lt(periodosAcademicos.fechaFin, sql<string>`CURRENT_DATE`));
    const periodoIds = periodosVencidos.map(({ id }) => id);

    if (!periodoIds.length) {
      return { periodosFinalizados: 0, gruposFinalizados: 0 };
    }

    const periodosActualizados = await tx
      .update(periodosAcademicos)
      .set({ estado: "FINALIZADO", updatedAt: new Date() })
      .where(
        and(
          inArray(periodosAcademicos.id, periodoIds),
          ne(periodosAcademicos.estado, "FINALIZADO"),
        ),
      )
      .returning({ id: periodosAcademicos.id });

    const gruposActualizados = await tx
      .update(grupos)
      .set({ estado: "FINALIZADO", updatedAt: new Date() })
      .where(
        and(
          inArray(grupos.periodoId, periodoIds),
          ne(grupos.estado, "FINALIZADO"),
          ne(grupos.estado, "CANCELADO"),
          isNull(grupos.deletedAt),
        ),
      )
      .returning({ id: grupos.id });

    return {
      periodosFinalizados: periodosActualizados.length,
      gruposFinalizados: gruposActualizados.length,
    };
  });