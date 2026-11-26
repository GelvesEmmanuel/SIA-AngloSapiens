import { useEffect, useState } from "react";
import { extraerMensajeError } from "../../../api/apiError";
import { listarAuditorias } from "../auditoria.service";
import {
  TABLAS_AUDITABLES,
  type Auditoria,
  type TablaAuditable,
} from "../auditoria.types";

const nombresTablas: Record<TablaAuditable, string> = {
  grupos: "Grupos",
  cursos: "Cursos",
  matriculas: "Matrículas",
  usuarios: "Usuarios",
  estudiantes: "Estudiantes",
  docentes: "Docentes",
  periodos_academicos: "Periodos académicos",
};

const nombresAcciones = {
  CREATE: "Creación",
  UPDATE: "Actualización",
  DELETE: "Eliminación",
} as const;

function formatearFecha(fecha: string) {
  const fechaValida = new Date(fecha);

  if (Number.isNaN(fechaValida.getTime())) return fecha;

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fechaValida);
}

function formatearDatos(datos: unknown) {
  return datos === null ? "Sin datos" : JSON.stringify(datos, null, 2);
}

function DetalleJson({ titulo, datos }: { titulo: string; datos: unknown }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
        {titulo}
      </h4>
      <pre className="max-h-72 overflow-auto rounded-lg bg-surface-muted p-3 text-xs text-body">
        {formatearDatos(datos)}
      </pre>
    </div>
  );
}

export function AuditoriasPage() {
  const [tablaAfectada, setTablaAfectada] = useState<TablaAuditable | "">("");
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vigente = true;

    const cargarAuditorias = async () => {
      setIsLoading(true);
      setError("");

      try {
        const respuesta = await listarAuditorias(tablaAfectada || undefined);
        if (vigente) setAuditorias(respuesta.data);
      } catch (error: unknown) {
        if (vigente) setError(extraerMensajeError(error));
      } finally {
        if (vigente) setIsLoading(false);
      }
    };

    void cargarAuditorias();

    return () => {
      vigente = false;
    };
  }, [tablaAfectada, recarga]);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
      <header>
        <p className="eyebrow mb-2">Administración</p>
        <h1 className="page-title">Auditoría del sistema</h1>
        <p className="mt-2 text-sm text-muted">
          Consulta los cambios registrados y filtra por tabla afectada.
        </p>
      </header>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <div className="w-full sm:max-w-sm">
            <label htmlFor="tabla-auditoria" className="field-label">
              Tabla afectada
            </label>
            <select
              id="tabla-auditoria"
              value={tablaAfectada}
              onChange={(event) =>
                setTablaAfectada(
                  TABLAS_AUDITABLES.find(
                    (tabla) => tabla === event.target.value,
                  ) ?? "",
                )
              }
              className="form-input"
            >
              <option value="">Todas las tablas</option>
              {TABLAS_AUDITABLES.map((tabla) => (
                <option key={tabla} value={tabla}>
                  {nombresTablas[tabla]}
                </option>
              ))}
            </select>
          </div>
          <p aria-live="polite" className="text-sm text-muted">
            {isLoading
              ? "Cargando auditorías..."
              : `${auditorias.length} ${
                  auditorias.length === 1 ? "registro encontrado" : "registros encontrados"
                }`}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="m-4 rounded-lg bg-error-soft p-4 text-sm text-error"
          >
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setRecarga((actual) => actual + 1)}
              className="mt-2 font-semibold underline"
            >
              Intentar nuevamente
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="table-header">
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Tabla</th>
                <th className="px-5 py-3">Acción</th>
                <th className="px-5 py-3">Registro</th>
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Motivo</th>
                <th className="px-5 py-3">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted">
                    Cargando auditorías...
                  </td>
                </tr>
              ) : auditorias.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted">
                    {error
                      ? "No se pudo cargar el listado."
                      : "No se encontraron auditorías para esta tabla."}
                  </td>
                </tr>
              ) : (
                auditorias.map((auditoria) => (
                  <tr key={auditoria.id} className="align-top transition hover:bg-surface-muted">
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-body">
                      {formatearFecha(auditoria.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-heading">
                      {nombresTablas[auditoria.tablaAfectada]}
                    </td>
                    <td className="px-5 py-4 text-sm text-body">
                      {nombresAcciones[auditoria.accion]}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-body">
                      {auditoria.registroId}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-body">
                      {auditoria.usuarioId}
                    </td>
                    <td className="max-w-56 px-5 py-4 text-sm text-body">
                      {auditoria.motivo || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-semibold text-navy hover:underline">
                          Ver cambios
                        </summary>
                        <div className="mt-3 grid min-w-[420px] gap-4 rounded-lg border border-border bg-white p-3 shadow-sm md:grid-cols-2">
                          <DetalleJson
                            titulo="Datos anteriores"
                            datos={auditoria.datosAntiguos}
                          />
                          <DetalleJson
                            titulo="Datos nuevos"
                            datos={auditoria.datosNuevos}
                          />
                        </div>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
