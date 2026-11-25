import { useEffect, useMemo, useState } from "react";
import { Calculator, Save } from "lucide-react";
import { extraerMensajeError } from "../../../api/apiError";
import { listarEstudiantesPorGrupo } from "../../GestionGrupos/grupo.service";
import type { EstudianteMatriculadoGrupo } from "../../GestionGrupos/grupo.types";
import { formatearNombreGrupoConHorario } from "../../GestionGrupos/grupo.formatters";
import { useGruposAcademicos } from "../hooks/useGruposAcademicos";
import { useNotas } from "../hooks/useNotas";
import type { GrupoDocente } from "../gestionAcademica.types";
import type { NotaHabilidadPayload } from "../notas.types";
import { nombresHabilidades } from "../notas.utils";

const notaValida = (valor: string) => {
  if (!valor.trim()) return false;
  const nota = Number(valor);
  return Number.isFinite(nota) && nota >= 0 && nota <= 5;
};

export function RegistroNotasPage() {
  const {
    gruposDocente,
    isLoading: cargandoGrupos,
    error: errorGrupos,
    isAccessDenied,
    recargarGrupos,
  } = useGruposAcademicos();
  const [grupoId, setGrupoId] = useState("");
  const [estudiantes, setEstudiantes] = useState<EstudianteMatriculadoGrupo[]>([]);
  const [matriculaId, setMatriculaId] = useState("");
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
  const [errorEstudiantes, setErrorEstudiantes] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [notasHabilidades, setNotasHabilidades] = useState<Record<string, string>>({});
  const [notaExamenFinal, setNotaExamenFinal] = useState("");
  const {
    notasMatricula,
    cargando: cargandoNotas,
    guardando,
    error: errorNotas,
    guardarHabilidades,
    guardarExamenFinal,
    cambiarPublicacion,
    recargar,
  } = useNotas(matriculaId);

  const estudianteSeleccionado = estudiantes.find(
    (item) => item.matriculaId === matriculaId,
  );

  useEffect(() => {
    let vigente = true;
    setEstudiantes([]);
    setMatriculaId("");
    setErrorEstudiantes("");
    setMensaje("");

    if (!grupoId) {
      setCargandoEstudiantes(false);
      return () => {
        vigente = false;
      };
    }

    setCargandoEstudiantes(true);
    void listarEstudiantesPorGrupo(grupoId)
      .then((respuesta) => {
        if (vigente) setEstudiantes(respuesta.data);
      })
      .catch((requestError: unknown) => {
        if (vigente) setErrorEstudiantes(extraerMensajeError(requestError));
      })
      .finally(() => {
        if (vigente) setCargandoEstudiantes(false);
      });

    return () => {
      vigente = false;
    };
  }, [grupoId]);

  useEffect(() => {
    if (!notasMatricula || notasMatricula.matriculaId !== matriculaId) return;
    setNotasHabilidades(
      Object.fromEntries(
        notasMatricula.notas.map(({ habilidad, nota }) => [habilidad, String(nota)]),
      ),
    );
    setNotaExamenFinal(
      notasMatricula.notaExamenFinal == null
        ? ""
        : String(notasMatricula.notaExamenFinal),
    );
  }, [matriculaId, notasMatricula]);

  const habilidades = notasMatricula?.habilidadesConfiguradas ?? [];
  const datosHabilidades = useMemo<NotaHabilidadPayload[]>(
    () =>
      habilidades.flatMap((habilidad) => {
        const valor = notasHabilidades[habilidad] ?? "";
        return notaValida(valor)
          ? [{ habilidad, nota: Number(valor) }]
          : [];
      }),
    [habilidades, notasHabilidades],
  );
  const todasLasHabilidadesValidas =
    habilidades.length > 0 &&
    habilidades.every((habilidad) => notaValida(notasHabilidades[habilidad] ?? ""));
  const entradasHabilidadesValidas = habilidades.every((habilidad) => {
    const valor = notasHabilidades[habilidad] ?? "";
    return !valor.trim() || notaValida(valor);
  });
  const examenValido = notaValida(notaExamenFinal);
  const habilidadesGuardadas = habilidades.every((habilidad) =>
    notasMatricula?.notas.some((nota) => nota.habilidad === habilidad),
  );
  const puedePublicar =
    habilidades.length > 0 &&
    habilidadesGuardadas &&
    notasMatricula?.notaExamenFinal != null &&
    notasMatricula.notaFinal != null;

  const nombreGrupo = (grupo: GrupoDocente) =>
    `${formatearNombreGrupoConHorario(grupo, grupo.curso.nombre)} · ${grupo.estado.replace("_", " ")}`;

  const guardarNotas = async () => {
    setMensaje("");
    const guardado = await guardarHabilidades(datosHabilidades);
    if (guardado) setMensaje("Las notas de las habilidades se guardaron correctamente.");
  };

  const guardarExamen = async () => {
    setMensaje("");
    const guardado = await guardarExamenFinal(Number(notaExamenFinal));
    if (guardado) setMensaje("La nota del examen final se guardó correctamente.");
  };

  const calcularNotaFinal = async () => {
    setMensaje("");
    const habilidadesGuardadas = await guardarHabilidades(datosHabilidades);
    if (!habilidadesGuardadas) return;
    const examenGuardado = await guardarExamenFinal(Number(notaExamenFinal));
    if (examenGuardado) {
      setMensaje("La nota final se calculó correctamente con las habilidades (70 %) y el examen final (30 %).");
    }
  };

  const alternarPublicacion = async () => {
    if (!notasMatricula) return;
    setMensaje("");
    const publicadas = notasMatricula.notasPublicadas === true;
    const actualizada = await cambiarPublicacion(!publicadas);
    if (actualizada) {
      setMensaje(
        publicadas
          ? "Se retiró la publicación de las notas."
          : "Las notas se publicaron correctamente para el estudiante.",
      );
    }
  };

  return (
    <section className="space-y-5">
      <header>
        <p className="eyebrow mb-2">Gestión académica</p>
        <h2 className="section-title">Registro de notas</h2>
        <p className="mt-1 text-sm text-muted">
          Selecciona un grupo y un estudiante para registrar sus habilidades y examen final.
          La nota final pondera las habilidades al 70 % y el examen al 30 %.
        </p>
      </header>

      {errorGrupos && (
        <div role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">
          <p>{errorGrupos}</p>
          {!isAccessDenied && (
            <button type="button" onClick={recargarGrupos} className="mt-2 font-semibold underline">
              Intentar nuevamente
            </button>
          )}
        </div>
      )}
      {errorEstudiantes && <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">{errorEstudiantes}</p>}
      {errorNotas && <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">{errorNotas}</p>}
      {mensaje && <p role="status" className="rounded-lg bg-green-soft p-4 text-sm text-green">{mensaje}</p>}

      <section className="card grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
        <div>
          <label htmlFor="notas-grupo" className="field-label">Grupo</label>
          <select
            id="notas-grupo"
            value={grupoId}
            onChange={(event) => setGrupoId(event.target.value)}
            disabled={cargandoGrupos || guardando}
            className="form-input"
          >
            <option value="">{cargandoGrupos ? "Cargando grupos..." : "Selecciona un grupo"}</option>
            {gruposDocente.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>{nombreGrupo(grupo)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="notas-estudiante" className="field-label">Estudiante</label>
          <select
            id="notas-estudiante"
            value={matriculaId}
            onChange={(event) => {
              setMatriculaId(event.target.value);
              setMensaje("");
            }}
            disabled={!grupoId || cargandoEstudiantes || estudiantes.length === 0 || guardando}
            className="form-input"
          >
            <option value="">
              {cargandoEstudiantes
                ? "Cargando estudiantes..."
                : grupoId
                  ? "Selecciona un estudiante"
                  : "Primero selecciona un grupo"}
            </option>
            {estudiantes.map(({ matriculaId: id, estudiante }) => (
              <option key={id} value={id}>
                {estudiante.nombre} {estudiante.apellidos} · {estudiante.codigo}
              </option>
            ))}
          </select>
        </div>
      </section>

      {grupoId && !cargandoEstudiantes && estudiantes.length === 0 && !errorEstudiantes && (
        <p className="card p-5 text-sm text-muted">No hay estudiantes matriculados en este grupo.</p>
      )}

      {matriculaId && (
        <section className="card overflow-hidden">
          <header className="border-b border-border p-4 sm:p-5">
            <h3 className="section-title">
              {estudianteSeleccionado
                ? `${estudianteSeleccionado.estudiante.nombre} ${estudianteSeleccionado.estudiante.apellidos}`
                : "Notas del estudiante"}
            </h3>
            <p className="mt-1 text-xs text-muted">
              {notasMatricula?.habilidadesConfiguradas?.length ?? 0} habilidades configuradas ·
              {" "}calificación de 0 a 5
            </p>
          </header>

          {cargandoNotas ? (
            <p role="status" className="p-8 text-center text-sm text-muted">Cargando notas del estudiante...</p>
          ) : notasMatricula ? (
            <>
              {habilidades.length === 0 ? (
                <p className="p-6 text-sm text-muted">Este curso no tiene habilidades configuradas.</p>
              ) : (
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {habilidades.map((habilidad) => (
                    <label key={habilidad} className="rounded-lg border border-border p-4">
                      <span className="mb-2 block text-sm font-semibold text-heading">
                        {nombresHabilidades[habilidad]}
                      </span>
                      <span className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          inputMode="decimal"
                          value={notasHabilidades[habilidad] ?? ""}
                          onChange={(event) => {
                            setNotasHabilidades((actuales) => ({
                              ...actuales,
                              [habilidad]: event.target.value,
                            }));
                            setMensaje("");
                          }}
                          aria-label={`Nota de ${nombresHabilidades[habilidad]}`}
                          className="form-input"
                        />
                        <span className="text-xs text-muted">/ 5</span>
                      </span>
                    </label>
                  ))}
                  <label className="rounded-lg border border-border bg-surface p-4">
                    <span className="mb-2 block text-sm font-semibold text-heading">Examen final</span>
                    <span className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        inputMode="decimal"
                        value={notaExamenFinal}
                        onChange={(event) => {
                          setNotaExamenFinal(event.target.value);
                          setMensaje("");
                        }}
                        aria-label="Nota del examen final"
                        className="form-input"
                      />
                      <span className="text-xs text-muted">/ 5 · 30 %</span>
                    </span>
                  </label>
                </div>
              )}

              <footer className="flex flex-col gap-4 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <p className="text-xs text-muted">Nota final</p>
                  <p className="text-xl font-bold text-heading">
                    {notasMatricula.notaFinal == null
                      ? "Pendiente"
                      : `${Number(notasMatricula.notaFinal).toFixed(1)} / 5`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void guardarNotas()}
                    disabled={
                      guardando ||
                      cargandoNotas ||
                      datosHabilidades.length === 0 ||
                      !entradasHabilidadesValidas
                    }
                    className="secondary-btn inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={16} />
                    Guardar habilidades
                  </button>
                  <button
                    type="button"
                    onClick={() => void guardarExamen()}
                    disabled={guardando || cargandoNotas || !examenValido}
                    className="secondary-btn inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={16} />
                    Guardar examen
                  </button>
                  <button
                    type="button"
                    onClick={() => void calcularNotaFinal()}
                    disabled={
                      guardando ||
                      cargandoNotas ||
                      !todasLasHabilidadesValidas ||
                      !examenValido
                    }
                    className="primary-btn inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Calculator size={16} />
                    {guardando ? "Guardando..." : "Calcular nota final"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void alternarPublicacion()}
                    disabled={
                      guardando ||
                      cargandoNotas ||
                      (notasMatricula.notasPublicadas !== true && !puedePublicar)
                    }
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
                      notasMatricula.notasPublicadas
                        ? "border border-error text-error hover:bg-error-soft"
                        : "border border-green text-green hover:bg-green-soft"
                    }`}
                  >
                    {notasMatricula.notasPublicadas ? "Retirar publicación" : "Publicar notas"}
                  </button>
                </div>
              </footer>
              <div className="flex flex-wrap items-center gap-2 px-4 pb-4 sm:px-5">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    notasMatricula.notasPublicadas
                      ? "bg-green-soft text-green"
                      : "bg-surface-muted text-muted"
                  }`}
                >
                  {notasMatricula.notasPublicadas ? "Notas publicadas" : "Notas no publicadas"}
                </span>
                {!puedePublicar && notasMatricula.notasPublicadas !== true && (
                  <span className="text-xs text-muted">
                    Completa y guarda todas las habilidades y el examen final antes de publicar.
                  </span>
                )}
              </div>
              {(!todasLasHabilidadesValidas || !examenValido) && (
                <p className="px-4 pb-4 text-xs text-muted sm:px-5">
                  Completa una nota válida (0 a 5) para cada habilidad y el examen final para calcular la nota final.
                </p>
              )}
            </>
          ) : (
            <div className="space-y-3 p-8 text-center">
              <p className="text-sm text-muted">No se pudieron cargar las notas. Revisa el error e intenta nuevamente.</p>
              <button type="button" onClick={() => void recargar()} className="font-semibold underline">
                Intentar nuevamente
              </button>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
