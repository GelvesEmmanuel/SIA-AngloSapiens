import { useState, type FormEvent } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { extraerMensajeError } from "../../../api/apiError";
import { useAuth } from "../../auth/useAuth";
import { buscarEstudianteHistorialService } from "../gestionAcademica.service";
import { useHistorial } from "../hooks/useHistorial";

export interface VistaHistorialProps {
  estudianteId?: string;
  incluirNoFinalizadas?: boolean;
}

const formatoFecha = (fecha: string | null) => {
  if (!fecha) return "—";

  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return fecha;

  return new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(valor);
};

const formatoNota = (nota: number | string | null) => {
  if (nota === null) return "—";
  const valor = Number(nota);
  return Number.isFinite(valor) ? valor.toFixed(2) : nota;
};

const Campo = ({ etiqueta, valor }: { etiqueta: string; valor: string | number }) => (
  <div>
    <dt className="text-xs font-medium text-muted">{etiqueta}</dt>
    <dd className="mt-1 break-words text-sm text-heading">{valor}</dd>
  </div>
);

export const VistaHistorialAcademico = ({
  estudianteId: estudianteIdProp,
  incluirNoFinalizadas = false,
}: VistaHistorialProps) => {
  const { estudianteId: estudianteIdParam } = useParams<{ estudianteId?: string }>();
  const [searchParams] = useSearchParams();
  const { activeRole } = useAuth();
  const esGestor = [
    "SUPER_ADMIN",
    "COORD_ACADEMICO",
    "COORD_ADMINISTRATIVO",
  ].includes(activeRole ?? "");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [estudianteSeleccionadoId, setEstudianteSeleccionadoId] = useState<string | null>(null);
  const [busquedaIniciada, setBusquedaIniciada] = useState(false);
  const [buscandoEstudiante, setBuscandoEstudiante] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const estudianteIdDeRuta =
    estudianteIdProp ??
    estudianteIdParam ??
    searchParams.get("estudianteId") ??
    undefined;
  const estudianteIdResuelto =
    estudianteSeleccionadoId ??
    (busquedaIniciada && esGestor ? undefined : estudianteIdDeRuta);

  const {
    estudiante,
    historial,
    totalRegistros,
    cargando,
    error,
    refetch,
  } = useHistorial(estudianteIdResuelto, {
    incluirNoFinalizadas,
    autoFetch: !esGestor || Boolean(estudianteIdResuelto),
  });

  const buscarEstudiante = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const documento = numeroDocumento.trim();

    if (!documento) {
      setErrorBusqueda("Ingresa el número de documento del estudiante.");
      return;
    }

    setBusquedaIniciada(true);
    setEstudianteSeleccionadoId(null);
    setBuscandoEstudiante(true);
    setErrorBusqueda(null);

    try {
      const resultado = await buscarEstudianteHistorialService(documento);
      setEstudianteSeleccionadoId(resultado.id);
    } catch (requestError: unknown) {
      setErrorBusqueda(extraerMensajeError(requestError));
    } finally {
      setBuscandoEstudiante(false);
    }
  };

  return (
    <section className="space-y-5">
      <header>
        <p className="eyebrow mb-2">Gestión académica</p>
        <h2 className="section-title">Historial académico</h2>
        {esGestor && (
          <p className="mt-1 text-sm text-muted">
            Busca al estudiante por su número de documento para consultar su historial.
          </p>
        )}
        {estudiante && (!esGestor || estudianteIdResuelto) && (
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Estudiante" valor={`${estudiante.nombre} ${estudiante.apellidos}`} />
            <Campo etiqueta="Código de estudiante" valor={estudiante.codigo} />
            <Campo etiqueta="Documento de identidad" valor={estudiante.numeroDocumento} />
            <Campo etiqueta="Registros académicos" valor={totalRegistros} />
          </dl>
        )}
      </header>

      {esGestor && (
        <form onSubmit={buscarEstudiante} className="card grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <label htmlFor="documento-estudiante-historial" className="field-label">
              Documento de identidad
            </label>
            <input
              id="documento-estudiante-historial"
              type="search"
              value={numeroDocumento}
              onChange={(event) => {
                setNumeroDocumento(event.target.value);
                setErrorBusqueda(null);
              }}
              placeholder="Escribe el número de documento"
              className="form-input"
              required
            />
          </div>
          <button type="submit" className="primary-btn" disabled={buscandoEstudiante}>
            {buscandoEstudiante ? "Buscando..." : "Buscar historial"}
          </button>
        </form>
      )}

      {errorBusqueda && (
        <div role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">
          {errorBusqueda}
        </div>
      )}

      {buscandoEstudiante ? (
        <div role="status" className="card p-8 text-center text-sm text-muted">
          Buscando estudiante...
        </div>
      ) : cargando ? (
        <div role="status" className="card p-8 text-center text-sm text-muted">
          Cargando historial académico...
        </div>
      ) : error ? (
        <div role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">
          <p>{error}</p>
          <button type="button" onClick={() => void refetch()} className="mt-2 font-semibold underline">
            Reintentar
          </button>
        </div>
      ) : esGestor && !estudianteIdResuelto ? (
        <div className="card p-6 text-sm text-muted">
          Ingresa un documento de identidad y selecciona “Buscar historial”.
        </div>
      ) : historial.length === 0 ? (
        <div className="card p-6 text-sm text-muted">
          {estudiante
            ? `${estudiante.nombre} ${estudiante.apellidos} aún no tiene registros en su historial académico.`
            : "No hay registros académicos para mostrar."}
        </div>
      ) : (
        <div className="space-y-4">
          {historial.map((item) => (
            <article key={item.matricula.id} className="card overflow-hidden">
              <header className="border-b border-border p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {item.curso.codigo} · {item.periodo.nombre}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-heading">{item.curso.nombre}</h3>
                  </div>
                  <span className="badge">{item.matricula.estadoMatricula.replaceAll("_", " ")}</span>
                </div>
              </header>

              <div className="space-y-5 p-5">
                <section aria-label="Datos de matrícula">
                  <h4 className="mb-3 text-sm font-semibold text-heading">Matrícula</h4>
                  <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    
                    <Campo etiqueta="Código" valor={item.matricula.codigo} />
                    <Campo etiqueta="Tipo" valor={item.matricula.tipoMatricula} />
                    <Campo etiqueta="Estado de matrícula" valor={item.matricula.estadoMatricula} />
                    <Campo etiqueta="Estado de pago" valor={item.matricula.estadoPago} />
                    <Campo etiqueta="Notas publicadas" valor={item.matricula.notasPublicadas ? "Sí" : "No"} />
                    <Campo etiqueta="Fecha de matrícula" valor={formatoFecha(item.matricula.fechaMatricula)} />
                    <Campo etiqueta="Fecha de finalización" valor={formatoFecha(item.matricula.fechaFinalizacion)} />
                  </dl>
                </section>

                <section aria-label="Datos del período">
                  <h4 className="mb-3 text-sm font-semibold text-heading">Período académico</h4>
                  <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                   
                    <Campo etiqueta="Nombre" valor={item.periodo.nombre} />
                    <Campo etiqueta="Fecha de inicio" valor={formatoFecha(item.periodo.fechaInicio)} />
                    <Campo etiqueta="Fecha de fin" valor={formatoFecha(item.periodo.fechaFin)} />
                  </dl>
                </section>

                <section aria-label="Datos del curso">
                  <h4 className="mb-3 text-sm font-semibold text-heading">Curso</h4>
                  <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    
                    <Campo etiqueta="Código" valor={item.curso.codigo} />
                    <Campo etiqueta="Nombre" valor={item.curso.nombre} />
                    <Campo etiqueta="Nivel" valor={item.curso.nivel ?? "—"} />
                    <Campo etiqueta="Habilidades configuradas" valor={item.curso.totalHabilidadesConfiguradas} />
                  </dl>
                </section>

                <section aria-label="Datos del grupo">
                  <h4 className="mb-3 text-sm font-semibold text-heading">Grupo</h4>
                  <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                   
                    <Campo etiqueta="Código" valor={item.grupo.codigo} />
                    <Campo etiqueta="Fecha de inicio" valor={formatoFecha(item.grupo.fechaInicio)} />
                    <Campo etiqueta="Fecha de fin" valor={formatoFecha(item.grupo.fechaFin)} />
                  </dl>
                </section>

                <section aria-label="Calificaciones">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-heading">Calificaciones</h4>
                    <span className="text-xs text-muted">
                      {item.calificaciones.visible ? "Visibles" : "Aún no publicadas"}
                    </span>
                  </div>
                  {item.calificaciones.visible ? (
                    <div className="space-y-4">
                      <dl className="grid gap-4 sm:grid-cols-3">
                        <Campo
                          etiqueta="Promedio de habilidades"
                          valor={formatoNota(item.calificaciones.promedioHabilidades)}
                        />
                        <Campo
                          etiqueta="Nota del examen final"
                          valor={formatoNota(item.calificaciones.notaExamenFinal)}
                        />
                        <Campo
                          etiqueta="Nota final"
                          valor={formatoNota(item.calificaciones.notaFinal)}
                        />
                      </dl>
                      {item.calificaciones.notasPorHabilidad.length > 0 ? (
                        <div className="overflow-x-auto rounded-lg border border-border">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-navy-soft text-xs text-heading">
                              <tr>
                                <th className="px-4 py-3 font-semibold">Habilidad</th>
                                <th className="px-4 py-3 font-semibold">Calificación</th>
                                
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {item.calificaciones.notasPorHabilidad.map((nota) => (
                                <tr key={nota.id}>
                                  <td className="px-4 py-3 text-heading">{nota.habilidad}</td>
                                  <td className="px-4 py-3 text-heading">{formatoNota(nota.nota)}</td>
                                  
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted">No hay calificaciones por habilidad registradas.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">
                      Las calificaciones se mostrarán cuando sean publicadas.
                    </p>
                  )}
                </section>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
