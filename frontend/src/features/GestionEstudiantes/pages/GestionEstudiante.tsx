import { useNavigate } from "react-router-dom";
import { useEstudiantes } from "../hooks/useEstudiantes";


export function GestionEstudiantesPage() {
  const navigate = useNavigate();
  const {
    estudiantes,
    busqueda,
    setBusqueda,
    estado,
    setEstado,
    isLoading,
    recargarEstudiantes,
    mensajeExito,
    errorAccion,
    error

  } = useEstudiantes();

  // indicadores 
  const listaEstudiantes = Array.isArray(estudiantes) ? estudiantes : [];
  const totalEstudiantes = listaEstudiantes.length;
  const preregistrado = listaEstudiantes.filter(
    (d) => d.estado == "PRE_REGISTRADO"
  ).length;
  const registrado = listaEstudiantes.filter(
    (d) => d.estado == "REGISTRADO"
  ).length;
  const matriculado = listaEstudiantes.filter(
    (d) => d.estado == "MATRICULADO"
  ).length;
  const inactivo = listaEstudiantes.filter(
    (d) => d.estado == "INACTIVO"
  ).length;
  

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow mb-2">Academia</p>
          <h1 className="page-title">Gestión de estudiantes</h1>
          <p className="mt-2 text-sm text-muted">
            Administra el pre-registro y la información de los estudiantes.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/estudiantes/pre_registrar")}
            className="primary-btn"
          >
            + Pre-registrar estudiante
          </button>
          <button
            type="button"
            onClick={() => navigate("/estudiantes/registrar")}
            className="outline-btn"
          >
            Consentimiento y firma
          </button>
        </div>
      </header>


      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">

        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">
            Estudiantes encontrados
          </p>
          <p className="mt-2 text-2xl font-bold text-navy">
            {totalEstudiantes}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">
            Estudiantes Pre-Registrados
          </p>
          <p className="mt-2 text-2xl font-bold text-green">
            {preregistrado}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">
            Estudiantes Registrados
          </p>
          <p className="mt-2 text-2xl font-bold text-red">
            {registrado}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">
            Estudiantes Matriculados
          </p>
          <p className="mt-2 text-2xl font-bold text-red">
            {matriculado}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">
            Estudiantes Inactivos
          </p>
          <p className="mt-2 text-2xl font-bold text-red">
            {inactivo}
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
              Listado de estudiantes
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
                Buscar Estudiante
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
                      | "PRE_REGISTRADO"
                      | "REGISTRADO"
                      | "MATRICULADO"
                      | "INACTIVO"
                  )
                }
                className="form-input"
              >
                <option value="">Todos los estados</option>
                <option value="PRE_REGISTRADO">Registrado</option>
                <option value="REGISTRADO">Registrado</option>
                <option value="MATRICULADO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                
              </select>
            </div>

          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={recargarEstudiantes}
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
              onClick={recargarEstudiantes}
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
                <th className="px-5 py-3">Estudiante</th>
                <th className="px-5 py-3">Tipo documento</th>
                <th className="px-5 py-3">Documento</th>
                <th className="px-5 py-3">telefono</th>
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

              ) : error && estudiantes.length === 0 ? (
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

              ) : estudiantes.length === 0 ? (
                /* Listado vacío */
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="font-semibold text-heading">
                      No se encontraron estudiantes
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Prueba cambiando los filtros o el término de búsqueda.
                    </p>
                  </td>
                </tr>

              ) : (
                /* Listado de docentes */
                estudiantes.map((estudiante) => (
                  <tr
                    key={estudiante.id}
                    className="transition hover:bg-surface-muted"
                  >

                    <td className="px-5 py-4 text-sm font-medium text-navy">
                      {estudiante.codigo}
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-heading">
                        {estudiante.nombre} {estudiante.apellidos}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-body">
                      {estudiante.tipoDocumento}
                    </td>

                    <td className="px-5 py-4 text-sm text-body">
                       {estudiante.numeroDocumento}
                    </td>
                    <td className="px-5 py-4 text-sm text-body">
                      {estudiante.telefono}
                    </td>

                    

                    <td className="px-5 py-4">
                      <span
                        className={
                          estudiante.estado === "REGISTRADO"
                            ? "badge badge-green"
                            : estudiante.estado === "INACTIVO"
                            ? "badge badge-red"
                            : "badge badge-amber"
                        }
                      >
                        {estudiante.estado}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/estudiantes/detalle/${estudiante.id}`)
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

      <section className="card p-5 sm:p-6">
        <h2 className="section-title">Comienza un pre-registro</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          El formulario permite guardar la información personal, al menos un
          contacto y los documentos obligatorios del estudiante. El backend
          todavía no ofrece un endpoint para listar los registros existentes.
        </p>
        <button
          type="button"
          onClick={() => navigate("/estudiantes/pre_registrar")}
          className="primary-btn mt-5"
        >
          Pre-registrar estudiante
        </button>
      </section>
    </div>
  );
}
