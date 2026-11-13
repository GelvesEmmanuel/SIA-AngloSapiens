import { useCallback, useEffect, useState, type FormEvent } from "react";
import { extraerMensajeError } from "../../../api/apiError";
import { actualizarAula, cambiarEstadoAula, listarAulas, obtenerAula, registrarAula } from "../aula.service";
import type { Aula } from "../aula.types";

export function GestionAulasPage() {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [activa, setActiva] = useState<"" | "true" | "false">("");
  const [nombre, setNombre] = useState("");
  const [aulaEditando, setAulaEditando] = useState<Aula | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [reload, setReload] = useState(0);

  const cargarAulas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await listarAulas({
        busqueda: busqueda.trim() || undefined,
        activa: activa ? activa === "true" : undefined,
      });
      setAulas(response.data);
    } catch (requestError: unknown) {
      setError(extraerMensajeError(requestError));
      setAulas([]);
    } finally {
      setIsLoading(false);
    }
  }, [activa, busqueda]);

  useEffect(() => {
    void cargarAulas();
  }, [cargarAulas, reload]);

  const enviarFormulario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorAccion("");
      setMensaje("");
      const respuesta = aulaEditando
        ? await actualizarAula(aulaEditando.id, nombre.trim())
        : await registrarAula(nombre.trim());
      setMensaje(respuesta.message);
      setNombre("");
      setAulaEditando(null);
      setReload((value) => value + 1);
    } catch (requestError: unknown) {
      setErrorAccion(extraerMensajeError(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const editarAula = async (id: string) => {
    try {
      setErrorAccion("");
      const response = await obtenerAula(id);
      setAulaEditando(response.data);
      setNombre(response.data.nombre);
    } catch (requestError: unknown) {
      setErrorAccion(extraerMensajeError(requestError));
    }
  };

  const alternarEstado = async (aula: Aula) => {
    try {
      setErrorAccion("");
      setMensaje("");
      const response = await cambiarEstadoAula(aula.id, !aula.activa);
      setMensaje(response.message);
      setReload((value) => value + 1);
    } catch (requestError: unknown) {
      setErrorAccion(extraerMensajeError(requestError));
    }
  };

  const cancelarEdicion = () => {
    setAulaEditando(null);
    setNombre("");
    setErrorAccion("");
  };

  const activas = aulas.filter((aula) => aula.activa).length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
      <header>
        <p className="eyebrow mb-2">Gestión académica</p>
        <h1 className="page-title">Gestión de aulas</h1>
        <p className="mt-2 text-sm text-muted">Administra las aulas disponibles para los grupos.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">Aulas encontradas</p>
          <p className="mt-2 text-2xl font-bold text-navy">{aulas.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">Aulas activas</p>
          <p className="mt-2 text-2xl font-bold text-green">{activas}</p>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="section-title">{aulaEditando ? "Editar aula" : "Registrar aula"}</h2>
        <form onSubmit={enviarFormulario} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="aula-nombre" className="field-label">Nombre del aula</label>
            <input
              id="aula-nombre"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              maxLength={50}
              required
              className="form-input"
              placeholder="Ej. Aula 1"
            />
          </div>
          <button type="submit" disabled={isSubmitting} className="primary-btn disabled:opacity-50">
            {isSubmitting ? "Guardando..." : aulaEditando ? "Guardar cambios" : "Registrar aula"}
          </button>
          {aulaEditando && (
            <button type="button" onClick={cancelarEdicion} className="outline-btn">Cancelar</button>
          )}
        </form>
        {errorAccion && <p role="alert" className="mt-3 rounded-lg bg-error-soft p-3 text-sm text-error">{errorAccion}</p>}
        {mensaje && <p role="status" className="mt-3 rounded-lg bg-green-soft p-3 text-sm text-green">{mensaje}</p>}
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
          <div>
            <h2 className="section-title">Listado de aulas</h2>
            <p className="mt-1 text-xs text-muted">Busca por nombre y filtra por disponibilidad.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="buscar-aulas" className="field-label">Buscar</label>
              <input id="buscar-aulas" type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} className="form-input" placeholder="Nombre del aula..." />
            </div>
            <div>
              <label htmlFor="estado-aulas" className="field-label">Estado</label>
              <select id="estado-aulas" value={activa} onChange={(event) => setActiva(event.target.value as "" | "true" | "false")} className="form-input">
                <option value="">Todas</option>
                <option value="true">Activas</option>
                <option value="false">Inactivas</option>
              </select>
            </div>
          </div>
        </div>
        {error && <p role="alert" className="m-4 rounded-lg bg-error-soft p-4 text-sm text-error">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead><tr className="table-header"><th className="px-5 py-3">Aula</th><th className="px-5 py-3">Disponibilidad</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={3} className="px-5 py-12 text-center text-sm text-muted">Cargando aulas...</td></tr>
              ) : aulas.length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-12 text-center text-sm text-muted">{error ? "No se pudo cargar el listado." : "No se encontraron aulas."}</td></tr>
              ) : aulas.map((aula) => (
                <tr key={aula.id} className="transition hover:bg-surface-muted">
                  <td className="px-5 py-4 text-sm font-semibold text-heading">{aula.nombre}</td>
                  <td className="px-5 py-4"><span className={aula.activa ? "badge badge-green" : "badge badge-red"}>{aula.activa ? "ACTIVA" : "INACTIVA"}</span></td>
                  <td className="space-x-2 px-5 py-4 text-right">
                    <button type="button" onClick={() => void editarAula(aula.id)} className="primary-btn px-3 py-1.5 text-xs">Editar</button>
                    <button type="button" onClick={() => void alternarEstado(aula)} disabled={isSubmitting} className="outline-btn px-3 py-1.5 text-xs">{aula.activa ? "Desactivar" : "Activar"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-border p-4">
          <button type="button" onClick={() => setReload((value) => value + 1)} disabled={isLoading} className="outline-btn disabled:opacity-50">{isLoading ? "Actualizando..." : "Actualizar listado"}</button>
        </div>
      </section>
    </main>
  );
}
