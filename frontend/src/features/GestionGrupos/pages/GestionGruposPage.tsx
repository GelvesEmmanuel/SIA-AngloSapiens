import { useNavigate } from "react-router-dom";
import { useGrupos } from "../hooks/useGrupos";
import type { EstadoGrupo } from "../grupo.types";

const estados: EstadoGrupo[] = ["PROGRAMADO", "EN_CURSO", "FINALIZADO", "CANCELADO"];

export function GestionGruposPage() {
  const navigate = useNavigate();
  const {
    grupos,
    periodos,
    cursos,
    docentes,
    aulas,
    filtros,
    setFiltros,
    isLoading,
    error,
    recargarGrupos,
  } = useGrupos();

  const nombreCurso = (id: string) => cursos.find((curso) => curso.id === id)?.nombre ?? "Curso";
  const nombrePeriodo = (id: string) => periodos.find((periodo) => periodo.id === id)?.nombre ?? "Periodo";
  const nombreDocente = (id: string | null) => {
    const docente = docentes.find((item) => item.id === id);
    return docente ? `${docente.nombre} ${docente.apellidos}` : "Sin asignar";
  };
  const nombreAula = (id: string | null) => aulas.find((aula) => aula.id === id)?.nombre ?? "Sin asignar";
  const activos = grupos.filter((grupo) => grupo.estado === "EN_CURSO").length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow mb-2">Gestión académica</p>
          <h1 className="page-title">Gestión de grupos</h1>
          <p className="mt-2 text-sm text-muted">Administra grupos, horarios, cupos, docentes y aulas.</p>
        </div>
        <button type="button" onClick={() => navigate("/grupos/registrar")} className="primary-btn">+ Registrar grupo</button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4"><p className="text-xs font-semibold text-muted">Grupos encontrados</p><p className="mt-2 text-2xl font-bold text-navy">{grupos.length}</p></div>
        <div className="card p-4"><p className="text-xs font-semibold text-muted">En curso</p><p className="mt-2 text-2xl font-bold text-green">{activos}</p></div>
        <div className="card p-4"><p className="text-xs font-semibold text-muted">Programados</p><p className="mt-2 text-2xl font-bold text-navy">{grupos.filter((grupo) => grupo.estado === "PROGRAMADO").length}</p></div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
          <div><h2 className="section-title">Listado de grupos</h2><p className="mt-1 text-xs text-muted">Filtra por periodo, curso, docente, aula o estado.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div><label htmlFor="filtro-periodo" className="field-label">Periodo</label><select id="filtro-periodo" value={filtros.periodoId ?? ""} onChange={(event) => setFiltros((actual) => ({ ...actual, periodoId: event.target.value || undefined }))} className="form-input"><option value="">Todos</option>{periodos.map((periodo) => <option key={periodo.id} value={periodo.id}>{periodo.codigo} · {periodo.nombre}</option>)}</select></div>
            <div><label htmlFor="filtro-curso" className="field-label">Curso</label><select id="filtro-curso" value={filtros.cursoId ?? ""} onChange={(event) => setFiltros((actual) => ({ ...actual, cursoId: event.target.value || undefined }))} className="form-input"><option value="">Todos</option>{cursos.map((curso) => <option key={curso.id} value={curso.id}>{curso.nombre}</option>)}</select></div>
            <div><label htmlFor="filtro-docente" className="field-label">Docente</label><select id="filtro-docente" value={filtros.docenteId ?? ""} onChange={(event) => setFiltros((actual) => ({ ...actual, docenteId: event.target.value || undefined }))} className="form-input"><option value="">Todos</option>{docentes.map((docente) => <option key={docente.id} value={docente.id}>{docente.nombre} {docente.apellidos}</option>)}</select></div>
            <div><label htmlFor="filtro-aula" className="field-label">Aula</label><select id="filtro-aula" value={filtros.aulaId ?? ""} onChange={(event) => setFiltros((actual) => ({ ...actual, aulaId: event.target.value || undefined }))} className="form-input"><option value="">Todas</option>{aulas.map((aula) => <option key={aula.id} value={aula.id}>{aula.nombre}</option>)}</select></div>
            <div><label htmlFor="filtro-estado" className="field-label">Estado</label><select id="filtro-estado" value={filtros.estado ?? ""} onChange={(event) => setFiltros((actual) => ({ ...actual, estado: (event.target.value || undefined) as EstadoGrupo | undefined }))} className="form-input"><option value="">Todos</option>{estados.map((estado) => <option key={estado}>{estado}</option>)}</select></div>
          </div>
        </div>
        {error && <div role="alert" className="m-4 rounded-lg bg-error-soft p-4 text-sm text-error"><p>{error}</p><button type="button" onClick={recargarGrupos} className="mt-2 font-semibold underline">Intentar nuevamente</button></div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead><tr className="table-header"><th className="px-5 py-3">Código</th><th className="px-5 py-3">Curso / periodo</th><th className="px-5 py-3">Docente</th><th className="px-5 py-3">Aula</th><th className="px-5 py-3">Cupos</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
            <tbody className="divide-y divide-border">
              {isLoading ? <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted">Cargando grupos...</td></tr> : grupos.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted">{error ? "No se pudo cargar el listado." : "No se encontraron grupos."}</td></tr> : grupos.map((grupo) => (
                <tr key={grupo.id} className="transition hover:bg-surface-muted">
                  <td className="px-5 py-4 text-sm font-medium text-navy">{grupo.codigo}</td>
                  <td className="px-5 py-4"><p className="text-sm font-semibold text-heading">{nombreCurso(grupo.cursoId)}</p><p className="text-xs text-muted">{nombrePeriodo(grupo.periodoId)}</p></td>
                  <td className="px-5 py-4 text-sm text-body">{nombreDocente(grupo.docenteId)}</td>
                  <td className="px-5 py-4 text-sm text-body">{nombreAula(grupo.aulaId)}</td>
                  <td className="px-5 py-4 text-sm text-body">{grupo.cuposDisponibles} / {grupo.cupoMaximo}</td>
                  <td className="px-5 py-4"><span className={grupo.estado === "EN_CURSO" ? "badge badge-green" : grupo.estado === "CANCELADO" ? "badge badge-red" : "badge"}>{grupo.estado}</span></td>
                  <td className="px-5 py-4 text-right"><button type="button" onClick={() => navigate(`/grupos/${grupo.id}`)} className="primary-btn px-3 py-1.5 text-xs">Ver / gestionar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end border-t border-border p-4"><button type="button" onClick={recargarGrupos} disabled={isLoading} className="outline-btn disabled:opacity-50">{isLoading ? "Actualizando..." : "Actualizar listado"}</button></div>
      </section>
    </main>
  );
}
