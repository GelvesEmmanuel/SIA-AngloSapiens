import { useNavigate } from "react-router-dom";

export function GestionEstudiantesPage() {
  const navigate = useNavigate();

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

        <button
          type="button"
          onClick={() => navigate("/estudiantes/registrar")}
          className="primary-btn"
        >
          + Pre-registrar estudiante
        </button>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article className="card p-4">
          <p className="text-xs font-semibold text-muted">Estudiantes</p>
          <p className="mt-2 text-2xl font-bold text-navy">—</p>
          <p className="mt-1 text-xs text-muted">
            El listado estará disponible cuando se habilite la consulta del backend.
          </p>
        </article>
        <article className="card p-4">
          <p className="text-xs font-semibold text-muted">Pre-registrados</p>
          <p className="mt-2 text-2xl font-bold text-navy">—</p>
          <p className="mt-1 text-xs text-muted">
            Consulta y seguimiento de nuevas solicitudes.
          </p>
        </article>
        <article className="card p-4">
          <p className="text-xs font-semibold text-muted">Acción disponible</p>
          <p className="mt-2 text-lg font-bold text-navy">
            Nuevo pre-registro
          </p>
          <p className="mt-1 text-xs text-muted">
            Registra los datos, contactos y documentos del estudiante.
          </p>
        </article>
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
          onClick={() => navigate("/estudiantes/registrar")}
          className="primary-btn mt-5"
        >
          Registrar estudiante
        </button>
      </section>
    </div>
  );
}
