import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { extraerMensajeError } from "../../../api/apiError";
import { useCursos } from "../hooks/useCursos";
import type { Curso, CursoPayload } from "../curso.types";
import { CursoForm } from "./CursoForm";

export function DetalleCursoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    obtenerDetalleCurso,
    ejecutarActualizarCurso,
    ejecutarCambiarEstado,
    isSubmitting,
    errorAccion,
    mensajeExito,
  } = useCursos({ cargarListado: false });
  const [curso, setCurso] = useState<Curso | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorCargando, setErrorCargando] = useState("");
  const [editando, setEditando] = useState(false);

  const cargarDetalle = useCallback(async () => {
    if (!id) {
      setErrorCargando("No se proporcionó el ID del curso.");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setErrorCargando("");
      setCurso(await obtenerDetalleCurso(id));
    } catch (requestError: unknown) {
      setErrorCargando(extraerMensajeError(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [id, obtenerDetalleCurso]);

  useEffect(() => {
    void cargarDetalle();
  }, [cargarDetalle]);

  const guardarCambios = async (payload: CursoPayload) => {
    if (!id) return;
    const actualizado = await ejecutarActualizarCurso(id, payload);
    if (!actualizado) return;
    setCurso(actualizado);
    setEditando(false);
  };

  const cambiarEstado = async () => {
    if (!curso) return;
    const actualizado = await ejecutarCambiarEstado(curso);
    if (!actualizado) return;
    setCurso({ ...curso, ...actualizado });
  };

  if (isLoading) {
    return <main className="mx-auto max-w-4xl p-6 text-sm text-muted">Cargando curso...</main>;
  }

  if (!curso) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 p-6">
        <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">
          {errorCargando || "No se encontró el curso."}
        </p>
        <button type="button" onClick={() => navigate("/cursos")} className="outline-btn">
          Volver a cursos
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow mb-1">Curso {curso.codigo}</p>
          <h1 className="page-title">{editando ? "Editar curso" : curso.nombre}</h1>
          {!editando && <p className="mt-2 text-sm text-muted">Nivel {curso.nivel}</p>}
        </div>
        <button type="button" onClick={() => navigate("/cursos")} className="outline-btn">
          Volver al listado
        </button>
      </header>

      {errorAccion && (
        <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">
          {errorAccion}
        </p>
      )}
      {mensajeExito && (
        <p role="status" className="rounded-lg bg-green-soft p-4 text-sm text-green">
          {mensajeExito}
        </p>
      )}
      {errorCargando && (
        <p role="alert" className="rounded-lg bg-error-soft p-4 text-sm text-error">
          {errorCargando}
        </p>
      )}

      {editando ? (
        <section className="card p-5 sm:p-6">
          <CursoForm
            key={curso.id}
            initialValues={{
              nombre: curso.nombre,
              nivel: curso.nivel,
              descripcion: curso.descripcion,
              duracionSemanas: curso.duracionSemanas,
              intensidadSemanal: curso.intensidadSemanal,
              habilidades: curso.habilidades ?? [],
            }}
            submitLabel="Guardar cambios"
            isSubmitting={isSubmitting}
            onSubmit={guardarCambios}
          />
          <button
            type="button"
            onClick={() => setEditando(false)}
            disabled={isSubmitting}
            className="outline-btn mt-3"
          >
            Cancelar edición
          </button>
        </section>
      ) : (
        <>
          <section className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <div><p className="field-label">Estado</p><p>{curso.estado}</p></div>
            <div><p className="field-label">Duración</p><p>{curso.duracionSemanas} semanas</p></div>
            <div><p className="field-label">Intensidad semanal</p><p>{curso.intensidadSemanal}</p></div>
            <div>
              <p className="field-label">Habilidades</p>
              <p>{(curso.habilidades ?? []).join(", ") || "Sin habilidades registradas"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="field-label">Descripción</p>
              <p className="whitespace-pre-wrap">{curso.descripcion || "Sin descripción."}</p>
            </div>
          </section>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setEditando(true)} className="primary-btn">
              Editar curso
            </button>
            <button
              type="button"
              onClick={() => void cambiarEstado()}
              disabled={isSubmitting}
              className="outline-btn disabled:opacity-50"
            >
              {isSubmitting
                ? "Actualizando..."
                : curso.estado === "ACTIVO"
                  ? "Inactivar curso"
                  : "Activar curso"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
