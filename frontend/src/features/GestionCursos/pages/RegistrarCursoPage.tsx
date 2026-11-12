import { useNavigate } from "react-router-dom";
import { useCursos } from "../hooks/useCursos";
import { CursoForm } from "./CursoForm";

export function RegistrarCursoPage() {
  const navigate = useNavigate();
  const { ejecutarRegistrarCurso, isSubmitting, errorAccion } = useCursos({
    cargarListado: false,
  });

  const registrar = async (payload: Parameters<typeof ejecutarRegistrarCurso>[0]) => {
    const curso = await ejecutarRegistrarCurso(payload);
    if (curso) navigate(`/cursos/${curso.id}`);
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="eyebrow mb-1">Gestión académica</p>
          <h1 className="page-title">Registrar curso</h1>
          <p className="mt-2 text-sm text-muted">Completa la información académica del curso.</p>
        </div>
        <button type="button" onClick={() => navigate("/cursos")} className="outline-btn">
          Cancelar
        </button>
      </header>

      {errorAccion && (
        <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">
          {errorAccion}
        </p>
      )}
      <section className="card p-5 sm:p-6">
        <CursoForm
          submitLabel="Registrar curso"
          isSubmitting={isSubmitting}
          onSubmit={registrar}
        />
      </section>
    </main>
  );
}
