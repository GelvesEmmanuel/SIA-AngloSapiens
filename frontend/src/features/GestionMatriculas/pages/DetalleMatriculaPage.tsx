import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMatricula } from "../hooks/useMatricula";
import type {
  ActualizarMatriculaPayload,
  EstadoMatricula,
  EstadoPagoMatricula,
  TipoMatricula,
} from "../matricula.types";

export function DetalleMatriculaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    matricula,
    estudiantes,
    grupos,
    isLoading,
    isSubmitting,
    error,
    errorAccion,
    mensaje,
    ejecutarActualizar,
    ejecutarCambiarEstado,
  } = useMatricula({ cargarListado: false, matriculaId: id });
  const [editando, setEditando] = useState(false);

  const guardarCambios = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!matricula) return;
    const formData = new FormData(event.currentTarget);
    const valor = formData.get("valorAcordado");
    const descuento = formData.get("descuentoAplicado");
    const tipo = formData.get("tipoMatricula");
    const pago = formData.get("estadoPago");
    const modo = formData.get("modoPago");
    const observaciones = formData.get("observaciones");
    const payload: ActualizarMatriculaPayload = {
      tipoMatricula: tipo as TipoMatricula,
      valorAcordado: typeof valor === "string" && valor !== "" ? Number(valor) : null,
      descuentoAplicado: typeof descuento === "string" && descuento !== "" ? Number(descuento) : null,
      modoPago: modo === "CONTADO" || modo === "CUOTAS" ? modo : null,
      estadoPago: pago as EstadoPagoMatricula,
      observaciones: typeof observaciones === "string" ? observaciones.trim() || null : null,
    };
    const actualizado = await ejecutarActualizar(matricula.id, payload);
    if (actualizado) setEditando(false);
  };

  const cambiarEstado = async (estado: Exclude<EstadoMatricula, "ACTIVA">) => {
    if (!matricula) return;
    const confirmado = window.confirm(
      estado === "CANCELADA"
        ? "¿Deseas cancelar esta matrícula? El cupo del grupo será liberado."
        : "¿Deseas finalizar esta matrícula?",
    );
    if (confirmado) await ejecutarCambiarEstado(matricula.id, estado);
  };

  if (isLoading) {
    return <main className="mx-auto max-w-4xl p-6 text-sm text-muted">Cargando matrícula...</main>;
  }
  if (!matricula) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">{error || "No se encontró la matrícula."}</p>
        <button type="button" onClick={() => navigate("/matriculas")} className="outline-btn">Volver a matrículas</button>
      </main>
    );
  }

  const estudiante = estudiantes.find((item) => item.id === matricula.estudianteId);
  const grupo = grupos.find((item) => item.id === matricula.grupoId);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow mb-1">Matrícula {matricula.codigo}</p>
          <h1 className="page-title">
            {estudiante ? `${estudiante.nombre} ${estudiante.apellidos}` : "Detalle de matrícula"}
          </h1>
          <p className="mt-2 text-sm text-muted">{grupo?.codigo ?? "Grupo no disponible"}</p>
        </div>
        <button type="button" onClick={() => navigate("/matriculas")} className="outline-btn">
          Volver al listado
        </button>
      </header>

      {errorAccion && <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">{errorAccion}</p>}
      {mensaje && <p role="status" className="rounded-lg bg-green-soft p-4 text-sm text-green">{mensaje}</p>}
      {error && <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">{error}</p>}

      {editando && matricula.estadoMatricula === "ACTIVA" ? (
        <section className="card p-5 sm:p-6">
          <form onSubmit={guardarCambios} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="editar-tipo-matricula" className="field-label">Tipo de matrícula</label>
                <select id="editar-tipo-matricula" name="tipoMatricula" defaultValue={matricula.tipoMatricula} className="form-input">
                  <option value="REGULAR">Regular</option>
                  <option value="EXTENSIVA">Extensiva</option>
                </select>
              </div>
              <div>
                <label htmlFor="editar-valor-matricula" className="field-label">Valor acordado</label>
                <input id="editar-valor-matricula" name="valorAcordado" type="number" min="0" step="0.01" defaultValue={matricula.valorAcordado ?? ""} className="form-input" />
              </div>
              <div>
                <label htmlFor="editar-descuento-matricula" className="field-label">Descuento aplicado</label>
                <input id="editar-descuento-matricula" name="descuentoAplicado" type="number" min="0" step="0.01" defaultValue={matricula.descuentoAplicado ?? ""} className="form-input" />
              </div>
              <div>
                <label htmlFor="editar-modo-pago" className="field-label">Modo de pago</label>
                <select id="editar-modo-pago" name="modoPago" defaultValue={matricula.modoPago ?? ""} className="form-input">
                  <option value="">Sin definir</option>
                  <option value="CONTADO">Contado</option>
                  <option value="CUOTAS">Cuotas</option>
                </select>
              </div>
              <div>
                <label htmlFor="editar-estado-pago" className="field-label">Estado de pago</label>
                <select id="editar-estado-pago" name="estadoPago" defaultValue={matricula.estadoPago} className="form-input">
                  <option value="NO_PAGO">No pago</option>
                  <option value="PAGO">Pago</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="editar-observaciones" className="field-label">Observaciones</label>
                <textarea id="editar-observaciones" name="observaciones" defaultValue={matricula.observaciones ?? ""} rows={3} className="form-input" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={isSubmitting} className="primary-btn disabled:opacity-50">
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </button>
              <button type="button" onClick={() => setEditando(false)} disabled={isSubmitting} className="outline-btn">
                Cancelar edición
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          <section className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <div><p className="field-label">Estado</p><p><span className={matricula.estadoMatricula === "ACTIVA" ? "badge badge-green" : matricula.estadoMatricula === "CANCELADA" ? "badge badge-red" : "badge"}>{matricula.estadoMatricula}</span></p></div>
            <div><p className="field-label">Tipo</p><p>{matricula.tipoMatricula}</p></div>
            <div><p className="field-label">Fecha de matrícula</p><p>{matricula.fechaMatricula}</p></div>
            <div><p className="field-label">Estado de pago</p><p>{matricula.estadoPago}</p></div>
            <div><p className="field-label">Modo de pago</p><p>{matricula.modoPago ?? "Sin definir"}</p></div>
            <div><p className="field-label">Valor acordado</p><p>{matricula.valorAcordado ?? "No definido"}</p></div>
            <div><p className="field-label">Descuento aplicado</p><p>{matricula.descuentoAplicado ?? "No definido"}</p></div>
            {matricula.fechaCancelacion && <div><p className="field-label">Fecha de cancelación</p><p>{matricula.fechaCancelacion}</p></div>}
            {matricula.fechaFinalizacion && <div><p className="field-label">Fecha de finalización</p><p>{matricula.fechaFinalizacion}</p></div>}
            <div className="sm:col-span-2"><p className="field-label">Observaciones</p><p className="whitespace-pre-wrap">{matricula.observaciones || "Sin observaciones"}</p></div>
          </section>

          {matricula.estadoMatricula === "ACTIVA" && (
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setEditando(true)} className="primary-btn">Editar datos</button>
              <button type="button" onClick={() => void cambiarEstado("CANCELADA")} disabled={isSubmitting} className="outline-btn disabled:opacity-50">
                Cancelar matrícula
              </button>
              <button type="button" onClick={() => void cambiarEstado("FINALIZADA")} disabled={isSubmitting} className="outline-btn disabled:opacity-50">
                Finalizar matrícula
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
