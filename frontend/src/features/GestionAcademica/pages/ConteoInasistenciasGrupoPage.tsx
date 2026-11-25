import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { extraerMensajeError } from "../../../api/apiError";
import { listarEstudiantesPorGrupo } from "../../GestionGrupos/grupo.service";
import type { EstudianteMatriculadoGrupo } from "../../GestionGrupos/grupo.types";
import {
  obtenerConteoInasistenciasGrupo,
  type ConteoInasistenciasGrupoResponse,
} from "../asistencia.service";

interface ConteoInasistenciasGrupoPageProps {
  grupoId?: string;
  embebido?: boolean;
}

export function ConteoInasistenciasGrupoPage({
  grupoId: grupoIdProp,
  embebido = false,
}: ConteoInasistenciasGrupoPageProps = {}) {
  const { id: grupoIdRuta } = useParams<{ id: string }>();
  const grupoId = grupoIdProp ?? grupoIdRuta;
  const navigate = useNavigate();
  const [conteo, setConteo] =
    useState<ConteoInasistenciasGrupoResponse | null>(null);
  const [estudiantes, setEstudiantes] = useState<EstudianteMatriculadoGrupo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let vigente = true;

    const cargarConteo = async () => {
      if (!grupoId) {
        setError("No se especificó el grupo.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const [respuestaConteo, respuestaEstudiantes] = await Promise.all([
          obtenerConteoInasistenciasGrupo(grupoId),
          listarEstudiantesPorGrupo(grupoId),
        ]);
        if (!vigente) return;
        setConteo(respuestaConteo);
        setEstudiantes(respuestaEstudiantes.data);
      } catch (requestError: unknown) {
        if (vigente) {
          setConteo(null);
          setEstudiantes([]);
          setError(extraerMensajeError(requestError));
        }
      } finally {
        if (vigente) setIsLoading(false);
      }
    };

    void cargarConteo();
    return () => {
      vigente = false;
    };
  }, [grupoId, reload]);

  const ausenciasTotales =
    conteo?.estudiantes.reduce((total, estudiante) => total + estudiante.totalInasistencias, 0) ?? 0;
  const conteoPorEstudiante = new Map(
    conteo?.estudiantes.map((estudiante) => [
      estudiante.estudianteId,
      estudiante.totalInasistencias,
    ]),
  );

  return (
    <section className="space-y-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          {!embebido && <p className="eyebrow mb-2">Gestión académica</p>}
          <h2 className="section-title">Conteo de inasistencias</h2>
          <p className="mt-1 text-sm text-muted">
            Revisa las ausencias acumuladas por estudiante en este grupo.
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

      {isLoading ? (
        <div role="status" className="card p-8 text-center text-sm text-muted">
          Cargando conteo de inasistencias...
        </div>
      ) : conteo && (
        <>
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="card p-4">
              <p className="text-xs font-semibold text-muted">Sesiones dictadas</p>
              <p className="mt-2 text-2xl font-bold text-navy">
                {conteo.totalSesionesDictadas}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-semibold text-muted">Inasistencias acumuladas</p>
              <p className="mt-2 text-2xl font-bold text-red">{ausenciasTotales}</p>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-border p-4 sm:p-5">
              <h3 className="section-title">Inasistencias por estudiante</h3>
              <p className="mt-1 text-xs text-muted">
                El conteo se muestra sobre {conteo.totalSesionesDictadas} sesiones dictadas.
              </p>
            </div>
            {estudiantes.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">
                No hay estudiantes matriculados en este grupo.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                  <thead>
                    <tr className="table-header">
                      <th className="px-5 py-3">Código</th>
                      <th className="px-5 py-3">Estudiante</th>
                      <th className="px-5 py-3">Inasistencias</th>
                      <th className="px-5 py-3">Sesiones dictadas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {estudiantes.map(({ matriculaId, estudiante }) => (
                      <tr key={matriculaId}>
                        <td className="px-5 py-4 text-sm font-medium text-navy">
                          {estudiante.codigo}
                        </td>
                        <td className="px-5 py-4 text-sm text-body">
                          {estudiante.nombre} {estudiante.apellidos}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-body">
                          {conteoPorEstudiante.get(estudiante.id) ?? 0}
                        </td>
                        <td className="px-5 py-4 text-sm text-body">
                          {conteo.totalSesionesDictadas}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
