import { useNavigate } from "react-router-dom";
import { useCursos } from "../hooks/useCursos";

export function GestionCursosPage() {
  const navigate = useNavigate();
  const {
    cursos,
    busqueda,
    setBusqueda,
    estado,
    setEstado,
    isLoading,
    error,
    recargarCursos,
  } = useCursos();

  const activos = cursos.filter((curso) => curso.estado === "ACTIVO").length;
  const inactivos = cursos.filter((curso) => curso.estado === "INACTIVO").length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow mb-2">Gestión académica</p>
          <h1 className="page-title">Gestión de cursos</h1>
          <p className="mt-2 text-sm text-muted">
            Consulta, crea y administra la oferta de cursos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/cursos/registrar")}
          className="primary-btn"
        >
          + Registrar curso
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">Cursos encontrados</p>
          <p className="mt-2 text-2xl font-bold text-navy">{cursos.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">Activos</p>
          <p className="mt-2 text-2xl font-bold text-green">{activos}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">Inactivos</p>
          <p className="mt-2 text-2xl font-bold text-red">{inactivos}</p>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
          <div>
            <h2 className="section-title">Listado de cursos</h2>
            <p className="mt-1 text-xs text-muted">Busca por nombre o código.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_200px]">
            <div>
              <label htmlFor="busqueda-cursos" className="field-label">Buscar</label>
              <input
                id="busqueda-cursos"
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Nombre o código..."
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="estado-cursos" className="field-label">Estado</label>
              <select
                id="estado-cursos"
                value={estado}
                onChange={(event) =>
                  setEstado(event.target.value as "" | "ACTIVO" | "INACTIVO")
                }
                className="form-input"
              >
                <option value="">Todos</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={recargarCursos}
              disabled={isLoading}
              className="outline-btn disabled:opacity-50"
            >
              {isLoading ? "Actualizando..." : "Actualizar listado"}
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="m-4 rounded-lg bg-error-soft p-4 text-sm text-error">
            <p>{error}</p>
            <button type="button" onClick={recargarCursos} className="mt-2 font-semibold underline">
              Intentar nuevamente
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="table-header">
                <th className="px-5 py-3">Código</th>
                <th className="px-5 py-3">Curso</th>
                <th className="px-5 py-3">Nivel</th>
                <th className="px-5 py-3">Duración</th>
                <th className="px-5 py-3">Intensidad</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted">Cargando cursos...</td></tr>
              ) : cursos.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted">
                  {error ? "No se pudo cargar el listado." : "No se encontraron cursos."}
                </td></tr>
              ) : cursos.map((curso) => (
                <tr key={curso.id} className="transition hover:bg-surface-muted">
                  <td className="px-5 py-4 text-sm font-medium text-navy">{curso.codigo}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-heading">{curso.nombre}</td>
                  <td className="px-5 py-4 text-sm text-body">{curso.nivel}</td>
                  <td className="px-5 py-4 text-sm text-body">{curso.duracionSemanas} semanas</td>
                  <td className="px-5 py-4 text-sm text-body">{curso.intensidadSemanal}</td>
                  <td className="px-5 py-4">
                    <span className={curso.estado === "ACTIVO" ? "badge badge-green" : "badge badge-red"}>
                      {curso.estado}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/cursos/${curso.id}`)}
                      className="primary-btn px-3 py-1.5 text-xs"
                    >
                      Ver / editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
