
import { useNavigate } from "react-router-dom";
import { useDocentes } from "../hooks/useDocents";

export function GestionDocentePage() {
  const navigate = useNavigate();

  const {
    docentes,
    busqueda,
    setBusqueda,
    estado,
    setEstado,
    isLoading,
    error,
    recargarDocentes,
    mensajeExito,
    errorAccion,
    limpiarMensajes,
  } = useDocentes();

  // Indicadores
  const listaDocentes = Array.isArray(docentes) ? docentes : [];
  const totalDocentes = listaDocentes.length;
  const activos = listaDocentes.filter(
    (d) => d.estado === "ACTIVO"
  ).length;
  const inactivos = listaDocentes.filter(
    (d) => d.estado === "INACTIVO"
  ).length;
 


  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">

      {/* Encabezado */}
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

        <div>
          <p className="eyebrow mb-2">Academia</p>
          <h1 className="page-title">Gestión de Docentes</h1>
          <p className="mt-2 text-sm text-muted">
            Consulta, filtra y administra los expedientes y perfiles
            de los docentes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            limpiarMensajes();
            // Conectar con el modal o la ruta de registro.
            // navigate("/docentes/crear");
          }}
          className="primary-btn"
        >
          + Registrar docente
        </button>

      </header>

      {/* Indicadores */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">
            Docentes encontrados
          </p>
          <p className="mt-2 text-2xl font-bold text-navy">
            {totalDocentes}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">
            Docentes activos
          </p>
          <p className="mt-2 text-2xl font-bold text-green">
            {activos}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">
            Docentes inactivos
          </p>
          <p className="mt-2 text-2xl font-bold text-red">
            {inactivos}
          </p>
        </div>

      </section>

      {/* Mensajes globales */}
      {mensajeExito && (
        <div
          role="status"
          className="rounded-lg border border-green/25 bg-green-soft p-4"
        >
          <p className="text-sm font-medium text-green">
            {mensajeExito}
          </p>
        </div>
      )}

      {errorAccion && (
        <div
          role="alert"
          className="rounded-lg border border-error/25 bg-error-soft p-4"
        >
          <p className="text-sm font-medium text-error">
            {errorAccion}
          </p>
        </div>
      )}

      {/* Listado y filtros */}
      <section className="card overflow-hidden">

        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">

          <div>
            <h2 className="section-title">
              Listado de docentes
            </h2>
            <p className="mt-1 text-xs text-muted">
              Busca por nombre, código o número de documento.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_200px]">

            {/* Búsqueda */}
            <div>
              <label
                htmlFor="busqueda-docentes"
                className="field-label"
              >
                Buscar docente
              </label>

              <input
                id="busqueda-docentes"
                type="search"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(event.target.value)
                }
                placeholder="Nombre, apellidos o documento..."
                className="form-input"
              />
            </div>

            {/* Filtro de estado */}
            <div>
              <label
                htmlFor="filtro-estado-docente"
                className="field-label"
              >
                Estado
              </label>

              <select
                id="filtro-estado-docente"
                value={estado}
                onChange={(event) =>
                  setEstado(
                    event.target.value as
                      | ""
                      | "ACTIVO"
                      | "INACTIVO"
                      | "REGISTRADO"
                  )
                }
                className="form-input"
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="REGISTRADO">Registrado</option>
              </select>
            </div>

          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={recargarDocentes}
              disabled={isLoading}
              className="outline-btn disabled:opacity-50"
            >
              {isLoading ? "Actualizando..." : "Actualizar listado"}
            </button>
          </div>

        </div>

        {/* Error de carga */}
        {error && (
          <div className="m-4 rounded-lg border border-error/20 bg-error-soft p-4">
            <p className="text-sm font-medium text-error">
              {error}
            </p>

            <button
              type="button"
              onClick={recargarDocentes}
              disabled={isLoading}
              className="mt-2 text-xs font-bold text-error underline"
            >
              Intentar nuevamente
            </button>
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-x-auto">

          <table className="w-full min-w-[750px] text-left">

            <thead>
              <tr className="table-header">
                <th className="px-5 py-3">Código</th>
                <th className="px-5 py-3">Docente</th>
                <th className="px-5 py-3">Documento</th>
                <th className="px-5 py-3">Correo</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">

              {/* Estado de carga */}
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-sm text-muted">
                      Cargando docentes...
                    </p>
                  </td>
                </tr>

              ) : error && docentes.length === 0 ? (
                /* Error sin datos */
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="font-semibold text-heading">
                      No se pudo cargar el listado
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Intenta nuevamente en unos momentos.
                    </p>
                  </td>
                </tr>

              ) : docentes.length === 0 ? (
                /* Listado vacío */
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="font-semibold text-heading">
                      No se encontraron docentes
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Prueba cambiando los filtros o el término de búsqueda.
                    </p>
                  </td>
                </tr>

              ) : (
                /* Listado de docentes */
                docentes.map((docente) => (
                  <tr
                    key={docente.id}
                    className="transition hover:bg-surface-muted"
                  >

                    <td className="px-5 py-4 text-sm font-medium text-navy">
                      {docente.codigo}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-heading">
                        {docente.nombre} {docente.apellidos}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-body">
                      {docente.tipoDocumento}: {docente.numeroDocumento}
                    </td>

                    

                    <td className="px-5 py-4">
                      <span
                        className={
                          docente.estado === "ACTIVO"
                            ? "badge badge-green"
                            : docente.estado === "INACTIVO"
                            ? "badge badge-red"
                            : "badge badge-amber"
                        }
                      >
                        {docente.estado}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/docentes/${docente.id}`)
                        }
                        className="primary-btn px-3 py-1.5 text-xs"
                      >
                        Ver detalle / Hoja de vida
                      </button>
                    </td>

                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

      </section>
    </div>
  );
}
