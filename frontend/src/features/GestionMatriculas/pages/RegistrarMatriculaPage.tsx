import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useMatricula } from "../hooks/useMatricula";
import type {
  EstadoPagoMatricula,
  MatriculaPayload,
  ModoPagoMatricula,
  TipoMatricula,
} from "../matricula.types";

export function RegistrarMatriculaPage() {
  const navigate = useNavigate();
  const {
    estudiantes,
    grupos,
    isLoading,
    isSubmitting,
    error,
    errorAccion,
    ejecutarRegistrar,
  } = useMatricula({ cargarListado: false });
  const [estudianteId, setEstudianteId] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [tipoMatricula, setTipoMatricula] = useState<TipoMatricula>("REGULAR");
  const [valorAcordado, setValorAcordado] = useState("");
  const [descuentoAplicado, setDescuentoAplicado] = useState("0");
  const [modoPago, setModoPago] = useState<ModoPagoMatricula | "">("");
  const [estadoPago, setEstadoPago] = useState<EstadoPagoMatricula>("NO_PAGO");
  const [observaciones, setObservaciones] = useState("");

  const gruposDisponibles = grupos.filter(
    (grupo) =>
      grupo.cuposDisponibles > 0 &&
      (grupo.estado === "PROGRAMADO" || grupo.estado === "EN_CURSO"),
  );
  const estudiantesRegistrables = estudiantes.filter(
    (estudiante) => estudiante.estado === "REGISTRADO",
  );

  const enviarFormulario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: MatriculaPayload = {
      estudianteId,
      grupoId,
      tipoMatricula,
      valorAcordado: valorAcordado === "" ? null : Number(valorAcordado),
      descuentoAplicado: Number(descuentoAplicado),
      modoPago: modoPago || null,
      estadoPago,
      observaciones: observaciones.trim() || null,
    };
    const matricula = await ejecutarRegistrar(payload);
    if (matricula) navigate(`/matriculas/${matricula.id}`);
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="eyebrow mb-1">Gestión académica</p>
          <h1 className="page-title">Registrar matrícula</h1>
          <p className="mt-2 text-sm text-muted">
            Asigna un estudiante registrado a un grupo con cupo disponible.
          </p>
        </div>
        <button type="button" onClick={() => navigate("/matriculas")} className="outline-btn">
          Cancelar
        </button>
      </header>

      {error && <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">{error}</p>}
      {errorAccion && <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">{errorAccion}</p>}

      <section className="card p-5 sm:p-6">
        {isLoading ? (
          <p className="text-sm text-muted">Cargando estudiantes y grupos...</p>
        ) : (
          <form onSubmit={enviarFormulario} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="matricula-estudiante" className="field-label">Estudiante</label>
                <select
                  id="matricula-estudiante"
                  value={estudianteId}
                  onChange={(event) => setEstudianteId(event.target.value)}
                  required
                  className="form-input"
                >
                  <option value="">Selecciona un estudiante registrado</option>
                  {estudiantesRegistrables.map((estudiante) => (
                    <option key={estudiante.id} value={estudiante.id}>
                      {estudiante.codigo} · {estudiante.nombre} {estudiante.apellidos}
                    </option>
                  ))}
                </select>
                {estudiantesRegistrables.length === 0 && (
                  <p className="mt-1 text-xs text-muted">No hay estudiantes disponibles para matricular.</p>
                )}
              </div>
              <div>
                <label htmlFor="matricula-grupo" className="field-label">Grupo</label>
                <select
                  id="matricula-grupo"
                  value={grupoId}
                  onChange={(event) => setGrupoId(event.target.value)}
                  required
                  className="form-input"
                >
                  <option value="">Selecciona un grupo con cupo</option>
                  {gruposDisponibles.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.codigo} · {grupo.cuposDisponibles} cupos disponibles
                    </option>
                  ))}
                </select>
                {gruposDisponibles.length === 0 && (
                  <p className="mt-1 text-xs text-muted">No hay grupos disponibles con cupo.</p>
                )}
              </div>
              <div>
                <label htmlFor="matricula-tipo" className="field-label">Tipo de matrícula</label>
                <select id="matricula-tipo" value={tipoMatricula} onChange={(event) => setTipoMatricula(event.target.value as TipoMatricula)} className="form-input">
                  <option value="REGULAR">Regular</option>
                  <option value="EXTENSIVA">Extensiva</option>
                </select>
              </div>
              <div>
                <label htmlFor="matricula-valor" className="field-label">Valor acordado</label>
                <input id="matricula-valor" type="number" min="0" step="0.01" value={valorAcordado} onChange={(event) => setValorAcordado(event.target.value)} className="form-input" placeholder="Opcional" />
              </div>
              <div>
                <label htmlFor="matricula-descuento" className="field-label">Descuento aplicado</label>
                <input id="matricula-descuento" type="number" min="0" step="0.01" value={descuentoAplicado} onChange={(event) => setDescuentoAplicado(event.target.value)} className="form-input" />
              </div>
              <div>
                <label htmlFor="matricula-modo-pago" className="field-label">Modo de pago</label>
                <select id="matricula-modo-pago" value={modoPago} onChange={(event) => setModoPago(event.target.value as ModoPagoMatricula | "")} className="form-input">
                  <option value="">Sin definir</option>
                  <option value="CONTADO">Contado</option>
                  <option value="CUOTAS">Cuotas</option>
                </select>
              </div>
              <div>
                <label htmlFor="matricula-estado-pago" className="field-label">Estado de pago</label>
                <select id="matricula-estado-pago" value={estadoPago} onChange={(event) => setEstadoPago(event.target.value as EstadoPagoMatricula)} className="form-input">
                  <option value="NO_PAGO">No pago</option>
                  <option value="PAGO">Pago</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="matricula-observaciones" className="field-label">Observaciones</label>
                <textarea id="matricula-observaciones" value={observaciones} onChange={(event) => setObservaciones(event.target.value)} rows={3} className="form-input" />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || estudiantesRegistrables.length === 0 || gruposDisponibles.length === 0}
              className="primary-btn disabled:opacity-50"
            >
              {isSubmitting ? "Registrando..." : "Registrar matrícula"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
