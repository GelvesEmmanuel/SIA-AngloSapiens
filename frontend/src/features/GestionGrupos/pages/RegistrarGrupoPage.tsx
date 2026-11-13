import { useNavigate } from "react-router-dom";
import { useGrupos } from "../hooks/useGrupos";
import type { GrupoPayload } from "../grupo.types";
import { GrupoForm } from "./GrupoForm";

export function RegistrarGrupoPage() {
  const navigate = useNavigate();
  const { isSubmitting, errorAccion, ejecutarRegistrar } = useGrupos({
    cargarListado: false,
  });

  const registrar = async (payload: GrupoPayload) => {
    const grupo = await ejecutarRegistrar(payload);
    if (grupo) navigate(`/grupos/${grupo.id}`);
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <div><p className="eyebrow mb-1">Gestión académica</p><h1 className="page-title">Registrar grupo</h1><p className="mt-2 text-sm text-muted">Define el periodo, curso, cupo y horario del grupo.</p></div>
        <button type="button" onClick={() => navigate("/grupos")} className="outline-btn">Cancelar</button>
      </header>
      {errorAccion && <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">{errorAccion}</p>}
      <section className="card p-5 sm:p-6">
        <GrupoForm submitLabel="Registrar grupo" isSubmitting={isSubmitting} onSubmit={registrar} />
      </section>
    </main>
  );
}
