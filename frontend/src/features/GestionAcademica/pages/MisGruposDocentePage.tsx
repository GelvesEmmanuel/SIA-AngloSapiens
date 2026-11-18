import { useNavigate } from "react-router-dom";
import { useGrupos } from "../../GestionGrupos/hooks/useGrupos";
export function MisGruposDocentePage() {
  const navigate = useNavigate();
  const { grupos, isLoading, error, recargarGrupos } = useGrupos();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="section-title">Mis grupos asignados</h2>
        <p className="mt-1 text-sm text-muted">
          Consulta tus grupos y abre uno para ver los estudiantes matriculados.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">
          <p>{error}</p>
          <button
            type="button"
            onClick={recargarGrupos}
            className="mt-2 font-semibold underline"
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-5">
          <div>
            <h3 className="section-title">Grupos asignados</h3>
            <p className="mt-1 text-xs text-muted">
              {!isLoading && !error
                ? `${grupos.length} ${grupos.length === 1 ? "grupo" : "grupos"}`
                : "Listado de tus grupos"}
            </p>
          </div>
          <button
            type="button"
            onClick={recargarGrupos}
            disabled={isLoading}
            className="outline-btn disabled:opacity-50"
          >
            {isLoading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead>
              <tr className="table-header">
                <th className="px-5 py-3">Código del grupo</th>
                <th className="px-5 py-3">Fechas</th>
                <th className="px-5 py-3">Cupos</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5} role="status" className="px-5 py-12 text-center text-sm text-muted">
                    Cargando tus grupos...
                  </td>
                </tr>
              ) : grupos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted">
                    {error ? "No se pudo cargar el listado." : "No tienes grupos asignados."}
                  </td>
                </tr>
              ) : (
                grupos.map((grupo) => (
                  <tr key={grupo.id} className="transition hover:bg-surface-muted">
                    <td className="px-5 py-4 text-sm font-semibold text-navy">
                      {grupo.codigo}
                    </td>
                    <td className="px-5 py-4 text-sm text-body">
                      {grupo.fechaInicio} – {grupo.fechaFin}
                    </td>
                    <td className="px-5 py-4 text-sm text-body">
                      {grupo.cuposDisponibles} / {grupo.cupoMaximo}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={
                          grupo.estado === "EN_CURSO"
                            ? "badge badge-green"
                            : grupo.estado === "CANCELADO"
                              ? "badge badge-red"
                              : "badge"
                        }
                      >
                        {grupo.estado.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/gestion-academica/grupos/${grupo.id}`)
                        }
                        className="primary-btn px-3 py-1.5 text-xs"
                      >
                        Ver estudiantes
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
