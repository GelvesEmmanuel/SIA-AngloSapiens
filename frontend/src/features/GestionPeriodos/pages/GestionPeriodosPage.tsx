import { useCallback, useEffect, useState, type FormEvent } from "react";
import { extraerMensajeError } from "../../../api/apiError";
import { actualizarPeriodo, cambiarEstadoPeriodo, listarPeriodos, obtenerPeriodo, registrarPeriodo } from "../periodo.service";
import type { EstadoPeriodo, PeriodoAcademico } from "../periodo.types";

const estados: EstadoPeriodo[] = ["PROGRAMADO", "ACTIVO", "FINALIZADO", "INACTIVO"];

export function GestionPeriodosPage() {
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoPeriodo | "">("");
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [periodoEditando, setPeriodoEditando] = useState<PeriodoAcademico | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [reload, setReload] = useState(0);

  const cargarPeriodos = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await listarPeriodos({ busqueda: busqueda.trim() || undefined, estado: estado || undefined });
      setPeriodos(response.data);
    } catch (requestError: unknown) {
      setError(extraerMensajeError(requestError));
      setPeriodos([]);
    } finally {
      setIsLoading(false);
    }
  }, [busqueda, estado]);

  useEffect(() => {
    void cargarPeriodos();
  }, [cargarPeriodos, reload]);

  const limpiarFormulario = () => {
    setPeriodoEditando(null);
    setNombre("");
    setFechaInicio("");
    setFechaFin("");
    setErrorAccion("");
  };

  const enviarFormulario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (fechaFin < fechaInicio) {
      setErrorAccion("La fecha de fin debe ser igual o posterior a la fecha de inicio.");
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorAccion("");
      setMensaje("");
      const payload = { nombre: nombre.trim(), fechaInicio, fechaFin };
      const response = periodoEditando
        ? await actualizarPeriodo(periodoEditando.id, payload)
        : await registrarPeriodo(payload);
      setMensaje(response.message);
      limpiarFormulario();
      setReload((value) => value + 1);
    } catch (requestError: unknown) {
      setErrorAccion(extraerMensajeError(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const editarPeriodo = async (id: string) => {
    try {
      setErrorAccion("");
      const response = await obtenerPeriodo(id);
      const periodo = response.data;
      setPeriodoEditando(periodo);
      setNombre(periodo.nombre);
      setFechaInicio(periodo.fechaInicio);
      setFechaFin(periodo.fechaFin);
    } catch (requestError: unknown) {
      setErrorAccion(extraerMensajeError(requestError));
    }
  };

  const actualizarEstado = async (periodo: PeriodoAcademico, nuevoEstado: EstadoPeriodo) => {
    try {
      setErrorAccion("");
      setMensaje("");
      const response = await cambiarEstadoPeriodo(periodo.id, nuevoEstado);
      setMensaje(response.message);
      setReload((value) => value + 1);
    } catch (requestError: unknown) {
      setErrorAccion(extraerMensajeError(requestError));
    }
  };

  const activos = periodos.filter((periodo) => periodo.estado === "ACTIVO").length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
      <header>
        <p className="eyebrow mb-2">Gestión académica</p>
        <h1 className="page-title">Periodos académicos</h1>
        <p className="mt-2 text-sm text-muted">Define y administra los periodos en los que se ofertan grupos.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="card p-4"><p className="text-xs font-semibold text-muted">Periodos encontrados</p><p className="mt-2 text-2xl font-bold text-navy">{periodos.length}</p></div>
        <div className="card p-4"><p className="text-xs font-semibold text-muted">Periodos activos</p><p className="mt-2 text-2xl font-bold text-green">{activos}</p></div>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="section-title">{periodoEditando ? `Editar ${periodoEditando.codigo}` : "Registrar periodo"}</h2>
        <form onSubmit={enviarFormulario} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="periodo-nombre" className="field-label">Nombre</label>
              <input id="periodo-nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} maxLength={100} required className="form-input" placeholder="Ej. Periodo 2026" />
            </div>
            <div>
              <label htmlFor="periodo-inicio" className="field-label">Fecha de inicio</label>
              <input id="periodo-inicio" type="date" value={fechaInicio} onChange={(event) => setFechaInicio(event.target.value)} required className="form-input" />
            </div>
            <div>
              <label htmlFor="periodo-fin" className="field-label">Fecha de fin</label>
              <input id="periodo-fin" type="date" value={fechaFin} min={fechaInicio || undefined} onChange={(event) => setFechaFin(event.target.value)} required className="form-input" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={isSubmitting} className="primary-btn disabled:opacity-50">{isSubmitting ? "Guardando..." : periodoEditando ? "Guardar cambios" : "Registrar periodo"}</button>
            {periodoEditando && <button type="button" onClick={limpiarFormulario} className="outline-btn">Cancelar</button>}
          </div>
        </form>
        {errorAccion && <p role="alert" className="mt-3 rounded-lg bg-error-soft p-3 text-sm text-error">{errorAccion}</p>}
        {mensaje && <p role="status" className="mt-3 rounded-lg bg-green-soft p-3 text-sm text-green">{mensaje}</p>}
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
          <div><h2 className="section-title">Listado de periodos</h2><p className="mt-1 text-xs text-muted">Busca por nombre o código y filtra por estado.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label htmlFor="buscar-periodos" className="field-label">Buscar</label><input id="buscar-periodos" type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} className="form-input" placeholder="Nombre o código..." /></div>
            <div><label htmlFor="estado-periodos" className="field-label">Estado</label><select id="estado-periodos" value={estado} onChange={(event) => setEstado(event.target.value as EstadoPeriodo | "")} className="form-input"><option value="">Todos</option>{estados.map((opcion) => <option key={opcion}>{opcion}</option>)}</select></div>
          </div>
        </div>
        {error && <p role="alert" className="m-4 rounded-lg bg-error-soft p-4 text-sm text-error">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead><tr className="table-header"><th className="px-5 py-3">Código</th><th className="px-5 py-3">Periodo</th><th className="px-5 py-3">Inicio</th><th className="px-5 py-3">Fin</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-border">
              {isLoading ? <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted">Cargando periodos...</td></tr> : periodos.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted">{error ? "No se pudo cargar el listado." : "No se encontraron periodos."}</td></tr> : periodos.map((periodo) => (
                <tr key={periodo.id} className="transition hover:bg-surface-muted">
                  <td className="px-5 py-4 text-sm font-medium text-navy">{periodo.codigo}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-heading">{periodo.nombre}</td>
                  <td className="px-5 py-4 text-sm text-body">{periodo.fechaInicio}</td>
                  <td className="px-5 py-4 text-sm text-body">{periodo.fechaFin}</td>
                  <td className="px-5 py-4"><span className={periodo.estado === "ACTIVO" ? "badge badge-green" : "badge badge-red"}>{periodo.estado}</span></td>
                  <td className="space-x-2 px-5 py-4 text-right">
                    <button type="button" onClick={() => void editarPeriodo(periodo.id)} className="primary-btn px-3 py-1.5 text-xs">Editar</button>
                    <select aria-label={`Cambiar estado de ${periodo.nombre}`} value={periodo.estado} onChange={(event) => void actualizarEstado(periodo, event.target.value as EstadoPeriodo)} disabled={isSubmitting} className="form-input inline-block w-auto px-2 py-1.5 text-xs">{estados.map((opcion) => <option key={opcion}>{opcion}</option>)}</select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-border p-4"><button type="button" onClick={() => setReload((value) => value + 1)} disabled={isLoading} className="outline-btn disabled:opacity-50">{isLoading ? "Actualizando..." : "Actualizar listado"}</button></div>
      </section>
    </main>
  );
}
