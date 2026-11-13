import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { db } from "../config/db.js";
import {
  aulas,
  cursos,
  docentes,
  grupos,
  horariosGrupos,
  matriculas,
  periodosAcademicos,
} from "../config/db/schema.js";
import type {
  ActualizarGrupo,
  CrearGrupo,
  EstadoGrupo,
  FiltrosGrupo,
  GrupoConHorarios,
} from "../types/grupos.types.js";
import { AppError } from "../utils/appError.utils.js";
import { registrarAuditoria } from "./auditoriaSis.service.js";

type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];

const lanzarNoEncontrado = (tipo: string): never => {
  const nombres: Record<string, string> = {
    GRUPO: "grupo",
    PERIODO: "periodo académico",
    CURSO: "curso",
    DOCENTE: "docente",
    AULA: "aula",
  };
  throw new AppError(
    `El ${nombres[tipo]} especificado no existe.`,
    404,
    `${tipo}_NO_ENCONTRADO`,
  );
};

const minutos = (hora: string) => {
  const [horas, minutosHora] = hora.split(":").map(Number);
  return horas * 60 + minutosHora;
};

const validarReferencias = async (
  tx: Transaccion,
  datos: Pick<
    CrearGrupo,
    "periodoId" | "cursoId" | "docenteId" | "aulaId" | "fechaInicio" | "fechaFin"
  >,
) => {
  const [periodo] = await tx
    .select()
    .from(periodosAcademicos)
    .where(eq(periodosAcademicos.id, datos.periodoId))
    .limit(1);
  if (!periodo) lanzarNoEncontrado("PERIODO");
  if (periodo.estado !== "ACTIVO" && periodo.estado !== "PROGRAMADO") {
    throw new AppError(
      "Solo se pueden asignar grupos a periodos activos o programados.",
      409,
      "PERIODO_NO_DISPONIBLE",
      [{ field: "periodoId", message: "El periodo no está disponible para grupos." }],
    );
  }
  if (datos.fechaFin < datos.fechaInicio) {
    throw new AppError(
      "La fecha de fin debe ser igual o posterior a la fecha de inicio.",
      400,
      "RANGO_FECHAS_INVALIDO",
      [{ field: "fechaFin", message: "Debe ser igual o posterior a fechaInicio." }],
    );
  }
  if (datos.fechaInicio < periodo.fechaInicio || datos.fechaFin > periodo.fechaFin) {
    throw new AppError(
      "Las fechas del grupo deben estar dentro del periodo académico.",
      400,
      "FECHAS_FUERA_DEL_PERIODO",
      [{ field: "fechaInicio", message: "El rango del grupo debe pertenecer al periodo." }],
    );
  }

  const [curso] = await tx
    .select()
    .from(cursos)
    .where(and(eq(cursos.id, datos.cursoId), isNull(cursos.deletedAt)))
    .limit(1);
  if (!curso) lanzarNoEncontrado("CURSO");
  if (curso.estado !== "ACTIVO") {
    throw new AppError("No se pueden crear grupos para un curso inactivo.", 409, "CURSO_INACTIVO");
  }

  if (datos.docenteId) {
    const [docente] = await tx
      .select()
      .from(docentes)
      .where(and(eq(docentes.id, datos.docenteId), isNull(docentes.deletedAt)))
      .limit(1);
    if (!docente) lanzarNoEncontrado("DOCENTE");
    if (docente.estado !== "ACTIVO") {
      throw new AppError("No se pueden asignar docentes inactivos.", 409, "DOCENTE_INACTIVO");
    }
  }

  if (datos.aulaId) {
    const [aula] = await tx
      .select()
      .from(aulas)
      .where(and(eq(aulas.id, datos.aulaId), isNull(aulas.deletedAt)))
      .limit(1);
    if (!aula) lanzarNoEncontrado("AULA");
    if (!aula.activa) {
      throw new AppError("No se pueden asignar aulas inactivas.", 409, "AULA_INACTIVA");
    }
  }
};

/** Rechaza solapamientos horarios con aulas o docentes en grupos vigentes. */
const validarConflictosHorario = async (
  tx: Transaccion,
  datos: CrearGrupo,
  grupoId?: string,
) => {
  if (!datos.aulaId && !datos.docenteId) return;

  const recursos = [
    datos.aulaId ? eq(grupos.aulaId, datos.aulaId) : undefined,
    datos.docenteId ? eq(grupos.docenteId, datos.docenteId) : undefined,
  ].filter((condicion) => condicion !== undefined);
  const condiciones = [
    inArray(horariosGrupos.diaSemana, datos.horarios.map(({ diaSemana }) => diaSemana)),
    inArray(grupos.estado, ["PROGRAMADO", "EN_CURSO"]),
    isNull(grupos.deletedAt),
    lte(grupos.fechaInicio, datos.fechaFin),
    gte(grupos.fechaFin, datos.fechaInicio),
    or(...recursos)!,
  ];
  if (grupoId) condiciones.push(ne(grupos.id, grupoId));

  const existentes = await tx
    .select({
      codigo: grupos.codigo,
      aulaId: grupos.aulaId,
      docenteId: grupos.docenteId,
      diaSemana: horariosGrupos.diaSemana,
      horaInicio: horariosGrupos.horaInicio,
      horaFin: horariosGrupos.horaFin,
    })
    .from(horariosGrupos)
    .innerJoin(grupos, eq(horariosGrupos.grupoId, grupos.id))
    .where(and(...condiciones));

  for (const propuesto of datos.horarios) {
    const encontrado = existentes.find((actual) => {
      if (actual.diaSemana !== propuesto.diaSemana) return false;
      const seSolapan =
        minutos(actual.horaInicio) < minutos(propuesto.horaFin) &&
        minutos(actual.horaFin) > minutos(propuesto.horaInicio);
      return (
        seSolapan &&
        ((datos.aulaId && actual.aulaId === datos.aulaId) ||
          (datos.docenteId && actual.docenteId === datos.docenteId))
      );
    });

    if (encontrado) {
      const mismaAula = Boolean(datos.aulaId && encontrado.aulaId === datos.aulaId);
      const campo = mismaAula ? "aulaId" : "docenteId";
      const recurso = mismaAula ? "El aula" : "El docente";
      throw new AppError(
        `${recurso} ya está ocupado en ese horario por el grupo ${encontrado.codigo}.`,
        409,
        mismaAula ? "AULA_OCUPADA" : "DOCENTE_OCUPADO",
        [{ field: campo, message: "Existe un grupo con horario superpuesto." }],
      );
    }
  }
};

const obtenerHorariosPorGrupo = async (ids: string[]) => {
  if (!ids.length) return new Map<string, GrupoConHorarios["horarios"]>();
  const horarios = await db
    .select()
    .from(horariosGrupos)
    .where(inArray(horariosGrupos.grupoId, ids));
  const porGrupo = new Map<string, GrupoConHorarios["horarios"]>();
  for (const horario of horarios) {
    const lista = porGrupo.get(horario.grupoId) ?? [];
    lista.push(horario);
    porGrupo.set(horario.grupoId, lista);
  }
  return porGrupo;
};

const incluirHorarios = async (registros: (typeof grupos.$inferSelect)[]) => {
  const horariosPorGrupo = await obtenerHorariosPorGrupo(registros.map(({ id }) => id));
  return registros.map((grupo) => ({
    ...grupo,
    horarios: horariosPorGrupo.get(grupo.id) ?? [],
  }));
};

const siguienteCodigoGrupo = async (tx: Transaccion, periodoId: string) => {
  const registros = await tx
    .select({ codigo: grupos.codigo })
    .from(grupos)
    .where(eq(grupos.periodoId, periodoId));
  const mayorNumero = registros.reduce((mayor, { codigo }) => {
    const coincidencia = /^GRU-(\d+)$/.exec(codigo);
    return coincidencia ? Math.max(mayor, Number(coincidencia[1])) : mayor;
  }, 0);
  return `GRU-${String(mayorNumero + 1).padStart(4, "0")}`;
};

const prepararDatosHorario = (horarios: CrearGrupo["horarios"]) =>
  horarios.map((horario) => ({
    ...horario,
    horaInicio: `${horario.horaInicio}:00`,
    horaFin: `${horario.horaFin}:00`,
  }));

/** Registra un grupo, sus horarios y su cupo inicial en una transacción. */
export const crearGrupo = async (
  datos: CrearGrupo,
  usuarioId: string,
): Promise<GrupoConHorarios> =>
  db.transaction(async (tx) => {
    await validarReferencias(tx, datos);
    await validarConflictosHorario(tx, datos);
    const codigo = await siguienteCodigoGrupo(tx, datos.periodoId);
    const [grupo] = await tx
      .insert(grupos)
      .values({
        periodoId: datos.periodoId,
        cursoId: datos.cursoId,
        docenteId: datos.docenteId ?? null,
        aulaId: datos.aulaId ?? null,
        codigo,
        cupoMaximo: datos.cupoMaximo,
        cuposDisponibles: datos.cupoMaximo,
        fechaInicio: datos.fechaInicio,
        fechaFin: datos.fechaFin,
      })
      .returning();
    const horarios = await tx
      .insert(horariosGrupos)
      .values(
        prepararDatosHorario(datos.horarios).map((horario) => ({
          ...horario,
          grupoId: grupo.id,
        })),
      )
      .returning();
    await registrarAuditoria({
      usuarioId,
      tablaAfectada: "grupos",
      registroId: grupo.id,
      accion: "CREATE",
      datosNuevos: { ...grupo, horarios },
      motivo: "Creación de grupo académico",
    });
    return { ...grupo, horarios };
  });

/** Lista grupos con horarios y filtros por periodo, curso, docente, aula o estado. */
export const obtenerGrupos = async (
  filtros: FiltrosGrupo = {},
): Promise<GrupoConHorarios[]> => {
  const condiciones = [isNull(grupos.deletedAt)];
  if (filtros.periodoId) condiciones.push(eq(grupos.periodoId, filtros.periodoId));
  if (filtros.cursoId) condiciones.push(eq(grupos.cursoId, filtros.cursoId));
  if (filtros.docenteId) condiciones.push(eq(grupos.docenteId, filtros.docenteId));
  if (filtros.aulaId) condiciones.push(eq(grupos.aulaId, filtros.aulaId));
  if (filtros.estado) condiciones.push(eq(grupos.estado, filtros.estado));
  const registros = await db
    .select()
    .from(grupos)
    .where(and(...condiciones))
    .orderBy(desc(grupos.createdAt));
  return incluirHorarios(registros);
};

/** Obtiene un grupo y todos sus horarios asociados. */
export const obtenerGrupoPorId = async (id: string): Promise<GrupoConHorarios> => {
  const [grupo] = await db
    .select()
    .from(grupos)
    .where(and(eq(grupos.id, id), isNull(grupos.deletedAt)))
    .limit(1);
  if (!grupo) lanzarNoEncontrado("GRUPO");
  return (await incluirHorarios([grupo]))[0];
};

/** Edita los datos y horarios del grupo conservando el número de cupos ocupados. */
export const actualizarGrupo = async (
  id: string,
  cambios: ActualizarGrupo,
  usuarioId: string,
): Promise<GrupoConHorarios> =>
  db.transaction(async (tx) => {
    const [actual] = await tx
      .select()
      .from(grupos)
      .where(and(eq(grupos.id, id), isNull(grupos.deletedAt)))
      .limit(1);
    if (!actual) lanzarNoEncontrado("GRUPO");

    const horariosActuales = cambios.horarios
      ? undefined
      : await tx
          .select({
            diaSemana: horariosGrupos.diaSemana,
            horaInicio: horariosGrupos.horaInicio,
            horaFin: horariosGrupos.horaFin,
          })
          .from(horariosGrupos)
          .where(eq(horariosGrupos.grupoId, id));
    const datosCompletos: CrearGrupo = {
      periodoId: cambios.periodoId ?? actual.periodoId,
      cursoId: cambios.cursoId ?? actual.cursoId,
      docenteId: actual.docenteId,
      aulaId: cambios.aulaId === undefined ? actual.aulaId : cambios.aulaId,
      cupoMaximo: cambios.cupoMaximo ?? actual.cupoMaximo,
      fechaInicio: cambios.fechaInicio ?? actual.fechaInicio,
      fechaFin: cambios.fechaFin ?? actual.fechaFin,
      horarios:
        cambios.horarios ??
        (horariosActuales ?? []).map(({ diaSemana, horaInicio, horaFin }) => ({
          diaSemana,
          horaInicio: horaInicio.slice(0, 5),
          horaFin: horaFin.slice(0, 5),
        })),
    };
    if (datosCompletos.horarios.length === 0) {
      throw new AppError(
        "El grupo debe tener al menos un horario.",
        400,
        "HORARIOS_REQUERIDOS",
        [{ field: "horarios", message: "Agregue al menos un horario al grupo." }],
      );
    }
    if (actual.estado === "CANCELADO") {
      throw new AppError(
        "Un grupo cancelado no se puede modificar ni reactivar.",
        409,
        "GRUPO_CANCELADO",
      );
    }

    await validarReferencias(tx, datosCompletos);
    await validarConflictosHorario(tx, datosCompletos, id);

    const [{ ocupados }] = await tx
      .select({ ocupados: sql<number>`count(*)::int` })
      .from(matriculas)
      .where(and(eq(matriculas.grupoId, id), eq(matriculas.estadoMatricula, "ACTIVA")));
    const cuposOcupados = Math.max(actual.cupoMaximo - actual.cuposDisponibles, ocupados);
    if (datosCompletos.cupoMaximo < cuposOcupados) {
      throw new AppError(
        "El cupo máximo no puede ser inferior al número de cupos ocupados.",
        409,
        "CUPO_MENOR_A_MATRICULADOS",
        [{ field: "cupoMaximo", message: `Hay ${cuposOcupados} cupos ocupados.` }],
      );
    }

    const [actualizado] = await tx
      .update(grupos)
      .set({
        periodoId: datosCompletos.periodoId,
        cursoId: datosCompletos.cursoId,
        docenteId: datosCompletos.docenteId ?? null,
        aulaId: datosCompletos.aulaId ?? null,
        cupoMaximo: datosCompletos.cupoMaximo,
        cuposDisponibles: datosCompletos.cupoMaximo - cuposOcupados,
        fechaInicio: datosCompletos.fechaInicio,
        fechaFin: datosCompletos.fechaFin,
        updatedAt: new Date(),
      })
      .where(eq(grupos.id, id))
      .returning();

    await tx.delete(horariosGrupos).where(eq(horariosGrupos.grupoId, id));
    const horarios = await tx
      .insert(horariosGrupos)
      .values(
        prepararDatosHorario(datosCompletos.horarios).map((horario) => ({
          ...horario,
          grupoId: id,
        })),
      )
      .returning();
    await registrarAuditoria({
      usuarioId,
      tablaAfectada: "grupos",
      registroId: id,
      accion: "UPDATE",
      datosAntiguos: actual,
      datosNuevos: { ...actualizado, horarios },
      motivo: "Actualización de grupo académico",
    });
    return { ...actualizado, horarios };
  });

/** Cambia el estado de un grupo y conserva trazabilidad de la operación. */
export const cambiarEstadoGrupo = async (
  id: string,
  estado: EstadoGrupo,
  usuarioId: string,
) => {
  const actual = await obtenerGrupoPorId(id);
  if (actual.estado === "CANCELADO") {
    throw new AppError(
      "Un grupo cancelado no se puede reactivar ni cambiar de estado.",
      409,
      "GRUPO_CANCELADO",
    );
  }
  if (estado === "CANCELADO") {
    throw new AppError(
      "Use la operación de cancelación para cancelar un grupo.",
      400,
      "USE_CANCELAR_GRUPO",
    );
  }
  const [actualizado] = await db
    .update(grupos)
    .set({ estado, updatedAt: new Date() })
    .where(and(eq(grupos.id, id), eq(grupos.estado, actual.estado)))
    .returning();
  if (!actualizado) {
    throw new AppError("El estado del grupo cambió durante la operación.", 409, "ESTADO_GRUPO_MODIFICADO");
  }
  await registrarAuditoria({
    usuarioId,
    tablaAfectada: "grupos",
    registroId: id,
    accion: "UPDATE",
    datosAntiguos: { estado: actual.estado },
    datosNuevos: { estado: actualizado.estado },
    motivo: `Cambio de estado del grupo a ${estado}`,
  });
  return { ...actualizado, horarios: actual.horarios };
};

/** Cancela definitivamente un grupo programado; no permite cancelar grupos en curso. */
export const cancelarGrupo = async (
  id: string,
  motivo: string,
  usuarioId: string,
) => {
  const actual = await obtenerGrupoPorId(id);
  if (actual.estado === "CANCELADO") {
    throw new AppError(
      "El grupo ya está cancelado y no puede reactivarse.",
      409,
      "GRUPO_YA_CANCELADO",
    );
  }
  if (actual.estado === "EN_CURSO") {
    throw new AppError(
      "El grupo está en curso y no puede cancelarse.",
      409,
      "GRUPO_EN_CURSO_NO_CANCELABLE",
    );
  }
  if (actual.estado === "FINALIZADO") {
    throw new AppError("No se puede cancelar un grupo finalizado.", 409, "GRUPO_FINALIZADO");
  }
  if (!motivo.trim()) {
    throw new AppError(
      "El motivo de cancelación es obligatorio.",
      400,
      "MOTIVO_CANCELACION_REQUERIDO",
      [{ field: "motivo", message: "Este campo es obligatorio." }],
    );
  }

  const [cancelado] = await db
    .update(grupos)
    .set({ estado: "CANCELADO", updatedAt: new Date() })
    .where(and(eq(grupos.id, id), eq(grupos.estado, actual.estado)))
    .returning();
  if (!cancelado) {
    throw new AppError(
      "El estado del grupo cambió durante la operación; vuelva a consultar el grupo.",
      409,
      "ESTADO_GRUPO_MODIFICADO",
    );
  }

  await registrarAuditoria({
    usuarioId,
    tablaAfectada: "grupos",
    registroId: id,
    accion: "UPDATE",
    datosAntiguos: { estado: actual.estado },
    datosNuevos: { estado: cancelado.estado },
    motivo: `Cancelación del grupo: ${motivo.trim()}`,
  });
  return { ...cancelado, horarios: actual.horarios };
};

/** Cambia el docente de un grupo solo por uno activo y libre en esos horarios. */
export const cambiarDocenteGrupo = async (
  id: string,
  docenteId: string,
  motivo: string,
  usuarioId: string,
) =>
  db.transaction(async (tx) => {
    const [grupo] = await tx
      .select()
      .from(grupos)
      .where(and(eq(grupos.id, id), isNull(grupos.deletedAt)))
      .limit(1);
    if (!grupo) lanzarNoEncontrado("GRUPO");
    if (grupo.estado === "CANCELADO") {
      throw new AppError(
        "No se puede cambiar el docente de un grupo cancelado.",
        409,
        "GRUPO_CANCELADO",
      );
    }
    if (grupo.estado === "FINALIZADO") {
      throw new AppError(
        "No se puede cambiar el docente de un grupo finalizado.",
        409,
        "GRUPO_FINALIZADO",
      );
    }
    if (!motivo.trim()) {
      throw new AppError(
        "El motivo del cambio de docente es obligatorio.",
        400,
        "MOTIVO_CAMBIO_DOCENTE_REQUERIDO",
        [{ field: "motivo", message: "Este campo es obligatorio." }],
      );
    }

    const [docente] = await tx
      .select()
      .from(docentes)
      .where(and(eq(docentes.id, docenteId), isNull(docentes.deletedAt)))
      .limit(1);
    if (!docente) lanzarNoEncontrado("DOCENTE");
    if (docente.estado !== "ACTIVO") {
      throw new AppError("No se pueden asignar docentes inactivos.", 409, "DOCENTE_INACTIVO");
    }

    const horarios = await tx
      .select()
      .from(horariosGrupos)
      .where(eq(horariosGrupos.grupoId, id));
    const datosConflicto: CrearGrupo = {
      periodoId: grupo.periodoId,
      cursoId: grupo.cursoId,
      docenteId,
      aulaId: null,
      cupoMaximo: grupo.cupoMaximo,
      fechaInicio: grupo.fechaInicio,
      fechaFin: grupo.fechaFin,
      horarios: horarios.map(({ diaSemana, horaInicio, horaFin }) => ({
        diaSemana,
        horaInicio,
        horaFin,
      })),
    };
    await validarConflictosHorario(tx, datosConflicto, id);

    const [actualizado] = await tx
      .update(grupos)
      .set({ docenteId, updatedAt: new Date() })
      .where(and(eq(grupos.id, id), eq(grupos.estado, grupo.estado)))
      .returning();
    if (!actualizado) {
      throw new AppError(
        "El grupo cambió durante la operación; vuelva a consultar el grupo.",
        409,
        "GRUPO_MODIFICADO",
      );
    }

    await registrarAuditoria({
      usuarioId,
      tablaAfectada: "grupos",
      registroId: id,
      accion: "UPDATE",
      datosAntiguos: { docenteId: grupo.docenteId },
      datosNuevos: { docenteId: actualizado.docenteId },
      motivo: `Cambio de docente a ${docente.nombre} ${docente.apellidos}: ${motivo.trim()}`,
    });
    return { ...actualizado, horarios };
  });