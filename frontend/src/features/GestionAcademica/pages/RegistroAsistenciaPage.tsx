import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, Check, CircleAlert, UserRoundCheck, UserRoundX } from "lucide-react";
import { extraerMensajeError } from "../../../api/apiError";
import { listarEstudiantesPorGrupo } from "../../GestionGrupos/grupo.service";
import type { EstudianteMatriculadoGrupo } from "../../GestionGrupos/grupo.types";
import { formatearNombreGrupoConHorario } from "../../GestionGrupos/grupo.formatters";
import { useGruposAcademicos } from "../hooks/useGruposAcademicos";
import type { GrupoDocente } from "../gestionAcademica.types";
import { ConteoInasistenciasGrupoPage } from "./ConteoInasistenciasGrupoPage";
import { HistorialAsistenciasGrupo } from "./HistorialAsistenciasGrupo";
import {
  obtenerAsistenciaFecha,
  registrarAsistencia,
  type AusenteAsistencia,
} from "../asistencia.service";

function fechaLocalActual() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

export function RegistroAsistenciaPage() {
  const {
    gruposDocente,
    isLoading: cargandoGrupos,
    error: errorGrupos,
    isAccessDenied,
    recargarGrupos,
  } = useGruposAcademicos();
  const gruposDisponibles = gruposDocente;
  const [grupoId, setGrupoId] = useState("");
  const [fecha, setFecha] = useState(fechaLocalActual);
  const [estudiantes, setEstudiantes] = useState<EstudianteMatriculadoGrupo[]>([]);
  const [ausentes, setAusentes] = useState<Record<string, string>>({});
  const [sesionRegistrada, setSesionRegistrada] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [revisionInasistencias, setRevisionInasistencias] = useState(0);

  const grupoSeleccionado = gruposDisponibles.find((grupo) => grupo.id === grupoId);
  const fechaValida = Boolean(
    grupoSeleccionado &&
      fecha >= grupoSeleccionado.fechaInicio &&
      fecha <= grupoSeleccionado.fechaFin,
  );
  const totalAusentes = Object.keys(ausentes).length;
  const totalPresentes = estudiantes.length - totalAusentes;

  useEffect(() => {
    let vigente = true;

    const cargarDatos = async () => {
      setError("");
      setMensaje("");
      setAusentes({});
      setSesionRegistrada(false);

      if (!grupoId || !fechaValida) {
        setEstudiantes([]);
        setCargando(false);
        return;
      }

      setCargando(true);
      try {
        const [respuestaEstudiantes, respuestaAsistencia] = await Promise.all([
          listarEstudiantesPorGrupo(grupoId),
          obtenerAsistenciaFecha(grupoId, fecha),
        ]);
        if (!vigente) return;

        setEstudiantes(respuestaEstudiantes.data);
        setSesionRegistrada(respuestaAsistencia.claseRegistrada);
        setAusentes(
          Object.fromEntries(
            respuestaAsistencia.ausentes.map((ausente) => [
              ausente.estudianteId,
              ausente.motivoInasistencia ?? "",
            ]),
          ),
        );
      } catch (requestError: unknown) {
        if (!vigente) return;
        setEstudiantes([]);
        setError(extraerMensajeError(requestError));
      } finally {
        if (vigente) setCargando(false);
      }
    };

    void cargarDatos();
    return () => {
      vigente = false;
    };
  }, [grupoId, fecha, fechaValida]);

  const ausentesPayload = useMemo<AusenteAsistencia[]>(
    () =>
      Object.entries(ausentes).map(([estudianteId, motivoInasistencia]) => ({
        estudianteId,
        motivoInasistencia: motivoInasistencia.trim() || null,
      })),
    [ausentes],
  );

  const actualizarAusencia = (estudianteId: string, marcarAusente: boolean) => {
    setAusentes((actuales) => {
      const actualizados = { ...actuales };
      if (marcarAusente) {
        actualizados[estudianteId] = "";
      } else {
        delete actualizados[estudianteId];
      }
      return actualizados;
    });
    setMensaje("");
  };

  const guardar = async () => {
    if (!grupoId || !fechaValida) return;
    setGuardando(true);
    setError("");
    setMensaje("");
    try {
      const response = await registrarAsistencia(
        grupoId,
        fecha,
        sesionRegistrada ? ausentesPayload : [],
        sesionRegistrada,
      );
      if (!sesionRegistrada) {
        setSesionRegistrada(true);
        setMensaje("Sesión registrada. Todos los estudiantes aparecen como presentes; ya puedes marcar las ausencias.");
      } else {
        setMensaje(response.mensaje ?? "La asistencia se guardó correctamente.");
      }
      setRevisionInasistencias((actual) => actual + 1);
    } catch (requestError: unknown) {
      setError(extraerMensajeError(requestError));
    } finally {
      setGuardando(false);
    }
  };

  const nombreGrupo = (grupo: GrupoDocente) => {
    const nombre = formatearNombreGrupoConHorario(grupo, grupo.curso.nombre);
    return `${nombre} · ${grupo.estado.replace("_", " ")}`;
  };

  return (
    <section className="space-y-5">
      <header>
        <p className="eyebrow mb-2">Gestión académica</p>
        <h2 className="section-title">Registro de asistencia</h2>
        <p className="mt-1 text-sm text-muted">
          Elige el grupo y la fecha. Primero registra la sesión; luego marca únicamente a quienes faltaron.
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
      {error && <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">{error}</p>}
      {mensaje && <p role="status" className="rounded-lg bg-green-soft p-4 text-sm text-green">{mensaje}</p>}

      <section className="card grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-5">
        <div>
          <label htmlFor="asistencia-grupo" className="field-label">Grupo</label>
          <select
            id="asistencia-grupo"
            value={grupoId}
            onChange={(event) => setGrupoId(event.target.value)}
            disabled={cargandoGrupos}
            className="form-input"
          >
            <option value="">{cargandoGrupos ? "Cargando grupos..." : "Selecciona un grupo"}</option>
            {gruposDisponibles.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>{nombreGrupo(grupo)}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="asistencia-fecha" className="field-label">Fecha de la sesión</label>
          <input
            id="asistencia-fecha"
            type="date"
            value={fecha}
            min={grupoSeleccionado?.fechaInicio}
            max={grupoSeleccionado?.fechaFin}
            onChange={(event) => setFecha(event.target.value)}
            disabled={!grupoId}
            className="form-input"
          />
        </div>
        {grupoSeleccionado && !fechaValida && (
          <p className="sm:col-span-2 text-sm text-error">
            La fecha debe estar dentro del periodo del grupo ({grupoSeleccionado.fechaInicio} — {grupoSeleccionado.fechaFin}).
          </p>
        )}
      </section>

      {grupoId && fechaValida && (
        <section className="card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h3 className="section-title">Estudiantes</h3>
              <p className="mt-1 text-xs text-muted">
                {sesionRegistrada
                  ? `Sesión registrada para ${fecha}.`
                  : "La sesión aún no está registrada. Todos comenzarán como presentes."}
              </p>
            </div>
            {estudiantes.length > 0 && (
              <div className="flex gap-3 text-xs font-semibold">
                <span className="inline-flex items-center gap-1 text-green"><UserRoundCheck size={16} /> {totalPresentes} presentes</span>
                <span className="inline-flex items-center gap-1 text-red"><UserRoundX size={16} /> {totalAusentes} ausentes</span>
              </div>
            )}
          </div>

          {cargando ? (
            <p role="status" className="p-8 text-center text-sm text-muted">Cargando estudiantes y asistencia...</p>
          ) : estudiantes.length === 0 ? (
            <div className="space-y-4 p-8 text-center">
              <p className="text-sm text-muted">
                {error ? "No se pudo cargar la lista de estudiantes." : "No hay estudiantes matriculados en este grupo."}
              </p>
              {!error && !sesionRegistrada && (
                <button
                  type="button"
                  onClick={() => void guardar()}
                  disabled={guardando}
                  className="primary-btn inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <CalendarCheck2 size={17} />
                  {guardando ? "Guardando..." : "Registrar sesión"}
                </button>
              )}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border">
                {estudiantes.map(({ matriculaId, estudiante }) => {
                  const estaAusente = Object.hasOwn(ausentes, estudiante.id);
                  const checkboxId = `ausente-${estudiante.id}`;
                  return (
                    <li key={matriculaId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-heading">{estudiante.nombre} {estudiante.apellidos}</p>
                        <p className="mt-0.5 text-xs text-muted">{estudiante.codigo}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                        <label
                          htmlFor={checkboxId}
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            estaAusente ? "bg-error-soft text-error" : "bg-green-soft text-green"
                          } ${!sesionRegistrada ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <input
                            id={checkboxId}
                            type="checkbox"
                            checked={estaAusente}
                            disabled={!sesionRegistrada}
                            onChange={(event) => actualizarAusencia(estudiante.id, event.target.checked)}
                            className="size-4 accent-red"
                            aria-label={`Marcar ausencia de ${estudiante.nombre} ${estudiante.apellidos}`}
                          />
                          {estaAusente ? <><CircleAlert size={15} /> Ausente</> : <><Check size={15} /> Presente</>}
                        </label>
                        {estaAusente && (
                          <input
                            type="text"
                            value={ausentes[estudiante.id]}
                            onChange={(event) => setAusentes((actuales) => ({
                              ...actuales,
                              [estudiante.id]: event.target.value,
                            }))}
                            disabled={!sesionRegistrada}
                            maxLength={500}
                            placeholder="Motivo (opcional)"
                            aria-label={`Motivo de inasistencia de ${estudiante.nombre} ${estudiante.apellidos}`}
                            className="form-input w-full sm:max-w-64"
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <p className="text-xs text-muted">
                  {sesionRegistrada
                    ? "Los cambios de asistencia se guardan al confirmar."
                    : "Registra la sesión para habilitar las marcas de ausencia."}
                </p>
                <button
                  type="button"
                  onClick={() => void guardar()}
                  disabled={guardando || cargando || estudiantes.length === 0}
                  className="primary-btn inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CalendarCheck2 size={17} />
                  {guardando
                    ? "Guardando..."
                    : sesionRegistrada
                      ? "Guardar asistencia"
                      : "Registrar sesión"}
                </button>
              </div>
            </>
          )}
        </section>
      )}
      {grupoSeleccionado && (
        <div className="space-y-5">
          <HistorialAsistenciasGrupo
            key={`historial-${grupoId}-${revisionInasistencias}`}
            grupoId={grupoSeleccionado.id}
            embebido
          />
          <ConteoInasistenciasGrupoPage
            key={`conteo-${grupoId}-${revisionInasistencias}`}
            grupoId={grupoSeleccionado.id}
            embebido
          />
        </div>
      )}
    </section>
  );
}
