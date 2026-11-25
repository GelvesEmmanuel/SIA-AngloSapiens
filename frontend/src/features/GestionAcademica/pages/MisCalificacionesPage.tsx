import { useEffect, useState } from "react";
import { BookOpenCheck, GraduationCap } from "lucide-react";
import { extraerMensajeError } from "../../../api/apiError";
import { useGruposAcademicos } from "../hooks/useGruposAcademicos";
import { useNotas } from "../hooks/useNotas";
import { consultarMisNotas } from "../notas.service";
import type { ResumenNotasEstudiante } from "../notas.types";
import { nombresHabilidades } from "../notas.utils";

export function MisCalificacionesPage() {
  const {
    gruposMatriculados,
    isLoading: cargandoGrupos,
  } = useGruposAcademicos();
  const [matriculas, setMatriculas] = useState<ResumenNotasEstudiante[]>([]);
  const [matriculaId, setMatriculaId] = useState("");
  const [cargandoListado, setCargandoListado] = useState(true);
  const [errorListado, setErrorListado] = useState("");
  const [revision, setRevision] = useState(0);
  const {
    notasMatricula,
    cargando: cargandoDetalle,
    error: errorDetalle,
    recargar,
  } = useNotas(matriculaId);

  useEffect(() => {
    let vigente = true;
    setCargandoListado(true);
    setErrorListado("");

    void consultarMisNotas()
      .then((respuesta) => {
        if (!vigente) return;
        setMatriculas(respuesta);
        setMatriculaId((actual) =>
          respuesta.some((matricula) => matricula.matriculaId === actual)
            ? actual
            : respuesta[0]?.matriculaId ?? "",
        );
      })
      .catch((requestError: unknown) => {
        if (!vigente) return;
        setMatriculas([]);
        setMatriculaId("");
        setErrorListado(extraerMensajeError(requestError));
      })
      .finally(() => {
        if (vigente) setCargandoListado(false);
      });

    return () => {
      vigente = false;
    };
  }, [revision]);

  const resumenSeleccionado = matriculas.find(
    (matricula) => matricula.matriculaId === matriculaId,
  );
  const grupoSeleccionado = gruposMatriculados.find(
    (matricula) => matricula.matriculaId === matriculaId,
  )?.grupo;
  const detalleVisible =
    notasMatricula?.matriculaId === matriculaId &&
    notasMatricula.notasPublicadas === true &&
    notasMatricula.notaExamenFinal != null &&
    notasMatricula.notaFinal != null;

  return (
    <section className="space-y-5">
      <header>
        <p className="eyebrow mb-2">Gestión académica</p>
        <h2 className="section-title">Mis calificaciones</h2>
        <p className="mt-1 text-sm text-muted">
          Aquí aparecen únicamente las notas de matrículas activas que el docente haya publicado.
        </p>
      </header>

      {errorListado && (
        <div role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">
          <p>{errorListado}</p>
          <button
            type="button"
            onClick={() => setRevision((actual) => actual + 1)}
            className="mt-2 font-semibold underline"
          >
            Intentar nuevamente
          </button>
        </div>
      )}
      {errorDetalle && (
        <div role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">
          <p>{errorDetalle}</p>
          <button type="button" onClick={() => void recargar()} className="mt-2 font-semibold underline">
            Intentar nuevamente
          </button>
        </div>
      )}

      {cargandoListado || cargandoGrupos ? (
        <div role="status" className="card p-8 text-center text-sm text-muted">
          Cargando tus calificaciones...
        </div>
      ) : errorListado ? null : matriculas.length === 0 ? (
        <div className="card p-8 text-center">
          <GraduationCap size={32} className="mx-auto text-muted" />
          <p className="mt-3 font-semibold text-heading">Aún no tienes notas publicadas</p>
          <p className="mt-1 text-sm text-muted">
            Cuando tu docente publique las calificaciones de una matrícula activa, aparecerán aquí.
          </p>
        </div>
      ) : (
        <>
          <section className="card p-4 sm:p-5">
            <label htmlFor="calificaciones-matricula" className="field-label">Curso</label>
            <select
              id="calificaciones-matricula"
              value={matriculaId}
              onChange={(event) => setMatriculaId(event.target.value)}
              className="form-input"
            >
              {matriculas.map((matricula) => {
                const grupo = gruposMatriculados.find(
                  (item) => item.matriculaId === matricula.matriculaId,
                )?.grupo;
                return (
                  <option key={matricula.matriculaId} value={matricula.matriculaId}>
                    {grupo?.curso.nombre ?? `Curso ${matricula.cursoId}`}
                    {grupo ? ` · ${grupo.periodo.codigo}` : ""}
                  </option>
                );
              })}
            </select>
          </section>

          {cargandoDetalle || notasMatricula?.matriculaId !== matriculaId ? (
            <div role="status" className="card p-8 text-center text-sm text-muted">
              Cargando el detalle de las notas...
            </div>
          ) : !detalleVisible ? (
            <div role="status" className="card p-6 text-sm text-muted">
              Estas notas ya no están disponibles. Es posible que el docente haya retirado la publicación.
              <button type="button" onClick={() => setRevision((actual) => actual + 1)} className="ml-1 font-semibold underline">
                Actualizar listado
              </button>
            </div>
          ) : (
            <section className="card overflow-hidden">
              <header className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <h3 className="section-title">{grupoSeleccionado?.curso.nombre ?? "Calificaciones del curso"}</h3>
                  <p className="mt-1 text-xs text-muted">
                    {grupoSeleccionado
                      ? `${grupoSeleccionado.periodo.codigo} · ${grupoSeleccionado.periodo.nombre}`
                      : `Matrícula ${resumenSeleccionado?.codigoMatricula ?? ""}`}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Las habilidades representan el 70 % y el examen final el 30 % de la nota.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-green-soft px-3 py-1.5 text-xs font-semibold text-green">
                  <BookOpenCheck size={15} />
                  Publicadas
                </span>
              </header>

              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {notasMatricula.notas.map((nota) => (
                  <div key={nota.id} className="rounded-lg border border-border p-4">
                    <p className="text-sm font-semibold text-heading">
                      {nombresHabilidades[nota.habilidad]}
                    </p>
                    <p className="mt-2 text-xl font-bold text-navy">{Number(nota.nota).toFixed(1)} / 5</p>
                  </div>
                ))}
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm font-semibold text-heading">Examen final</p>
                  <p className="mt-2 text-xl font-bold text-navy">
                    {Number(notasMatricula.notaExamenFinal).toFixed(1)} / 5
                  </p>
                  <p className="mt-1 text-xs text-muted">30 % de la nota final</p>
                </div>
                <div className="rounded-lg border border-green bg-green-soft p-4">
                  <p className="text-sm font-semibold text-heading">Nota final</p>
                  <p className="mt-2 text-2xl font-bold text-green">
                    {Number(notasMatricula.notaFinal).toFixed(1)} / 5
                  </p>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
