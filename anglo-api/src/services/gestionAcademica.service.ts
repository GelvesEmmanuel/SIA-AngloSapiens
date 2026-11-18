import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../config/db.js";
import {
  cursos,
  docentes,
  estudiantes,
  grupos,
  horariosGrupos,
  matriculas,
  periodosAcademicos,
} from "../config/db/schema.js";
import { AppError } from "../utils/appError.utils.js";

/** Devuelve los grupos en los que el estudiante autenticado tiene matrícula activa. */
export const obtenerMisGrupos = async (usuarioId: string) => {
  const [estudiante] = await db
    .select({ id: estudiantes.id })
    .from(estudiantes)
    .where(and(eq(estudiantes.usuarioId, usuarioId), isNull(estudiantes.deletedAt)))
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
    .where(inArray(horariosGrupos.grupoId, matriculasActivas.map(({ grupoId }) => grupoId)))
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
