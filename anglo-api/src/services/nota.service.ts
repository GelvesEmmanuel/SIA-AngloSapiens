import { and, eq, isNull } from "drizzle-orm";
import { db } from "../config/db.js";
import {
  cursos,
  docentes,
  estudiantes,
  grupos,
  habilidadesCurso,
  matriculas,
  notas,
} from "../config/db/schema.js";
import type { HabilidadNota, NotaHabilidad } from "../types/notas.types.js";
import { AppError } from "../utils/appError.utils.js";
import { registrarAuditoria } from "./auditoriaSis.service.js";

type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];

const puedeGestionarTodos = (roles: string[]) =>
  roles.some((rol) =>
    ["SUPER_ADMIN", "COORD_ACADEMICO", "COORD_ADMINISTRATIVO"].includes(rol),
  );

const obtenerUsuarioEstudiante = async (tx: Transaccion, usuarioId: string) => {
  const [estudiante] = await tx
    .select({ id: estudiantes.id })
    .from(estudiantes)
    .where(and(eq(estudiantes.usuarioId, usuarioId), isNull(estudiantes.deletedAt)))
    .limit(1);
  return estudiante ?? null;
};

const obtenerUsuarioDocente = async (tx: Transaccion, usuarioId: string) => {
  const [docente] = await tx
    .select({ id: docentes.id })
    .from(docentes)
    .where(and(eq(docentes.usuarioId, usuarioId), isNull(docentes.deletedAt)))
    .limit(1);
  return docente ?? null;
};

const validarAccesoMatricula = async (
  tx: Transaccion,
  matriculaId: string,
  usuarioId: string,
  roles: string[],
  permitirEdicion: boolean,
) => {
  const [matricula] = await tx
    .select()
    .from(matriculas)
    .where(eq(matriculas.id, matriculaId))
    .limit(1)
    .for("update");
  if (!matricula) {
    throw new AppError("La matrícula especificada no existe.", 404, "MATRICULA_NO_ENCONTRADA");
  }

  const [grupo] = await tx
    .select()
    .from(grupos)
    .where(and(eq(grupos.id, matricula.grupoId), isNull(grupos.deletedAt)))
    .limit(1);
  if (!grupo) {
    throw new AppError("El grupo de la matrícula no existe.", 404, "GRUPO_NO_ENCONTRADO");
  }

  if (puedeGestionarTodos(roles)) return { matricula, grupo };

  if (roles.includes("ESTUDIANTE") && !permitirEdicion) {
    const estudiante = await obtenerUsuarioEstudiante(tx, usuarioId);
    if (!estudiante || estudiante.id !== matricula.estudianteId) {
      throw new AppError(
        "Solo puede consultar las notas asociadas a su propia matrícula.",
        403,
        "NOTAS_NO_AUTORIZADAS",
      );
    }
    return { matricula, grupo };
  }

  if (roles.includes("DOCENTE")) {
    const docente = await obtenerUsuarioDocente(tx, usuarioId);
    if (!docente || grupo.docenteId !== docente.id) {
      throw new AppError(
        "Solo puede consultar o gestionar las notas de los grupos que tiene asignados.",
        403,
        "GRUPO_NO_ASIGNADO",
      );
    }
    return { matricula, grupo };
  }

  throw new AppError(
    "No cuenta con los permisos necesarios para realizar esta acción.",
    403,
    "PERMISOS_INSUFICIENTES",
  );
};

const obtenerHabilidadesCurso = async (tx: Transaccion, cursoId: string) =>
  tx
    .select({ habilidad: habilidadesCurso.habilidad })
    .from(habilidadesCurso)
    .where(eq(habilidadesCurso.cursoId, cursoId));

const recalcularNotaFinal = async (
  tx: Transaccion,
  matriculaId: string,
  cursoId: string,
  notaExamenFinal: number | null,
) => {
  const habilidades = await obtenerHabilidadesCurso(tx, cursoId);
  if (habilidades.length === 0) {
    throw new AppError(
      "El curso no tiene habilidades configuradas.",
      409,
      "HABILIDADES_CURSO_NO_CONFIGURADAS",
    );
  }

  const notasRegistradas = await tx
    .select({ habilidad: notas.habilidad, nota: notas.nota })
    .from(notas)
    .where(eq(notas.matriculaId, matriculaId));
  const notasPorHabilidad = new Map(
    notasRegistradas.map(({ habilidad, nota }) => [habilidad, Number(nota)]),
  );

  const todasLasHabilidades = habilidades.every(({ habilidad }) =>
    notasPorHabilidad.has(habilidad),
  );
  let notaFinal: string | null = null;
  if (todasLasHabilidades && notaExamenFinal !== null) {
    const promedioHabilidades =
      habilidades.reduce(
        (total, { habilidad }) => total + (notasPorHabilidad.get(habilidad) ?? 0),
        0,
      ) / habilidades.length;
    const notaCalculada = promedioHabilidades * 0.7 + notaExamenFinal * 0.3;
    notaFinal = Math.max(0, Math.min(5, notaCalculada)).toFixed(1);
  }

  await tx
    .update(matriculas)
    .set({
      notaFinal,
      notasPublicadas: false,
      updatedAt: new Date(),
    })
    .where(eq(matriculas.id, matriculaId));
  return notaFinal;
};

export const registrarNotasHabilidades = async (
  matriculaId: string,
  datos: NotaHabilidad[],
  usuarioId: string,
  roles: string[],
) =>
  db.transaction(async (tx) => {
    const { matricula, grupo } = await validarAccesoMatricula(
      tx,
      matriculaId,
      usuarioId,
      roles,
      true,
    );

    const habilidades = await obtenerHabilidadesCurso(tx, grupo.cursoId);
    const habilidadesValidas = new Set(habilidades.map(({ habilidad }) => habilidad));
    for (const item of datos) {
      if (!habilidadesValidas.has(item.habilidad as never)) {
        throw new AppError(
          `La habilidad ${item.habilidad} no pertenece al curso de la matrícula.`,
          400,
          "HABILIDAD_NO_PERTENECE_CURSO",
        );
      }
    }

    const registradas = [];
    for (const item of datos) {
      const [notaRegistrada] = await tx
        .insert(notas)
        .values({
          matriculaId,
          cursoId: grupo.cursoId,
          habilidad: item.habilidad,
          nota: item.nota.toFixed(1),
        })
        .onConflictDoUpdate({
          target: [notas.matriculaId, notas.habilidad],
          set: { nota: item.nota.toFixed(1), updatedAt: new Date() },
        })
        .returning();
      registradas.push(notaRegistrada);
    }

    const notaFinal = await recalcularNotaFinal(
      tx,
      matriculaId,
      grupo.cursoId,
      matricula.notaExamenFinal == null ? null : Number(matricula.notaExamenFinal),
    );

    await registrarAuditoria({
      usuarioId,
      tablaAfectada: "notas",
      registroId: matriculaId,
      accion: "UPDATE",
      datosNuevos: {
        notas: registradas,
        notaFinal,
      },
      motivo: "Registro o actualización de notas por habilidades",
    });
    return { notas: registradas, notaFinal };
  });

export const actualizarNotaHabilidad = async (
  notaId: string,
  nota: number,
  usuarioId: string,
  roles: string[],
) =>
  db.transaction(async (tx) => {
    const [actual] = await tx
      .select()
      .from(notas)
      .where(eq(notas.id, notaId))
      .limit(1)
      .for("update");
    if (!actual) {
      throw new AppError("La nota especificada no existe.", 404, "NOTA_NO_ENCONTRADA");
    }

    const { matricula, grupo } = await validarAccesoMatricula(
      tx,
      actual.matriculaId,
      usuarioId,
      roles,
      true,
    );
    const [actualizada] = await tx
      .update(notas)
      .set({ nota: nota.toFixed(1), updatedAt: new Date() })
      .where(eq(notas.id, notaId))
      .returning();
    const notaFinal = await recalcularNotaFinal(
      tx,
      actual.matriculaId,
      grupo.cursoId,
      matricula.notaExamenFinal == null ? null : Number(matricula.notaExamenFinal),
    );

    await registrarAuditoria({
      usuarioId,
      tablaAfectada: "notas",
      registroId: notaId,
      accion: "UPDATE",
      datosAntiguos: actual,
      datosNuevos: { ...actualizada, notaFinal },
      motivo: "Actualización de nota por habilidad",
    });
    return { ...actualizada, notaFinal };
  });

export const registrarNotaExamenFinal = async (
  matriculaId: string,
  notaExamenFinal: number,
  usuarioId: string,
  roles: string[],
) =>
  db.transaction(async (tx) => {
    const { matricula, grupo } = await validarAccesoMatricula(
      tx,
      matriculaId,
      usuarioId,
      roles,
      true,
    );
    await tx
      .update(matriculas)
      .set({
        notaExamenFinal: notaExamenFinal.toFixed(1),
        updatedAt: new Date(),
      })
      .where(eq(matriculas.id, matriculaId));
    const notaFinal = await recalcularNotaFinal(
      tx,
      matriculaId,
      grupo.cursoId,
      notaExamenFinal,
    );

    await registrarAuditoria({
      usuarioId,
      tablaAfectada: "matriculas",
      registroId: matriculaId,
      accion: "UPDATE",
      datosAntiguos: { notaExamenFinal: matricula.notaExamenFinal },
      datosNuevos: { notaExamenFinal: notaExamenFinal.toFixed(1), notaFinal },
      motivo: "Registro de nota del examen final",
    });
    return {
      matriculaId,
      notaExamenFinal: notaExamenFinal.toFixed(1),
      notaFinal,
    };
  });

export const cambiarPublicacionNotas = async (
  matriculaId: string,
  notasPublicadas: boolean,
  usuarioId: string,
  roles: string[],
) =>
  db.transaction(async (tx) => {
    const { matricula, grupo } = await validarAccesoMatricula(
      tx,
      matriculaId,
      usuarioId,
      roles,
      true,
    );

    if (matricula.estadoMatricula !== "ACTIVA") {
      throw new AppError(
        "Solo se pueden publicar notas de matrículas activas.",
        409,
        "MATRICULA_NO_ACTIVA",
      );
    }

    if (notasPublicadas) {
      const habilidades = await obtenerHabilidadesCurso(tx, grupo.cursoId);
      const notasRegistradas = await tx
        .select({ habilidad: notas.habilidad })
        .from(notas)
        .where(eq(notas.matriculaId, matriculaId));
      const habilidadesRegistradas = new Set(
        notasRegistradas.map(({ habilidad }) => habilidad),
      );
      const faltantes = habilidades.filter(
        ({ habilidad }) => !habilidadesRegistradas.has(habilidad),
      );

      if (faltantes.length > 0 || matricula.notaExamenFinal == null) {
        throw new AppError(
          "Para publicar las notas deben estar registradas todas las habilidades y la nota del examen final.",
          409,
          "NOTAS_INCOMPLETAS",
        );
      }
    }

    const [actualizada] = await tx
      .update(matriculas)
      .set({ notasPublicadas, updatedAt: new Date() })
      .where(eq(matriculas.id, matriculaId))
      .returning({
        id: matriculas.id,
        notasPublicadas: matriculas.notasPublicadas,
        notaExamenFinal: matriculas.notaExamenFinal,
        notaFinal: matriculas.notaFinal,
      });

    await registrarAuditoria({
      usuarioId,
      tablaAfectada: "matriculas",
      registroId: matriculaId,
      accion: "UPDATE",
      datosAntiguos: { notasPublicadas: matricula.notasPublicadas },
      datosNuevos: { notasPublicadas },
      motivo: notasPublicadas
        ? "Publicación de notas finales para el estudiante"
        : "Retiro de publicación de notas finales",
    });
    return actualizada;
  });

export const consultarNotasMatricula = async (
  matriculaId: string,
  usuarioId: string,
  roles: string[],
) =>
  db.transaction(async (tx) => {
    const { matricula, grupo } = await validarAccesoMatricula(
      tx,
      matriculaId,
      usuarioId,
      roles,
      false,
    );
    const esSoloEstudiante =
      roles.includes("ESTUDIANTE") &&
      !puedeGestionarTodos(roles) &&
      !roles.includes("DOCENTE");
    if (esSoloEstudiante) {
      if (
        matricula.estadoMatricula !== "ACTIVA" ||
        !matricula.notasPublicadas
      ) {
        return {
          matriculaId,
          estudianteId: matricula.estudianteId,
          grupoId: matricula.grupoId,
          notasPublicadas: false,
          notas: [],
          notaExamenFinal: null,
          notaFinal: null,
          mensaje:
            matricula.estadoMatricula !== "ACTIVA"
              ? "Las notas no están disponibles porque la matrícula no está activa."
              : "Las notas aún no han sido publicadas por el docente.",
        };
      }
    }

    const habilidades = await obtenerHabilidadesCurso(tx, grupo.cursoId);
    const notasEstudiante = await tx
      .select()
      .from(notas)
      .where(eq(notas.matriculaId, matriculaId));
    return {
      matriculaId,
      estudianteId: matricula.estudianteId,
      grupoId: matricula.grupoId,
      cursoId: grupo.cursoId,
      habilidadesConfiguradas: habilidades.map(({ habilidad }) => habilidad),
      notas: notasEstudiante,
      notaExamenFinal: matricula.notaExamenFinal,
      notaFinal: matricula.notaFinal,
      notasPublicadas: matricula.notasPublicadas,
    };
  });

export const consultarNotasEstudiante = async (
  estudianteId: string,
  usuarioId: string,
  roles: string[],
) => {
  if (roles.includes("ESTUDIANTE") && !puedeGestionarTodos(roles)) {
    const perfil = await db
      .select({ id: estudiantes.id })
      .from(estudiantes)
      .where(and(eq(estudiantes.usuarioId, usuarioId), isNull(estudiantes.deletedAt)))
      .limit(1);
    if (!perfil[0] || perfil[0].id !== estudianteId) {
      throw new AppError(
        "Solo puede consultar sus propias notas.",
        403,
        "NOTAS_NO_AUTORIZADAS",
      );
    }
  } else if (roles.includes("DOCENTE") && !puedeGestionarTodos(roles)) {
    const [docente] = await db
      .select({ id: docentes.id })
      .from(docentes)
      .where(and(eq(docentes.usuarioId, usuarioId), isNull(docentes.deletedAt)))
      .limit(1);
    if (!docente) {
      throw new AppError(
        "El usuario no tiene un perfil docente asignado.",
        403,
        "DOCENTE_NO_ASIGNADO",
      );
    }
    const [matriculaAsignada] = await db
      .select({ id: matriculas.id })
      .from(matriculas)
      .innerJoin(grupos, eq(matriculas.grupoId, grupos.id))
      .where(
        and(
          eq(matriculas.estudianteId, estudianteId),
          eq(grupos.docenteId, docente.id),
          isNull(grupos.deletedAt),
        ),
      )
      .limit(1);
    if (!matriculaAsignada) {
      throw new AppError(
        "Solo puede consultar notas de estudiantes en sus grupos asignados.",
        403,
        "NOTAS_NO_AUTORIZADAS",
      );
    }
  } else if (!puedeGestionarTodos(roles)) {
    throw new AppError(
      "No cuenta con los permisos necesarios para realizar esta acción.",
      403,
      "PERMISOS_INSUFICIENTES",
    );
  }

  const consultaEstudiante =
    roles.includes("ESTUDIANTE") &&
    !puedeGestionarTodos(roles) &&
    !roles.includes("DOCENTE");

  return db
    .select({
      matriculaId: matriculas.id,
      grupoId: matriculas.grupoId,
      cursoId: grupos.cursoId,
      codigoMatricula: matriculas.codigo,
      estadoMatricula: matriculas.estadoMatricula,
      notasPublicadas: matriculas.notasPublicadas,
      notaExamenFinal: matriculas.notaExamenFinal,
      notaFinal: matriculas.notaFinal,
    })
    .from(matriculas)
    .innerJoin(grupos, eq(matriculas.grupoId, grupos.id))
    .where(
      consultaEstudiante
        ? and(
            eq(matriculas.estudianteId, estudianteId),
            eq(matriculas.estadoMatricula, "ACTIVA"),
            eq(matriculas.notasPublicadas, true),
          )
        : eq(matriculas.estudianteId, estudianteId),
    );
};

export const consultarMisNotas = async (usuarioId: string) => {
  const [perfil] = await db
    .select({ id: estudiantes.id })
    .from(estudiantes)
    .where(and(eq(estudiantes.usuarioId, usuarioId), isNull(estudiantes.deletedAt)))
    .limit(1);
  if (!perfil) {
    throw new AppError("El usuario no tiene un perfil de estudiante.", 403, "ESTUDIANTE_NO_ASIGNADO");
  }
  return consultarNotasEstudiante(perfil.id, usuarioId, ["ESTUDIANTE"]);
};
