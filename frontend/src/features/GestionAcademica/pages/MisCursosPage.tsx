import { CalendarDays, Clock3, GraduationCap, UserRound } from "lucide-react";
import { useGruposAcademicos } from "../hooks/useGruposAcademicos";
import type { GrupoMatriculado } from "../gestionAcademica.types";
import { formatearNombreGrupo } from "../../GestionGrupos/grupo.formatters";

const dias: Record<string, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
};

const formatoFecha = (fecha: string) =>
  new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${fecha.slice(0, 10)}T00:00:00Z`));

const horaCorta = (hora: string) => hora.slice(0, 5);

function CursoCard({ matricula }: { matricula: GrupoMatriculado }) {
  const { grupo } = matricula;
  const docente = grupo.docente
    ? `${grupo.docente.nombre} ${grupo.docente.apellidos}`
    : "Docente por asignar";

  return (
    <article className="card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="badge">{grupo.curso.codigo}</span>
            <span className={grupo.estado === "EN_CURSO" ? "badge badge-green" : "badge"}>
              {grupo.estado.replace("_", " ")}
            </span>
          </div>
          <h2 className="section-title">{formatearNombreGrupo(grupo, grupo.curso.nombre)}</h2>
          <p className="mt-1 text-sm text-muted">
            Nivel {grupo.curso.nivel}
          </p>
        </div>
        <div className="rounded-lg bg-navy-soft px-3 py-2 text-sm font-semibold text-navy">
          {grupo.periodo.codigo} · {grupo.periodo.nombre}
        </div>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-2">
        <div className="space-y-3">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <UserRound size={16} className="shrink-0 text-muted" />
            Docente
          </p>
          <p className="flex items-center gap-2 text-sm text-body">
            
            {docente}
          </p>
          <p className="flex items-center gap-2 text-sm text-body">
            <CalendarDays size={16} className="shrink-0 text-muted" />
            {formatoFecha(grupo.fechaInicio)} – {formatoFecha(grupo.fechaFin)}
          </p>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <Clock3 size={15} />
            Horario
          </p>
          {grupo.horarios.length > 0 ? (
            <ul className="space-y-2">
              {grupo.horarios.map((horario) => (
                <li key={horario.id} className="text-sm text-body">
                  <span className="font-medium text-heading">{dias[horario.diaSemana]}</span>
                  {" · "}
                  {horaCorta(horario.horaInicio)} – {horaCorta(horario.horaFin)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">El horario aún no está disponible.</p>
          )}
        </div>
      </div>
    </article>
  );
}

export function MisCursosPage() {
  const {
    gruposMatriculados,
    isLoading,
    error,
    isAccessDenied,
    recargarGrupos,
  } = useGruposAcademicos();

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">Cursos matriculados</h2>
          <p className="mt-1 text-sm text-muted">
            Estos son tus cursos con matrícula activa.
          </p>
        </div>
        {!isLoading && !error && (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-navy">
            <GraduationCap size={18} />
            {gruposMatriculados.length} {gruposMatriculados.length === 1 ? "curso" : "cursos"}
          </span>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">
          <p>{error}</p>
          {!isAccessDenied && (
            <button
              type="button"
              onClick={recargarGrupos}
              className="mt-2 font-semibold underline"
            >
              Intentar nuevamente
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div role="status" className="card p-8 text-center text-sm text-muted">
          Cargando tus cursos...
        </div>
      ) : error ? null : gruposMatriculados.length === 0 ? (
        <div className="card p-8 text-center">
          <GraduationCap size={32} className="mx-auto text-muted" />
          <p className="mt-3 font-semibold text-heading">Aún no tienes cursos matriculados</p>
          <p className="mt-1 text-sm text-muted">
            Cuando tengas una matrícula activa, tus cursos aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {gruposMatriculados.map((matricula) => (
            <CursoCard key={matricula.matriculaId} matricula={matricula} />
          ))}
        </div>
      )}
    </section>
  );
}
