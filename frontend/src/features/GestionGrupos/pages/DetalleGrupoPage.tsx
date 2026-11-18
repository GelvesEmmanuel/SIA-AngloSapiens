import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { useGrupos } from "../hooks/useGrupos";
import type { EstadoGrupo, GrupoPayload } from "../grupo.types";
import { GrupoForm } from "./GrupoForm";

const estadosEditables: Exclude<EstadoGrupo, "CANCELADO">[] = [
  "PROGRAMADO",
  "EN_CURSO",
  "FINALIZADO",
];

interface DetalleGrupoPageProps {
  returnPath?: string;
}

export function DetalleGrupoPage({ returnPath = "/grupos" }: DetalleGrupoPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const esDocente = activeRole === "DOCENTE";
  const {
    grupo,
    estudiantesGrupo,
    periodos,
    cursos,
    docentes,
    aulas,
    isLoading,
    isSubmitting,
    error,
    errorAccion,
    mensaje,
    ejecutarActualizar,
    ejecutarCambiarEstado,
    ejecutarCambiarDocente,
    ejecutarCancelar,
  } = useGrupos({ cargarListado: false, grupoId: id });
  const [editando, setEditando] = useState(false);
  const [docenteId, setDocenteId] = useState("");
  const [motivoDocente, setMotivoDocente] = useState("");
  const [motivoCancelacion, setMotivoCancelacion] = useState("");

  const guardarCambios = async (payload: GrupoPayload) => {
    if (!id) return;
    const actualizado = await ejecutarActualizar(id, payload);
    if (actualizado) {
      setEditando(false);
    }
  };

  const actualizarEstado = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !grupo) return;
    const formData = new FormData(event.currentTarget);
    const estado = formData.get("estado");
    if (typeof estado !== "string" || !estadosEditables.includes(estado as Exclude<EstadoGrupo, "CANCELADO">)) return;
    await ejecutarCambiarEstado(id, estado as Exclude<EstadoGrupo, "CANCELADO">);
  };

  const asignarDocente = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !docenteId) return;
    const actualizado = await ejecutarCambiarDocente(id, docenteId, motivoDocente.trim());
    if (actualizado) {
      setMotivoDocente("");
    }
  };

  const cancelar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;
    const actualizado = await ejecutarCancelar(id, motivoCancelacion.trim());
    if (actualizado) {
      setMotivoCancelacion("");
    }
  };

  if (isLoading) return <main className="mx-auto max-w-4xl p-6 text-sm text-muted">Cargando grupo...</main>;
  if (!grupo) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">{error || "No se encontró el grupo."}</p>
        <button type="button" onClick={() => navigate(returnPath)} className="outline-btn">Volver a grupos</button>
      </main>
    );
  }

  const periodo = periodos.find((item) => item.id === grupo.periodoId);
  const curso = cursos.find((item) => item.id === grupo.cursoId);
  const docente = docentes.find((item) => item.id === grupo.docenteId);
  const aula = aulas.find((item) => item.id === grupo.aulaId);
  const valoresIniciales: GrupoPayload = {
    periodoId: grupo.periodoId,
    cursoId: grupo.cursoId,
    aulaId: grupo.aulaId,
    cupoMaximo: grupo.cupoMaximo,
    fechaInicio: grupo.fechaInicio,
    fechaFin: grupo.fechaFin,
    horarios: grupo.horarios.map(({ diaSemana, horaInicio, horaFin }) => ({
      diaSemana,
      horaInicio: horaInicio.slice(0, 5),
      horaFin: horaFin.slice(0, 5),
    })),
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow mb-1">Grupo {grupo.codigo}</p>
          <h1 className="page-title">
            {editando
              ? "Editar grupo"
              : esDocente
                ? "Estudiantes matriculados"
                : curso?.nombre ?? "Detalle del grupo"}
          </h1>
          {!esDocente && <p className="mt-2 text-sm text-muted">{periodo?.codigo} · {periodo?.nombre}</p>}
        </div>
        <button type="button" onClick={() => navigate(returnPath)} className="outline-btn">Volver al listado</button>
      </header>

      {errorAccion && <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">{errorAccion}</p>}
      {mensaje && <p role="status" className="rounded-lg bg-green-soft p-4 text-sm text-green">{mensaje}</p>}
      {error && <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">{error}</p>}

      {editando ? (
        <section className="card p-5 sm:p-6">
          <GrupoForm
            key={grupo.id}
            initialValues={valoresIniciales}
            includeDocente={false}
            submitLabel="Guardar cambios"
            isSubmitting={isSubmitting}
            onSubmit={guardarCambios}
          />
          <button type="button" onClick={() => setEditando(false)} disabled={isSubmitting} className="outline-btn mt-3">Cancelar edición</button>
        </section>
      ) : (
        <>
          <section className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <div><p className="field-label">Estado</p><p><span className={grupo.estado === "EN_CURSO" ? "badge badge-green" : grupo.estado === "CANCELADO" ? "badge badge-red" : "badge"}>{grupo.estado}</span></p></div>
            {!esDocente && <><div><p className="field-label">Curso</p><p>{curso?.nombre ?? "No disponible"}</p></div>
            <div><p className="field-label">Docente</p><p>{docente ? `${docente.nombre} ${docente.apellidos}` : "Sin asignar"}</p></div>
            <div><p className="field-label">Aula</p><p>{aula?.nombre ?? "Sin asignar"}</p></div></>}
            <div><p className="field-label">Cupos disponibles</p><p>{grupo.cuposDisponibles} de {grupo.cupoMaximo}</p></div>
            <div><p className="field-label">Fechas</p><p>{grupo.fechaInicio} — {grupo.fechaFin}</p></div>
            <div className="sm:col-span-2">
              <p className="field-label">Horarios</p>
              <ul className="mt-2 space-y-1 text-sm text-body">
                {grupo.horarios.map((horario) => <li key={`${horario.diaSemana}-${horario.horaInicio}`}>{horario.diaSemana}: {horario.horaInicio.slice(0, 5)}–{horario.horaFin.slice(0, 5)}</li>)}
              </ul>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-border p-5">
              <h2 className="section-title">Estudiantes matriculados</h2>
              <p className="mt-1 text-xs text-muted">
                {estudiantesGrupo.length} {estudiantesGrupo.length === 1 ? "estudiante" : "estudiantes"} en este grupo.
              </p>
            </div>
            {estudiantesGrupo.length === 0 ? (
              <p className="p-5 text-sm text-muted">No hay estudiantes matriculados en este grupo.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                  <thead>
                    <tr className="table-header">
                      <th className="px-5 py-3">Código</th>
                      <th className="px-5 py-3">Estudiante</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3">Fecha de matrícula</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {estudiantesGrupo.map(({ matriculaId, fechaMatricula, estudiante }) => (
                      <tr key={matriculaId}>
                        <td className="px-5 py-4 text-sm font-medium text-navy">{estudiante.codigo}</td>
                        <td className="px-5 py-4 text-sm text-body">{estudiante.nombre} {estudiante.apellidos}</td>
                        <td className="px-5 py-4 text-sm text-body">{estudiante.estado}</td>
                        <td className="px-5 py-4 text-sm text-body">{fechaMatricula}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {!esDocente && <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setEditando(true)} disabled={grupo.estado === "CANCELADO"} className="primary-btn disabled:opacity-50">Editar grupo</button>
            {grupo.estado !== "CANCELADO" && (
              <form onSubmit={actualizarEstado} className="flex flex-wrap items-end gap-2">
                <div><label htmlFor="grupo-estado" className="field-label">Cambiar estado</label><select id="grupo-estado" name="estado" defaultValue={grupo.estado} disabled={isSubmitting} className="form-input">{estadosEditables.map((estado) => <option key={estado}>{estado}</option>)}</select></div>
                <button type="submit" disabled={isSubmitting} className="outline-btn">Actualizar estado</button>
              </form>
            )}
          </div>}

          {!esDocente && grupo.estado !== "CANCELADO" && grupo.estado !== "FINALIZADO" && (
            <section className="card p-5">
              <h2 className="section-title">Cambiar docente</h2>
              <form onSubmit={asignarDocente} className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <div><label htmlFor="grupo-nuevo-docente" className="field-label">Docente activo</label><select id="grupo-nuevo-docente" value={docenteId || grupo.docenteId || ""} onChange={(event) => setDocenteId(event.target.value)} required className="form-input"><option value="">Selecciona un docente</option>{docentes.filter((item) => item.estado === "ACTIVO").map((item) => <option key={item.id} value={item.id}>{item.nombre} {item.apellidos}</option>)}</select></div>
                <div><label htmlFor="grupo-motivo-docente" className="field-label">Motivo</label><input id="grupo-motivo-docente" value={motivoDocente} onChange={(event) => setMotivoDocente(event.target.value)} required className="form-input" /></div>
                <button type="submit" disabled={isSubmitting || !motivoDocente.trim()} className="primary-btn disabled:opacity-50">Asignar docente</button>
              </form>
            </section>
          )}

          {!esDocente && grupo.estado === "PROGRAMADO" && (
            <section className="card p-5">
              <h2 className="section-title">Cancelar grupo</h2>
              <form onSubmit={cancelar} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1"><label htmlFor="grupo-motivo-cancelacion" className="field-label">Motivo de cancelación</label><input id="grupo-motivo-cancelacion" value={motivoCancelacion} onChange={(event) => setMotivoCancelacion(event.target.value)} required className="form-input" /></div>
                <button type="submit" disabled={isSubmitting || !motivoCancelacion.trim()} className="outline-btn disabled:opacity-50">Cancelar grupo</button>
              </form>
            </section>
          )}
        </>
      )}
    </main>
  );
}
