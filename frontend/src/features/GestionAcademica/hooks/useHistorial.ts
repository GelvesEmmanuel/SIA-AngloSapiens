import { useCallback, useEffect, useState } from "react";
import {
  obtenerHistorialAcademicoEstudianteService,
  obtenerMiHistorialAcademicoService,
} from "../gestionAcademica.service";
import type {
  HistorialAcademicoResponse,
  ObtenerHistorialAcademicoParams,
} from "../historialAcademico.types";

export interface UseHistorialAcademicoEstudianteOptions
  extends ObtenerHistorialAcademicoParams {
  /** Ejecuta la consulta automáticamente al montar o cambiar dependencias. Por defecto: true */
  autoFetch?: boolean;
}

export const useHistorial = (
  estudianteId: string | undefined | null,
  options: UseHistorialAcademicoEstudianteOptions = {},
) => {
  const { incluirNoFinalizadas = false, autoFetch = true } = options;

  const [data, setData] = useState<HistorialAcademicoResponse | null>(null);
  const [cargando, setCargando] = useState<boolean>(
    Boolean(autoFetch),
  );
  const [error, setError] = useState<string | null>(null);

  const cargarHistorial = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);

      const resultado = estudianteId
        ? await obtenerHistorialAcademicoEstudianteService(estudianteId, {
            incluirNoFinalizadas,
          })
        : await obtenerMiHistorialAcademicoService({
            incluirNoFinalizadas,
          });

      setData(resultado);
    } catch (err: unknown) {
      let mensaje = "No se pudo cargar el historial académico del estudiante.";

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string; error?: string } } })
          .response?.data === "object"
      ) {
        const apiError = (
          err as { response: { data: { message?: string; error?: string } } }
        ).response.data;
        mensaje = apiError.message || apiError.error || mensaje;
      } else if (err instanceof Error) {
        mensaje = err.message;
      }

      setError(mensaje);
      setData(null);
    } finally {
      setCargando(false);
    }
  }, [estudianteId, incluirNoFinalizadas]);

  useEffect(() => {
    if (autoFetch) {
      void cargarHistorial();
    }
  }, [autoFetch, cargarHistorial]);

  return {
    data,
    estudiante: data?.estudiante ?? null,
    historial: data?.historial ?? [],
    totalRegistros: data?.totalRegistros ?? 0,
    cargando,
    error,
    refetch: cargarHistorial,
  };
};