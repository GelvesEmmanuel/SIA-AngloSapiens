import { and, asc, desc, eq, inArray, isNull, sql, notInArray } from "drizzle-orm";
import { db } from "../config/db.js";
import {
  cursos,
  docentes,
  estudiantes,
  grupos,
  horariosGrupos,
  matriculas,
  periodosAcademicos,
  asistencias,
  sesionesClase,
} from "../config/db/schema.js";
import { GuardarAsistenciaPayload } from "../types/asistencias.types.js";
import { AppError } from "../utils/appError.utils.js";
import { registrarAuditoria } from "./auditoriaSis.service.js";

/** Devuelve los grupos en los que el estudiante autenticado tiene matrícula activa. */
export const obtenerMisGrupos = async (usuarioId: string) => {
  const [estudiante] = await db
    .select({ id: estudiantes.id })
    .from(estudiantes)
    .where(
      and(eq(estudiantes.usuarioId, usuarioId), isNull(estudiantes.deletedAt)),
    )
    .limit(1);
  if (!estudiante) {
    throw new AppError(
      "No existe un perfil de estudiante asociado a esta cuenta.",
      404,
      "ESTUDIANTE_NO_ENCONTRADO",
    );
  }

  const matriculasActivas = await db
    .select({
      matriculaId: matriculas.id,
      fechaMatricula: matriculas.fechaMatricula,
      grupoId: grupos.id,
      codigo: grupos.codigo,
      estado: grupos.estado,
      fechaInicio: grupos.fechaInicio,
      fechaFin: grupos.fechaFin,
      cursoId: cursos.id,
      cursoCodigo: cursos.codigo,
      cursoNombre: cursos.nombre,
      nivel: cursos.nivel,
      periodoId: periodosAcademicos.id,
      periodoCodigo: periodosAcademicos.codigo,
      periodoNombre: periodosAcademicos.nombre,
      docenteId: docentes.id,
      docenteCodigo: docentes.codigo,
      docenteNombre: docentes.nombre,
      docenteApellidos: docentes.apellidos,
    })
    .from(matriculas)
    .innerJoin(grupos, eq(matriculas.grupoId, grupos.id))
    .innerJoin(cursos, eq(grupos.cursoId, cursos.id))
    .innerJoin(periodosAcademicos, eq(grupos.periodoId, periodosAcademicos.id))
    .leftJoin(
      docentes,
      and(eq(grupos.docenteId, docentes.id), isNull(docentes.deletedAt)),
    )
    .where(
      and(
        eq(matriculas.estudianteId, estudiante.id),
        eq(matriculas.estadoMatricula, "ACTIVA"),
        isNull(grupos.deletedAt),
      ),
    )
    .orderBy(desc(matriculas.fechaMatricula), asc(grupos.codigo));

  if (matriculasActivas.length === 0) return [];

  const horarios = await db
    .select({
      id: horariosGrupos.id,
      grupoId: horariosGrupos.grupoId,
      diaSemana: horariosGrupos.diaSemana,
      horaInicio: horariosGrupos.horaInicio,
      horaFin: horariosGrupos.horaFin,
    })
    .from(horariosGrupos)
    .where(
      inArray(
        horariosGrupos.grupoId,
        matriculasActivas.map(({ grupoId }) => grupoId),
      ),
    )
    .orderBy(asc(horariosGrupos.diaSemana), asc(horariosGrupos.horaInicio));

  const horariosPorGrupo = new Map<string, typeof horarios>();
  for (const horario of horarios) {
    const lista = horariosPorGrupo.get(horario.grupoId) ?? [];
    lista.push(horario);
    horariosPorGrupo.set(horario.grupoId, lista);
  }

  return matriculasActivas.map((matricula) => ({
    matriculaId: matricula.matriculaId,
    fechaMatricula: matricula.fechaMatricula,
    grupo: {
      id: matricula.grupoId,
      codigo: matricula.codigo,
      estado: matricula.estado,
      fechaInicio: matricula.fechaInicio,
      fechaFin: matricula.fechaFin,
      curso: {
        id: matricula.cursoId,
        codigo: matricula.cursoCodigo,
        nombre: matricula.cursoNombre,
        nivel: matricula.nivel,
      },
      periodo: {
        id: matricula.periodoId,
        codigo: matricula.periodoCodigo,
        nombre: matricula.periodoNombre,
      },
      docente:
        matricula.docenteId === null
          ? null
          : {
              id: matricula.docenteId,
              codigo: matricula.docenteCodigo,
              nombre: matricula.docenteNombre,
              apellidos: matricula.docenteApellidos,
            },
      horarios: (horariosPorGrupo.get(matricula.grupoId) ?? []).map(
        ({ grupoId: _grupoId, ...horario }) => horario,
      ),
    },
  }));
};

/** Devuelve los grupos asignados a un docente con la información básica del curso. */
export const obtenerMisGruposDocente = async (usuarioId: string) => {
  const [docente] = await db
    .select({ id: docentes.id })
    .from(docentes)
    .where(
      and(eq(docentes.usuarioId, usuarioId), isNull(docentes.deletedAt)),
    )
    .limit(1);

  if (!docente) {
    throw new AppError(
      "El usuario no tiene un perfil docente asignado.",
      403,
      "DOCENTE_NO_ASIGNADO",
    );
  }

  const gruposDocente = await db
    .select({
      grupoId: grupos.id,
      grupoCodigo: grupos.codigo,
      grupoEstado: grupos.estado,
      fechaInicio: grupos.fechaInicio,
      fechaFin: grupos.fechaFin,
      cursoId: cursos.id,
      cursoCodigo: cursos.codigo,
      cursoNombre: cursos.nombre,
      cursoNivel: cursos.nivel,
      periodoId: periodosAcademicos.id,
      periodoCodigo: periodosAcademicos.codigo,
      periodoNombre: periodosAcademicos.nombre,
    })
    .from(grupos)
    .innerJoin(cursos, eq(grupos.cursoId, cursos.id))
    .innerJoin(periodosAcademicos, eq(grupos.periodoId, periodosAcademicos.id))
    .where(
      and(
        eq(grupos.docenteId, docente.id),
        isNull(grupos.deletedAt),
        isNull(cursos.deletedAt),
      ),
    )
    .orderBy(desc(grupos.createdAt), asc(grupos.codigo));

  if (gruposDocente.length === 0) return [];

  const horarios = await db
    .select({
      id: horariosGrupos.id,
      grupoId: horariosGrupos.grupoId,
      diaSemana: horariosGrupos.diaSemana,
      horaInicio: horariosGrupos.horaInicio,
      horaFin: horariosGrupos.horaFin,
    })
    .from(horariosGrupos)
    .where(
      inArray(
        horariosGrupos.grupoId,
        gruposDocente.map(({ grupoId }) => grupoId),
      ),
    )
    .orderBy(asc(horariosGrupos.diaSemana), asc(horariosGrupos.horaInicio));

  const horariosPorGrupo = new Map<string, typeof horarios>();
  for (const horario of horarios) {
    const lista = horariosPorGrupo.get(horario.grupoId) ?? [];
    lista.push(horario);
    horariosPorGrupo.set(horario.grupoId, lista);
  }

  return gruposDocente.map((grupo) => ({
    id: grupo.grupoId,
    codigo: grupo.grupoCodigo,
    estado: grupo.grupoEstado,
    fechaInicio: grupo.fechaInicio,
    fechaFin: grupo.fechaFin,
    curso: {
      id: grupo.cursoId,
      codigo: grupo.cursoCodigo,
      nombre: grupo.cursoNombre,
      nivel: grupo.cursoNivel,
    },
    periodo: {
      id: grupo.periodoId,
      codigo: grupo.periodoCodigo,
      nombre: grupo.periodoNombre,
    },
    horarios: (horariosPorGrupo.get(grupo.grupoId) ?? []).map(
      ({ grupoId: _grupoId, ...horario }) => horario,
    ),
  }));
};

// logica de asistencias
export const guardarAsistenciaSesion = async (
  payload: GuardarAsistenciaPayload,
) => {
  const { grupoId, fechaClase, ausentes, usuarioId, roles = [] } = payload;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(grupoId)) {
    throw new AppError("El grupoId debe ser un UUID válido.", 400, "GRUPO_ID_INVALIDO");
  }

  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(fechaClase)) {
    throw new AppError(
      "La fechaClase debe tener el formato YYYY-MM-DD.",
      400,
      "FECHA_INVALIDA",
    );
  }

  const [anio, mes, dia] = fechaClase.split("-").map(Number);
  const fechaValida = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    fechaValida.getUTCFullYear() !== anio ||
    fechaValida.getUTCMonth() !== mes - 1 ||
    fechaValida.getUTCDate() !== dia
  ) {
    throw new AppError("La fechaClase no es una fecha válida.", 400, "FECHA_INVALIDA");
  }

  // Normalizamos y deduplicamos por estudianteId por seguridad
  const ausentesUnicos = Array.from(
    new Map(
      ausentes.map((item) => [
        item.estudianteId,
        {
          estudianteId: item.estudianteId,
          motivoInasistencia: item.motivoInasistencia?.trim()
            ? item.motivoInasistencia.trim()
            : null,
        },
      ]),
    ).values(),
  );

  const idsAusentes = ausentesUnicos.map((a) => a.estudianteId);

  return await db.transaction(async (tx) => {
    const [grupo] = await tx
      .select({
        id: grupos.id,
        docenteId: grupos.docenteId,
        fechaInicio: grupos.fechaInicio,
        fechaFin: grupos.fechaFin,
      })
      .from(grupos)
      .where(and(eq(grupos.id, grupoId), isNull(grupos.deletedAt)))
      .limit(1);

    if (!grupo) {
      throw new AppError("El grupo no existe.", 404, "GRUPO_NO_ENCONTRADO");
    }

    if (fechaClase < grupo.fechaInicio || fechaClase > grupo.fechaFin) {
      throw new AppError(
        "La fecha de clase está fuera del periodo del grupo.",
        400,
        "FECHA_FUERA_GRUPO",
      );
    }

    const puedeGestionarTodos = roles.some((rol) =>
      ["SUPER_ADMIN", "COORD_ACADEMICO"].includes(rol),
    );
    if (!puedeGestionarTodos) {
      const [docente] = await tx
        .select({ id: docentes.id })
        .from(docentes)
        .where(and(eq(docentes.usuarioId, usuarioId), isNull(docentes.deletedAt)))
        .limit(1);
      if (!docente || grupo.docenteId !== docente.id) {
        throw new AppError(
          "Solo puede registrar asistencia en los grupos que tiene asignados.",
          403,
          "GRUPO_NO_ASIGNADO",
        );
      }
    }

    for (const item of ausentesUnicos) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.estudianteId)) {
        throw new AppError(
          "Cada estudianteId debe ser un UUID válido.",
          400,
          "ESTUDIANTE_ID_INVALIDO",
        );
      }
    }

    if (idsAusentes.length > 0) {
      const matriculasActivas = await tx
        .select({ estudianteId: matriculas.estudianteId })
        .from(matriculas)
        .innerJoin(estudiantes, eq(matriculas.estudianteId, estudiantes.id))
        .where(
          and(
            eq(matriculas.grupoId, grupoId),
            eq(matriculas.estadoMatricula, "ACTIVA"),
            isNull(estudiantes.deletedAt),
          ),
        );
      const idsMatriculados = new Set(
        matriculasActivas.map(({ estudianteId }) => estudianteId),
      );
      const idsInvalidos = idsAusentes.filter(
        (estudianteId) => !idsMatriculados.has(estudianteId),
      );
      if (idsInvalidos.length > 0) {
        throw new AppError(
          "Todos los estudiantes ausentes deben tener matrícula activa en el grupo.",
          400,
          "ESTUDIANTE_NO_MATRICULADO",
        );
      }
    }

    // 1. Buscar o crear la sesión de clase para (grupoId, fechaClase)
    const [sesionExistente] = await tx
      .select()
      .from(sesionesClase)
      .where(
        and(
          eq(sesionesClase.grupoId, grupoId),
          eq(sesionesClase.fechaClase, fechaClase),
        ),
      );

    let sesionId: string;
    let esEdicion = false;

    if (sesionExistente) {
      sesionId = sesionExistente.id;
      esEdicion = true;
    } else {
      const [nuevaSesion] = await tx
        .insert(sesionesClase)
        .values({
          grupoId,
          fechaClase,
        })
        .returning();

      sesionId = nuevaSesion.id;
    }

    // 2. Eliminar ausencias previas que ya no estén marcadas (edición / destildar)
    const ausenciasAnteriores = esEdicion
      ? await tx
          .select()
          .from(asistencias)
          .where(eq(asistencias.sesionId, sesionId))
      : [];

    if (idsAusentes.length > 0) {
      await tx
        .delete(asistencias)
        .where(
          and(
            eq(asistencias.sesionId, sesionId),
            notInArray(asistencias.estudianteId, idsAusentes),
          ),
        );
    } else {
      // Si no hay ausentes (todos asistieron), limpiamos cualquier ausencia previa de esa sesión
      await tx.delete(asistencias).where(eq(asistencias.sesionId, sesionId));
    }

    // 3. Insertar o actualizar únicamente los registros de excepción (AUSENTE)
    let registrosGuardados: (typeof asistencias.$inferSelect)[] = [];

    if (ausentesUnicos.length > 0) {
      const valoresAInsertar = ausentesUnicos.map((item) => ({
        sesionId,
        estudianteId: item.estudianteId,
        estado: "AUSENTE" as const,
        motivoInasistencia: item.motivoInasistencia,
        updatedAt: new Date(),
      }));

      registrosGuardados = await tx
        .insert(asistencias)
        .values(valoresAInsertar)
        .onConflictDoUpdate({
          target: [asistencias.sesionId, asistencias.estudianteId],
          set: {
            estado: sql`excluded.estado`,
            motivoInasistencia: sql`excluded.motivo_inasistencia`,
            updatedAt: new Date(),
          },
        })
        .returning();
    }

    // 4. Auditoría  (descomenta si quieres registrar cada guardado/edición)
    await registrarAuditoria({
      usuarioId,
      tablaAfectada: "sesiones_clase",
      registroId: sesionId,
      accion: esEdicion ? "UPDATE" : "CREATE",
      datosAntiguos: esEdicion
        ? {
            grupoId,
            fechaClase,
            ausentes: ausenciasAnteriores,
          }
        : null,
      datosNuevos: {
        grupoId,
        fechaClase,
        totalAusentes: registrosGuardados.length,
        ausentes: registrosGuardados,
      },
      motivo: esEdicion
        ? "Edición de asistencia de estudiantes"
        : "Registro de asistencia de estudiantes",
    });

    return {
      sesionId,
      grupoId,
      fechaClase,
      esEdicion,
      totalAusentes: registrosGuardados.length,
      ausentes: registrosGuardados,
    };
  });
};
// obtener asistencias y coneto de asistencias
const validarAccesoYExistenciaGrupo = async (
  grupoId: string,
  usuarioId?: string,
  roles: string[] = [],
) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(grupoId)) {
    throw new AppError("El grupoId debe ser un UUID válido.", 400, "GRUPO_ID_INVALIDO");
  }

  const [grupo] = await db
    .select({
      id: grupos.id,
      docenteId: grupos.docenteId,
      fechaInicio: grupos.fechaInicio,
      fechaFin: grupos.fechaFin,
    })
    .from(grupos)
    .where(and(eq(grupos.id, grupoId), isNull(grupos.deletedAt)))
    .limit(1);

  if (!grupo) {
    throw new AppError("El grupo no existe.", 404, "GRUPO_NO_ENCONTRADO");
  }

  const puedeGestionarTodos = roles.some((rol) =>
    ["SUPER_ADMIN", "COORD_ACADEMICO"].includes(rol),
  );
  if (!puedeGestionarTodos) {
    if (!usuarioId) {
      throw new AppError("No autorizado.", 401, "NO_AUTORIZADO");
    }
    const [docente] = await db
      .select({ id: docentes.id })
      .from(docentes)
      .where(and(eq(docentes.usuarioId, usuarioId), isNull(docentes.deletedAt)))
      .limit(1);
    if (!docente || grupo.docenteId !== docente.id) {
      throw new AppError(
        "Solo puede consultar los grupos que tiene asignados.",
        403,
        "GRUPO_NO_ASIGNADO",
      );
    }
  }

  return grupo;
};

export const obtenerAsistenciaPorFecha = async (
  grupoId: string,
  fechaClase: string,
  usuarioId?: string,
  roles: string[] = [],
) => {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(fechaClase)) {
    throw new AppError(
      "La fecha debe tener el formato YYYY-MM-DD.",
      400,
      "FECHA_INVALIDA",
    );
  }
  const [anio, mes, dia] = fechaClase.split("-").map(Number);
  const fechaValida = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    fechaValida.getUTCFullYear() !== anio ||
    fechaValida.getUTCMonth() !== mes - 1 ||
    fechaValida.getUTCDate() !== dia
  ) {
    throw new AppError("La fecha no es válida.", 400, "FECHA_INVALIDA");
  }

  const grupo = await validarAccesoYExistenciaGrupo(grupoId, usuarioId, roles);
  if (fechaClase < grupo.fechaInicio || fechaClase > grupo.fechaFin) {
    throw new AppError(
      "La fecha de clase está fuera del periodo del grupo.",
      400,
      "FECHA_FUERA_GRUPO",
    );
  }

  const [sesion] = await db
    .select()
    .from(sesionesClase)
    .where(
      and(
        eq(sesionesClase.grupoId, grupoId),
        eq(sesionesClase.fechaClase, fechaClase),
      ),
    );

  if (!sesion) {
    return {
      claseRegistrada: false,
      sesion: null,
      ausentes: [],
    };
  }

  const ausentes = await db
    .select({
      id: asistencias.id,
      sesionId: asistencias.sesionId,
      estudianteId: asistencias.estudianteId,
      estado: asistencias.estado,
      motivoInasistencia: asistencias.motivoInasistencia,
      createdAt: asistencias.createdAt,
      updatedAt: asistencias.updatedAt,
      estudianteCodigo: estudiantes.codigo,
      estudianteNombre: estudiantes.nombre,
      estudianteApellidos: estudiantes.apellidos,
    })
    .from(asistencias)
    .innerJoin(estudiantes, eq(asistencias.estudianteId, estudiantes.id))
    .where(
      and(
        eq(asistencias.sesionId, sesion.id),
        eq(asistencias.estado, "AUSENTE"),
        isNull(estudiantes.deletedAt),
      ),
    )
    .orderBy(asc(estudiantes.apellidos), asc(estudiantes.nombre));

  return {
    claseRegistrada: true,
    sesion,
    ausentes,
  };
};

export const obtenerConteoInasistenciasGrupo = async (
  grupoId: string,
  usuarioId?: string,
  roles: string[] = [],
) => {
  await validarAccesoYExistenciaGrupo(grupoId, usuarioId, roles);

  // Total de clases dictadas en el grupo
  const [{ totalSesiones }] = await db
    .select({
      totalSesiones: sql<number>`count(*)::int`,
    })
    .from(sesionesClase)
    .where(eq(sesionesClase.grupoId, grupoId));

  // Conteo de ausencias por estudiante en las sesiones de ese grupo
  const conteoPorEstudiante = await db
    .select({
      estudianteId: asistencias.estudianteId,
      totalInasistencias: sql<number>`count(*)::int`,
    })
    .from(asistencias)
    .innerJoin(sesionesClase, eq(asistencias.sesionId, sesionesClase.id))
    .where(
      and(
        eq(sesionesClase.grupoId, grupoId),
        eq(asistencias.estado, "AUSENTE"),
      ),
    )
    .groupBy(asistencias.estudianteId);

  return {
    grupoId,
    totalSesionesDictadas: totalSesiones,
    estudiantes: conteoPorEstudiante.map((row) => ({
      estudianteId: row.estudianteId,
      totalInasistencias: row.totalInasistencias,
      totalSesionesDictadas: totalSesiones,
    })),
  };
};

// funcion para obetner todas las inaxistencias del grupo o historial completo
export const obtenerHistorialInasistenciasGrupo = async (
  grupoId: string,
  usuarioId?: string,
  roles: string[] = [],
) => {
  await validarAccesoYExistenciaGrupo(grupoId, usuarioId, roles);

  const inasistencias = await db
    .select({
      asistenciaId: asistencias.id,
      sesionId: sesionesClase.id,
      fechaClase: sesionesClase.fechaClase,
      estudianteId: estudiantes.id,
      estudianteCodigo: estudiantes.codigo,
      estudianteNombre: estudiantes.nombre,
      estudianteApellidos: estudiantes.apellidos,
      estado: asistencias.estado,
      motivoInasistencia: asistencias.motivoInasistencia,
      createdAt: asistencias.createdAt,
    })
    .from(asistencias)
    .innerJoin(sesionesClase, eq(asistencias.sesionId, sesionesClase.id))
    .innerJoin(estudiantes, eq(asistencias.estudianteId, estudiantes.id))
    .where(
      and(
        eq(sesionesClase.grupoId, grupoId),
        eq(asistencias.estado, "AUSENTE"),
        isNull(estudiantes.deletedAt),
      ),
    )
    .orderBy(
      desc(sesionesClase.fechaClase),
      asc(estudiantes.apellidos),
      asc(estudiantes.nombre),
    );

  return {
    grupoId,
    totalInasistencias: inasistencias.length,
    inasistencias,
  };
};