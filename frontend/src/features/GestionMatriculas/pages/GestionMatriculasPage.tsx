import { useNavigate } from "react-router-dom";
import { useMatricula } from "../hooks/useMatricula";
import type {
  EstadoMatricula,
  EstadoPagoMatricula,
} from "../matricula.types";

const estados: EstadoMatricula[] = ["ACTIVA", "CANCELADA", "FINALIZADA"];
const estadosPago: EstadoPagoMatricula[] = ["PAGO", "NO_PAGO"];

export function GestionMatriculasPage() {
  const navigate = useNavigate();
  const {
    matriculas,
    estudiantes,
    grupos,
    filtros,
    setFiltros,
    isLoading,
    error,
    recargarMatriculas,
  } = useMatricula();

  const nombreEstudiante = (id: string) => {
    const estudiante = estudiantes.find((item) => item.id === id);
    return estudiante
      ? `${estudiante.nombre} ${estudiante.apellidos}`
      : "Estudiante no disponible";
  };
  const codigoGrupo = (id: string) =>
    grupos.find((item) => item.id === id)?.codigo ?? "Grupo no disponible";

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow mb-2">Gestión académica</p>
          <h1 className="page-title">Gestión de matrículas</h1>
          <p className="mt-2 text-sm text-muted">
            Registra y administra las matrículas de los estudiantes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/matriculas/registrar")}
          className="primary-btn"
        >
          + Registrar matrícula
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">Matrículas encontradas</p>
          <p className="mt-2 text-2xl font-bold text-navy">{matriculas.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">Activas</p>
          <p className="mt-2 text-2xl font-bold text-green">
            {matriculas.filter((item) => item.estadoMatricula === "ACTIVA").length}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-muted">Finalizadas o canceladas</p>
          <p className="mt-2 text-2xl font-bold text-red">
            {matriculas.filter((item) => item.estadoMatricula !== "ACTIVA").length}
          </p>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
          <div>
            <h2 className="section-title">Listado de matrículas</h2>
            <p className="mt-1 text-xs text-muted">
              Filtra por estudiante, grupo o estados de matrícula y pago.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="filtro-matricula-estudiante" className="field-label">Estudiante</label>
              <select
                id="filtro-matricula-estudiante"
                value={filtros.estudianteId ?? ""}
                onChange={(event) =>
                  setFiltros((actual) => ({
                    ...actual,
                    estudianteId: event.target.value || undefined,
                  }))
                }
                className="form-input"
              >
                <option value="">Todos</option>
                {estudiantes.map((estudiante) => (
                  <option key={estudiante.id} value={estudiante.id}>
                    {estudiante.nombre} {estudiante.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filtro-matricula-grupo" className="field-label">Grupo</label>
              <select
                id="filtro-matricula-grupo"
                value={filtros.grupoId ?? ""}
                onChange={(event) =>
                  setFiltros((actual) => ({
                    ...actual,
                    grupoId: event.target.value || undefined,
                  }))
                }
                className="form-input"
              >
                <option value="">Todos</option>
                {grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>{grupo.codigo}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filtro-matricula-estado" className="field-label">Estado</label>
              <select
                id="filtro-matricula-estado"
                value={filtros.estadoMatricula ?? ""}
                onChange={(event) =>
                  setFiltros((actual) => ({
                    ...actual,
                    estadoMatricula: (event.target.value || undefined) as
                      | EstadoMatricula
                      | undefined,
                  }))
                }
                className="form-input"
              >
                <option value="">Todos</option>
                {estados.map((estado) => <option key={estado}>{estado}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="filtro-matricula-pago" className="field-label">Estado de pago</label>
              <select
                id="filtro-matricula-pago"
                value={filtros.estadoPago ?? ""}
                onChange={(event) =>
                  setFiltros((actual) => ({
                    ...actual,
                    estadoPago: (event.target.value || undefined) as
                      | EstadoPagoMatricula
                      | undefined,
                  }))
                }
                className="form-input"
              >
                <option value="">Todos</option>
                {estadosPago.map((estado) => <option key={estado}>{estado}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="m-4 rounded-lg bg-error-soft p-4 text-sm text-error">
            <p>{error}</p>
            <button type="button" onClick={recargarMatriculas} className="mt-2 font-semibold underline">
              Intentar nuevamente
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead>
              <tr className="table-header">
                <th className="px-5 py-3">Código</th>
                <th className="px-5 py-3">Estudiante</th>
                <th className="px-5 py-3">Grupo</th>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Pago</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted">Cargando matrículas...</td></tr>
              ) : matriculas.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted">{error ? "No se pudo cargar el listado." : "No se encontraron matrículas."}</td></tr>
              ) : matriculas.map((matricula) => (
                <tr key={matricula.id} className="transition hover:bg-surface-muted">
                  <td className="px-5 py-4 text-sm font-medium text-navy">{matricula.codigo}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-heading">{nombreEstudiante(matricula.estudianteId)}</td>
                  <td className="px-5 py-4 text-sm text-body">{codigoGrupo(matricula.grupoId)}</td>
                  <td className="px-5 py-4 text-sm text-body">{matricula.fechaMatricula}</td>
                  <td className="px-5 py-4 text-sm text-body">{matricula.estadoPago}</td>
                  <td className="px-5 py-4">
                    <span className={matricula.estadoMatricula === "ACTIVA" ? "badge badge-green" : matricula.estadoMatricula === "CANCELADA" ? "badge badge-red" : "badge"}>
                      {matricula.estadoMatricula}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/matriculas/${matricula.id}`)}
                      className="primary-btn px-3 py-1.5 text-xs"
                    >
                      Ver / gestionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-border p-4">
          <button type="button" onClick={recargarMatriculas} disabled={isLoading} className="outline-btn disabled:opacity-50">
            {isLoading ? "Actualizando..." : "Actualizar listado"}
          </button>
        </div>
      </section>
    </main>
  );
}
