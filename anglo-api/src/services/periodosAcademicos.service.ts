import {
  and,
  asc,
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
import {
  grupos,
  matriculas,
  periodosAcademicos,
  usuarioRoles,
  usuarios,
} from "../config/db/schema.js";
import type {
  ActualizarPeriodoAcademico,
  EstadoPeriodo,
  FiltrosPeriodoAcademico,
  InsertPeriodoAcademico,
} from "../types/periodosAcademicos.types.js";
import { AppError } from "../utils/appError.utils.js";
import { registrarAuditoria } from "./auditoriaSis.service.js";
import { finalizarMatriculasDeGrupos } from "./matricula.service.js";

type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];

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
) =>
  db.transaction(async (tx) => {
    const [actual] = await tx
      .select()
      .from(periodosAcademicos)
      .where(eq(periodosAcademicos.id, id))
      .limit(1)
      .for("update");
    if (!actual) {
      throw new AppError(
        "El periodo académico especificado no existe.",
        404,
        "PERIODO_NO_ENCONTRADO",
      );
    }

    if (estado === "FINALIZADO" || estado === "INACTIVO") {
      const gruposDelPeriodo = await tx
        .select({ id: grupos.id, estado: grupos.estado })
        .from(grupos)
        .where(
          and(
            eq(grupos.periodoId, id),
            isNull(grupos.deletedAt),
          ),
        )
        .for("update");
      const gruposVigentes = gruposDelPeriodo.filter(
        ({ estado: estadoGrupo }) =>
          estadoGrupo === "PROGRAMADO" || estadoGrupo === "EN_CURSO",
      );
      if (gruposVigentes.length > 0) {
        throw new AppError(
          "No se puede finalizar o inactivar el periodo porque tiene grupos programados o en curso.",
          409,
          "PERIODO_TIENE_GRUPOS_VIGENTES",
        );
      }
    }

    const [actualizado] = await tx
      .update(periodosAcademicos)
      .set({ estado, updatedAt: new Date() })
      .where(eq(periodosAcademicos.id, id))
      .returning();
    if (!actualizado) {
      throw new AppError(
        "El estado del periodo cambió durante la operación.",
        409,
        "ESTADO_PERIODO_MODIFICADO",
      );
    }

    if (estado === "FINALIZADO") {
      const gruposFinalizables = await tx
        .select({ id: grupos.id, estado: grupos.estado })
        .from(grupos)
        .where(
          and(
            eq(grupos.periodoId, id),
            ne(grupos.estado, "FINALIZADO"),
            ne(grupos.estado, "CANCELADO"),
            isNull(grupos.deletedAt),
          ),
        )
        .for("update");
      const grupoIds = gruposFinalizables.map(({ id: grupoId }) => grupoId);
      if (grupoIds.length > 0) {
        const gruposActualizados = await tx
          .update(grupos)
          .set({ estado: "FINALIZADO", updatedAt: new Date() })
          .where(inArray(grupos.id, grupoIds))
          .returning();
        for (const grupo of gruposActualizados) {
          await registrarAuditoria(
            {
              usuarioId,
              tablaAfectada: "grupos",
              registroId: grupo.id,
              accion: "UPDATE",
              datosAntiguos: {
                estado: gruposFinalizables.find(({ id: grupoId }) => grupoId === grupo.id)?.estado,
              },
              datosNuevos: { estado: grupo.estado },
              motivo: `Finalización manual del periodo ${actual.codigo}`,
            },
            tx,
          );
        }
      }
      const gruposConMatriculasPendientes = await tx
        .select({ id: grupos.id })
        .from(grupos)
        .where(
          and(
            eq(grupos.periodoId, id),
            ne(grupos.estado, "CANCELADO"),
            isNull(grupos.deletedAt),
          ),
        )
        .for("update");
      await finalizarMatriculasDeGrupos(
        tx,
        gruposConMatriculasPendientes.map(({ id: grupoId }) => grupoId),
        usuarioId,
        `Finalización manual del periodo ${actual.codigo}`,
      );
    }

    await registrarAuditoria(
      {
        usuarioId,
        tablaAfectada: "periodos_academicos",
        registroId: id,
        accion: "UPDATE",
        datosAntiguos: { estado: actual.estado },
        datosNuevos: { estado: actualizado.estado },
        motivo: `Cambio de estado del periodo a ${estado}`,
      },
      tx,
    );
    return actualizado;
  });

/** Finaliza periodos vencidos y sus grupos activos en una única transacción. */
// Esta funcion tiene el fin de que al momento de que se termina un periodo siendo valdiado con su fecha fin el periodo pase a finalizado , y los grupos que estan vinculaods al periodo pasan a finalizados tambien
export const finalizarPeriodosAcademicosVencidos = async () =>
  db.transaction(async (tx) => {
    const periodosVencidos = await tx
      .select({
        id: periodosAcademicos.id,
        codigo: periodosAcademicos.codigo,
        estado: periodosAcademicos.estado,
      })
      .from(periodosAcademicos)
      .where(lt(periodosAcademicos.fechaFin, sql<string>`CURRENT_DATE`))
      .orderBy(asc(periodosAcademicos.id))
      .for("update");
    const periodoIds = periodosVencidos.map(({ id }) => id);

    if (!periodoIds.length) {
      return {
        periodosFinalizados: 0,
        gruposFinalizados: 0,
        matriculasFinalizadas: 0,
      };
    }

    const periodosPorFinalizar = periodosVencidos.filter(
      ({ estado }) => estado !== "FINALIZADO",
    );
    const gruposFinalizables = await tx
      .select({
        id: grupos.id,
        periodoId: grupos.periodoId,
        estado: grupos.estado,
      })
      .from(grupos)
      .where(
        and(
          inArray(grupos.periodoId, periodoIds),
          ne(grupos.estado, "FINALIZADO"),
          ne(grupos.estado, "CANCELADO"),
          isNull(grupos.deletedAt),
        ),
      )
      .for("update");
    const grupoIds = gruposFinalizables.map(({ id }) => id);
    const gruposConMatriculasPendientes = await tx
      .select({ id: grupos.id })
      .from(grupos)
      .where(
        and(
          inArray(grupos.periodoId, periodoIds),
          ne(grupos.estado, "CANCELADO"),
          isNull(grupos.deletedAt),
        ),
      )
      .for("update");
    const grupoIdsConMatriculas = gruposConMatriculasPendientes.map(({ id }) => id);
    const matriculasActivas = grupoIdsConMatriculas.length
      ? await tx
          .select({ id: matriculas.id })
          .from(matriculas)
          .where(
            and(
              inArray(matriculas.grupoId, grupoIdsConMatriculas),
              eq(matriculas.estadoMatricula, "ACTIVA"),
            ),
          )
      : [];
    if (
      periodosPorFinalizar.length === 0 &&
      gruposFinalizables.length === 0 &&
      matriculasActivas.length === 0
    ) {
      return {
        periodosFinalizados: 0,
        gruposFinalizados: 0,
        matriculasFinalizadas: 0,
      };
    }

    const [actorSistema] = await tx
      .select({ usuarioId: usuarios.usuarioId })
      .from(usuarios)
      .innerJoin(usuarioRoles, eq(usuarioRoles.usuarioId, usuarios.usuarioId))
      .where(
        and(
          eq(usuarios.estado, "ACTIVO"),
          eq(usuarioRoles.rol, "SUPER_ADMIN"),
        ),
      )
      .orderBy(asc(usuarios.createdAt), asc(usuarios.usuarioId))
      .limit(1);
    if (!actorSistema) {
      throw new AppError(
        "No se pueden finalizar periodos vencidos porque no existe un SUPER_ADMIN activo para la auditoría.",
        409,
        "AUDITORIA_USUARIO_SISTEMA_NO_ENCONTRADO",
      );
    }
    const usuarioId = actorSistema.usuarioId;

    const periodosActualizados = periodosPorFinalizar.length
      ? await tx
          .update(periodosAcademicos)
          .set({ estado: "FINALIZADO", updatedAt: new Date() })
          .where(
            inArray(
              periodosAcademicos.id,
              periodosPorFinalizar.map(({ id }) => id),
            ),
          )
          .returning({ id: periodosAcademicos.id })
      : [];
    for (const periodo of periodosActualizados) {
      const anterior = periodosPorFinalizar.find(({ id }) => id === periodo.id);
      await registrarAuditoria(
        {
          usuarioId,
          tablaAfectada: "periodos_academicos",
          registroId: periodo.id,
          accion: "UPDATE",
          datosAntiguos: { estado: anterior?.estado },
          datosNuevos: { estado: "FINALIZADO" },
          motivo: "Finalización automática del periodo por fecha de vencimiento",
        },
        tx,
      );
    }

    const gruposActualizados = grupoIds.length
      ? await tx
          .update(grupos)
          .set({ estado: "FINALIZADO", updatedAt: new Date() })
          .where(inArray(grupos.id, grupoIds))
          .returning({ id: grupos.id })
      : [];
    for (const grupo of gruposActualizados) {
      const anterior = gruposFinalizables.find(({ id }) => id === grupo.id);
      const periodo = periodosVencidos.find(({ id }) => id === anterior?.periodoId);
      await registrarAuditoria(
        {
          usuarioId,
          tablaAfectada: "grupos",
          registroId: grupo.id,
          accion: "UPDATE",
          datosAntiguos: { estado: anterior?.estado },
          datosNuevos: { estado: "FINALIZADO" },
          motivo: `Finalización automática por vencimiento del periodo ${periodo?.codigo ?? ""}`.trim(),
        },
        tx,
      );
    }
    const matriculasFinalizadas = await finalizarMatriculasDeGrupos(
      tx,
      grupoIdsConMatriculas,
      usuarioId,
      "Finalización automática de matrícula por vencimiento del periodo académico",
    );

    return {
      periodosFinalizados: periodosActualizados.length,
      gruposFinalizados: gruposActualizados.length,
      matriculasFinalizadas,
    };
  });