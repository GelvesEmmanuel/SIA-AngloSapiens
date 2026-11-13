import { useEffect, useState, type FormEvent } from "react";
import { extraerMensajeError } from "../../../api/apiError";
import { listarAulas } from "../../GestionAulas/aula.service";
import type { Aula } from "../../GestionAulas/aula.types";
import { listarCursos } from "../../GestionCursos/curso.service";
import type { Curso } from "../../GestionCursos/curso.types";
import { listarDocentes } from "../../GestionDocentes/gestionDocente.service";
import type { Docente } from "../../GestionDocentes/docente.types";
import { listarPeriodos } from "../../GestionPeriodos/periodo.service";
import type { PeriodoAcademico } from "../../GestionPeriodos/periodo.types";
import type { DiaSemana, GrupoPayload, HorarioGrupo } from "../grupo.types";

const dias: Array<{ value: DiaSemana; label: string }> = [
  { value: "LUNES", label: "Lunes" },
  { value: "MARTES", label: "Martes" },
  { value: "MIERCOLES", label: "Miércoles" },
  { value: "JUEVES", label: "Jueves" },
  { value: "VIERNES", label: "Viernes" },
  { value: "SABADO", label: "Sábado" },
];

interface GrupoFormProps {
  initialValues?: GrupoPayload;
  includeDocente?: boolean;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (payload: GrupoPayload) => Promise<void>;
}

export function GrupoForm({
  initialValues,
  includeDocente = true,
  submitLabel,
  isSubmitting,
  onSubmit,
}: GrupoFormProps) {
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [periodoId, setPeriodoId] = useState(initialValues?.periodoId ?? "");
  const [cursoId, setCursoId] = useState(initialValues?.cursoId ?? "");
  const [docenteId, setDocenteId] = useState(initialValues?.docenteId ?? "");
  const [aulaId, setAulaId] = useState(initialValues?.aulaId ?? "");
  const [cupoMaximo, setCupoMaximo] = useState(String(initialValues?.cupoMaximo ?? ""));
  const [fechaInicio, setFechaInicio] = useState(initialValues?.fechaInicio ?? "");
  const [fechaFin, setFechaFin] = useState(initialValues?.fechaFin ?? "");
  const [horarios, setHorarios] = useState<HorarioGrupo[]>(initialValues?.horarios ?? []);
  const [errorCatalogos, setErrorCatalogos] = useState("");
  const [errorValidacion, setErrorValidacion] = useState("");

  useEffect(() => {
    let isMounted = true;
    const cargarCatalogos = async () => {
      try {
        const [periodosResponse, cursosResponse, docentesResponse, aulasResponse] =
          await Promise.all([
            listarPeriodos(),
            listarCursos({ estado: "ACTIVO" }),
            listarDocentes({ estado: "ACTIVO" }),
            listarAulas({ activa: true }),
          ]);
        if (isMounted) {
          setPeriodos(periodosResponse.data.filter((periodo) =>
            periodo.estado === "ACTIVO" || periodo.estado === "PROGRAMADO"));
          setCursos(cursosResponse.data);
          setDocentes(docentesResponse.data);
          setAulas(aulasResponse.data);
        }
      } catch (requestError: unknown) {
        if (isMounted) setErrorCatalogos(extraerMensajeError(requestError));
      }
    };
    void cargarCatalogos();
    return () => {
      isMounted = false;
    };
  }, []);

  const periodoSeleccionado = periodos.find((periodo) => periodo.id === periodoId);

  useEffect(() => {
    if (!periodoSeleccionado) return;
    if (!fechaInicio || fechaInicio < periodoSeleccionado.fechaInicio || fechaInicio > periodoSeleccionado.fechaFin) {
      setFechaInicio(periodoSeleccionado.fechaInicio);
    }
    if (!fechaFin || fechaFin > periodoSeleccionado.fechaFin || fechaFin < periodoSeleccionado.fechaInicio) {
      setFechaFin(periodoSeleccionado.fechaFin);
    }
  }, [fechaInicio, fechaFin, periodoSeleccionado]);

  const alternarDia = (diaSemana: DiaSemana) => {
    setHorarios((actuales) =>
      actuales.some((horario) => horario.diaSemana === diaSemana)
        ? actuales.filter((horario) => horario.diaSemana !== diaSemana)
        : [...actuales, { diaSemana, horaInicio: "16:00", horaFin: "17:30" }],
    );
  };

  const actualizarHorario = (diaSemana: DiaSemana, campo: "horaInicio" | "horaFin", valor: string) => {
    setHorarios((actuales) =>
      actuales.map((horario) =>
        horario.diaSemana === diaSemana ? { ...horario, [campo]: valor } : horario,
      ),
    );
  };

  const enviarFormulario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cupo = Number(cupoMaximo);
    if (!Number.isInteger(cupo) || cupo <= 0) {
      setErrorValidacion("El cupo máximo debe ser un número entero mayor a cero.");
      return;
    }
    if (horarios.length === 0) {
      setErrorValidacion("Selecciona al menos un día para el horario.");
      return;
    }
    if (horarios.some((horario) => horario.horaFin <= horario.horaInicio)) {
      setErrorValidacion("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }
    if (fechaFin < fechaInicio) {
      setErrorValidacion("La fecha de fin debe ser igual o posterior a la fecha de inicio.");
      return;
    }
    setErrorValidacion("");
    await onSubmit({
      periodoId,
      cursoId,
      ...(includeDocente ? { docenteId: docenteId || null } : {}),
      aulaId: aulaId || null,
      cupoMaximo: cupo,
      fechaInicio,
      fechaFin,
      horarios: horarios.map(({ diaSemana, horaInicio, horaFin }) => ({
        diaSemana,
        horaInicio,
        horaFin,
      })),
    });
  };

  return (
    <form onSubmit={enviarFormulario} className="space-y-5">
      {errorCatalogos && <p role="alert" className="rounded-lg bg-error-soft p-3 text-sm text-error">{errorCatalogos}</p>}
      {errorValidacion && <p role="alert" className="rounded-lg bg-error-soft p-3 text-sm text-error">{errorValidacion}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="grupo-periodo" className="field-label">Periodo académico</label>
          <select id="grupo-periodo" value={periodoId} onChange={(event) => setPeriodoId(event.target.value)} required className="form-input">
            <option value="">Selecciona un periodo</option>
            {periodos.map((periodo) => <option key={periodo.id} value={periodo.id}>{periodo.codigo} · {periodo.nombre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="grupo-curso" className="field-label">Curso</label>
          <select id="grupo-curso" value={cursoId} onChange={(event) => setCursoId(event.target.value)} required className="form-input">
            <option value="">Selecciona un curso</option>
            {cursos.map((curso) => <option key={curso.id} value={curso.id}>{curso.codigo} · {curso.nombre}</option>)}
          </select>
        </div>
        {includeDocente && (
          <div>
            <label htmlFor="grupo-docente" className="field-label">Docente (opcional)</label>
            <select id="grupo-docente" value={docenteId} onChange={(event) => setDocenteId(event.target.value)} className="form-input">
              <option value="">Sin asignar</option>
              {docentes.map((docente) => <option key={docente.id} value={docente.id}>{docente.nombre} {docente.apellidos}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="grupo-aula" className="field-label">Aula (opcional)</label>
          <select id="grupo-aula" value={aulaId} onChange={(event) => setAulaId(event.target.value)} className="form-input">
            <option value="">Sin asignar</option>
            {aulas.map((aula) => <option key={aula.id} value={aula.id}>{aula.nombre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="grupo-cupo" className="field-label">Cupo máximo</label>
          <input id="grupo-cupo" type="number" min="1" step="1" value={cupoMaximo} onChange={(event) => setCupoMaximo(event.target.value)} required className="form-input" />
        </div>
        <div>
          <label htmlFor="grupo-inicio" className="field-label">Fecha de inicio</label>
          <input id="grupo-inicio" type="date" min={periodoSeleccionado?.fechaInicio} max={periodoSeleccionado?.fechaFin} value={fechaInicio} onChange={(event) => setFechaInicio(event.target.value)} required className="form-input" />
        </div>
        <div>
          <label htmlFor="grupo-fin" className="field-label">Fecha de fin</label>
          <input id="grupo-fin" type="date" min={fechaInicio || periodoSeleccionado?.fechaInicio} max={periodoSeleccionado?.fechaFin} value={fechaFin} onChange={(event) => setFechaFin(event.target.value)} required className="form-input" />
        </div>
      </div>

      <fieldset>
        <legend className="field-label">Días y horarios</legend>
        <div className="mt-2 space-y-3">
          {dias.map(({ value, label }) => {
            const horario = horarios.find((item) => item.diaSemana === value);
            return (
              <div key={value} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[minmax(130px,1fr)_1fr_1fr] sm:items-end">
                <label className="flex items-center gap-2 text-sm font-medium text-body">
                  <input type="checkbox" checked={Boolean(horario)} onChange={() => alternarDia(value)} />
                  {label}
                </label>
                {horario ? (
                  <>
                    <div><label htmlFor={`inicio-${value}`} className="field-label">Hora de inicio</label><input id={`inicio-${value}`} type="time" value={horario.horaInicio.slice(0, 5)} onChange={(event) => actualizarHorario(value, "horaInicio", event.target.value)} required className="form-input" /></div>
                    <div><label htmlFor={`fin-${value}`} className="field-label">Hora de fin</label><input id={`fin-${value}`} type="time" value={horario.horaFin.slice(0, 5)} onChange={(event) => actualizarHorario(value, "horaFin", event.target.value)} required className="form-input" /></div>
                  </>
                ) : <p className="text-sm text-muted sm:col-span-2">Sin horario</p>}
              </div>
            );
          })}
        </div>
      </fieldset>
      <button type="submit" disabled={isSubmitting || Boolean(errorCatalogos)} className="primary-btn disabled:opacity-50">
        {isSubmitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
