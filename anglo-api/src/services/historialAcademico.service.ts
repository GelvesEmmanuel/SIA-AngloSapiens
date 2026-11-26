import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../config/db.js";
import {
  cursos,
  estudiantes,
  grupos,
  habilidadesCurso,
  matriculas,
  notas,
  periodosAcademicos,
} from "../config/db/schema.js";

export interface OpcionesHistorialAcademico {
  /** Si se pasa true, trae todas las matrículas; si es false o se omite, trae las finalizadas (historial consolidado). */
  incluirNoFinalizadas?: boolean;
  /** Si se pasa true, oculta notas de matrículas donde notasPublicadas sea false (útil para vista de estudiante). */
  soloPublicadas?: boolean;
}

export const obtenerHistorialAcademicoEstudiante = async (
  estudianteId: string,
  opciones: OpcionesHistorialAcademico = {},
) => {
  const { incluirNoFinalizadas = false, soloPublicadas = false } = opciones;

  // 1. Verificar que el estudiante exista y no esté eliminado
  const [estudiante] = await db
    .select({
      id: estudiantes.id,
      codigo: estudiantes.codigo,
      nombre: estudiantes.nombre,
      apellidos: estudiantes.apellidos,
      numeroDocumento: estudiantes.numeroDocumento,
    })
    .from(estudiantes)
    .where(and(eq(estudiantes.id, estudianteId), isNull(estudiantes.deletedAt)));

  if (!estudiante) {
    throw new Error("El estudiante especificado no existe.");
  }

  // 2. Filtrar matrículas (por defecto solo FINALIZADA para el historial académico)
  const condicionesMatricula = [eq(matriculas.estudianteId, estudianteId)];
  if (!incluirNoFinalizadas) {
    condicionesMatricula.push(eq(matriculas.estadoMatricula, "FINALIZADA"));
  }

  const filasMatriculas = await db
    .select({
      matriculaId: matriculas.id,
      codigoMatricula: matriculas.codigo,
      tipoMatricula: matriculas.tipoMatricula,
      estadoMatricula: matriculas.estadoMatricula,
      estadoPago: matriculas.estadoPago,
      notasPublicadas: matriculas.notasPublicadas,
      notaExamenFinal: matriculas.notaExamenFinal,
      notaFinal: matriculas.notaFinal,
      fechaMatricula: matriculas.fechaMatricula,
      fechaFinalizacion: matriculas.fechaFinalizacion,
      grupoId: grupos.id,
      codigoGrupo: grupos.codigo,
      fechaInicioGrupo: grupos.fechaInicio,
      fechaFinGrupo: grupos.fechaFin,
      cursoId: cursos.id,
      codigoCurso: cursos.codigo,
      nombreCurso: cursos.nombre,
      nivelCurso: cursos.nivel,
      periodoId: periodosAcademicos.id,
      nombrePeriodo: periodosAcademicos.nombre,
      fechaInicioPeriodo: periodosAcademicos.fechaInicio,
      fechaFinPeriodo: periodosAcademicos.fechaFin,
    })
    .from(matriculas)
    .innerJoin(grupos, eq(matriculas.grupoId, grupos.id))
    .innerJoin(cursos, eq(grupos.cursoId, cursos.id))
    .innerJoin(periodosAcademicos, eq(grupos.periodoId, periodosAcademicos.id))
    .where(and(...condicionesMatricula))
    .orderBy(
      desc(periodosAcademicos.fechaInicio),
      desc(matriculas.fechaFinalizacion),
      desc(matriculas.createdAt),
    );

  if (filasMatriculas.length === 0) {
    return {
      estudiante,
      totalRegistros: 0,
      historial: [],
    };
  }

  const matriculaIds = filasMatriculas.map((m) => m.matriculaId);
  const cursoIds = Array.from(new Set(filasMatriculas.map((m) => m.cursoId)));

  // 3. Traer todas las notas de esas matrículas en una sola consulta
  const filasNotas = await db
    .select({
      id: notas.id,
      matriculaId: notas.matriculaId,
      habilidad: notas.habilidad,
      nota: notas.nota,
    })
    .from(notas)
    .where(inArray(notas.matriculaId, matriculaIds));

  // 4. Traer las habilidades configuradas por curso para conocer el total del 70%
  const filasHabilidadesCurso = await db
    .select({
      cursoId: habilidadesCurso.cursoId,
      habilidad: habilidadesCurso.habilidad,
    })
    .from(habilidadesCurso)
    .where(inArray(habilidadesCurso.cursoId, cursoIds));

  // Agrupar notas por matriculaId
  const notasPorMatricula = new Map<
    string,
    { id: string; habilidad: string; nota: string }[]
  >();
  for (const fila of filasNotas) {
    const lista = notasPorMatricula.get(fila.matriculaId) ?? [];
    lista.push({
      id: fila.id,
      habilidad: fila.habilidad,
      nota: fila.nota,
    });
    notasPorMatricula.set(fila.matriculaId, lista);
  }

  // Agrupar habilidades del curso por cursoId
  const habilidadesPorCurso = new Map<string, string[]>();
  for (const fila of filasHabilidadesCurso) {
    const lista = habilidadesPorCurso.get(fila.cursoId) ?? [];
    lista.push(fila.habilidad);
    habilidadesPorCurso.set(fila.cursoId, lista);
  }

  // 5. Armar el historial consolidado por matrícula
  const historial = filasMatriculas.map((item) => {
    const puedeVerNotas = !soloPublicadas || item.notasPublicadas;
    const notasHabilidad = puedeVerNotas
      ? (notasPorMatricula.get(item.matriculaId) ?? [])
      : [];

    const habilidadesDelCurso = habilidadesPorCurso.get(item.cursoId) ?? [];
    const totalHabilidades = habilidadesDelCurso.length;

    const sumaHabilidades = notasHabilidad.reduce(
      (acc, n) => acc + Number(n.nota),
      0,
    );
    const promedioHabilidades =
      puedeVerNotas && totalHabilidades > 0
        ? Math.round((sumaHabilidades / totalHabilidades) * 100) / 100
        : null;

    return {
      matricula: {
        id: item.matriculaId,
        codigo: item.codigoMatricula,
        tipoMatricula: item.tipoMatricula,
        estadoMatricula: item.estadoMatricula,
        estadoPago: item.estadoPago,
        notasPublicadas: item.notasPublicadas,
        fechaMatricula: item.fechaMatricula,
        fechaFinalizacion: item.fechaFinalizacion,
      },
      periodo: {
        id: item.periodoId,
        nombre: item.nombrePeriodo,
        fechaInicio: item.fechaInicioPeriodo,
        fechaFin: item.fechaFinPeriodo,
      },
      curso: {
        id: item.cursoId,
        codigo: item.codigoCurso,
        nombre: item.nombreCurso,
        nivel: item.nivelCurso,
        totalHabilidadesConfiguradas: totalHabilidades,
      },
      grupo: {
        id: item.grupoId,
        codigo: item.codigoGrupo,
        fechaInicio: item.fechaInicioGrupo,
        fechaFin: item.fechaFinGrupo,
      },
      calificaciones: {
        visible: puedeVerNotas,
        notasPorHabilidad: notasHabilidad,
        promedioHabilidades,
        notaExamenFinal: puedeVerNotas ? item.notaExamenFinal : null,
        notaFinal: puedeVerNotas ? item.notaFinal : null,
      },
    };
  });

  return {
    estudiante,
    totalRegistros: historial.length,
    historial,
  };
};