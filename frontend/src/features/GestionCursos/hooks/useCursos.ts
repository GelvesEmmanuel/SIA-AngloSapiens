import { useCallback, useEffect, useState } from "react";
import { extraerMensajeError } from "../../../api/apiError";
import {
  activarCurso,
  actualizarCurso,
  inactivarCurso,
  listarCursos,
  obtenerCursoPorId,
  registrarCurso,
} from "../curso.service";
import type {
  ActualizarCursoPayload,
  Curso,
  CursoPayload,
  EstadoCurso,
  ListarCursosParams,
} from "../curso.types";

interface UseCursosOptions {
  cargarListado?: boolean;
}

export function useCursos({ cargarListado = true }: UseCursosOptions = {}) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoCurso | "">("");
  const [isLoading, setIsLoading] = useState(cargarListado);
  const [error, setError] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reload, setReload] = useState(0);
  const [busquedaDebounced, setBusquedaDebounced] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setBusquedaDebounced(busqueda.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [busqueda]);

  const recargarCursos = useCallback(() => {
    setReload((actual) => actual + 1);
  }, []);

  useEffect(() => {
    if (!cargarListado) return;

    let isMounted = true;
    const cargarCursos = async () => {
      try {
        setIsLoading(true);
        setError("");
        const filtros: ListarCursosParams = {
          busqueda: busquedaDebounced || undefined,
          estado: estado || undefined,
        };
        const response = await listarCursos(filtros);
        if (isMounted) {
          setCursos(response.data);
        }
      } catch (requestError: unknown) {
        if (isMounted) {
          setError(extraerMensajeError(requestError));
          setCursos([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void cargarCursos();
    return () => {
      isMounted = false;
    };
  }, [busquedaDebounced, cargarListado, estado, reload]);

  const obtenerDetalleCurso = useCallback(async (cursoId: string) => {
    try {
      setErrorAccion("");
      const response = await obtenerCursoPorId(cursoId);
      return response.data;
    } catch (requestError: unknown) {
      setErrorAccion(extraerMensajeError(requestError));
      throw requestError;
    }
  }, []);

  const ejecutarRegistrarCurso = async (payload: CursoPayload) => {
    try {
      setIsSubmitting(true);
      setErrorAccion("");
      setMensajeExito("");
      const response = await registrarCurso(payload);
      setMensajeExito(response.message);
      return response.data;
    } catch (requestError: unknown) {
      setErrorAccion(extraerMensajeError(requestError));
        return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const ejecutarActualizarCurso = async (
    cursoId: string,
    payload: ActualizarCursoPayload,
  ) => {
    try {
      setIsSubmitting(true);
      setErrorAccion("");
      setMensajeExito("");
      const response = await actualizarCurso(cursoId, payload);
      setMensajeExito(response.message);
      return response.data;
    } catch (requestError: unknown) {
      setErrorAccion(extraerMensajeError(requestError));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const ejecutarCambiarEstado = async (curso: Curso) => {
    try {
      setIsSubmitting(true);
      setErrorAccion("");
      setMensajeExito("");
      const response =
        curso.estado === "ACTIVO"
          ? await inactivarCurso(curso.id)
          : await activarCurso(curso.id);
      setMensajeExito(response.message);
      return response.data;
    } catch (requestError: unknown) {
      setErrorAccion(extraerMensajeError(requestError));
    return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    cursos,
    busqueda,
    setBusqueda,
    estado,
    setEstado,
    isLoading,
    error,
    errorAccion,
    mensajeExito,
    isSubmitting,
    recargarCursos,
    obtenerDetalleCurso,
    ejecutarRegistrarCurso,
    ejecutarActualizarCurso,
    ejecutarCambiarEstado,
  };
}