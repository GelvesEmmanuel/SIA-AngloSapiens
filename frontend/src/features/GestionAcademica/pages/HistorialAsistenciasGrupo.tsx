import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { extraerMensajeError } from "../../../api/apiError";
import {
  obtenerHistorialInasistenciasGrupo,
  type HistorialInasistenciasGrupoResponse,
} from "../asistencia.service";

interface HistorialAsistenciasGrupoProps {
  grupoId?: string;
  embebido?: boolean;
}

export function HistorialAsistenciasGrupo({
  grupoId: grupoIdProp,
  embebido = false,
}: HistorialAsistenciasGrupoProps = {}) {
  const { id: grupoIdRuta } = useParams<{ id: string }>();
  const grupoId = grupoIdProp ?? grupoIdRuta;
  const navigate = useNavigate();
  const [historial, setHistorial] =
    useState<HistorialInasistenciasGrupoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let vigente = true;

    const cargarHistorial = async () => {
      if (!grupoId) {
        setError("No se especificó el grupo.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const respuesta = await obtenerHistorialInasistenciasGrupo(grupoId);
        if (vigente) setHistorial(respuesta);
      } catch (requestError: unknown) {
        if (vigente) {
          setHistorial(null);
          setError(extraerMensajeError(requestError));
        }
      } finally {
        if (vigente) setIsLoading(false);
      }
    };

    void cargarHistorial();
    return () => {
      vigente = false;
    };
  }, [grupoId, reload]);

  return (
    <section className="space-y-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          {!embebido && <p className="eyebrow mb-2">Gestión académica</p>}
          <h2 className="section-title">Historial de inasistencias</h2>
          <p className="mt-1 text-sm text-muted">
            Consulta las ausencias registradas y sus fechas para este grupo.
          </p>
        </div>
        {!embebido && (
          <button
            type="button"
            onClick={() => navigate("/gestion-academica")}
            className="outline-btn"
          >
            Volver a mis grupos
          </button>
        )}
      </header>

      {error && (
        <div role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setReload((actual) => actual + 1)}
            className="mt-2 font-semibold underline"
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      <section className="card overflow-hidden">
        <div className="border-b border-border p-4 sm:p-5">
          <h3 className="section-title">Ausencias registradas</h3>
          {!isLoading && historial && (
            <p className="mt-1 text-xs text-muted">
              {historial.totalInasistencias}{" "}
              {historial.totalInasistencias === 1 ? "inasistencia" : "inasistencias"}
            </p>
          )}
        </div>

        {isLoading ? (
          <p role="status" className="p-8 text-center text-sm text-muted">
            Cargando historial...
          </p>
        ) : historial?.inasistencias.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="table-header">
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Código</th>
                  <th className="px-5 py-3">Estudiante</th>
                  <th className="px-5 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historial.inasistencias.map((inasistencia) => (
                  <tr key={inasistencia.asistenciaId}>
                    <td className="px-5 py-4 text-sm text-body">
                      {new Date(`${inasistencia.fechaClase}T00:00:00`).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-navy">
                      {inasistencia.estudianteCodigo}
                    </td>
                    <td className="px-5 py-4 text-sm text-body">
                      {inasistencia.estudianteNombre} {inasistencia.estudianteApellidos}
                    </td>
                    <td className="px-5 py-4 text-sm text-body">
                      {inasistencia.motivoInasistencia || "No especificado"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-8 text-center text-sm text-muted">
            {error
              ? "No se pudo cargar el historial."
              : "Este grupo aún no tiene inasistencias registradas."}
          </p>
        )}
      </section>
    </section>
  );
}
