import { useCallback, useEffect, useState } from "react";
import { extraerMensajeError } from "../../../api/apiError";
import {
  cambiarPublicacionNotas,
  consultarNotasMatricula,
  registrarNotaExamenFinal,
  registrarNotasHabilidades,
} from "../notas.service";
import type { NotaHabilidadPayload, NotasMatricula } from "../notas.types";

export function useNotas(matriculaId: string) {
  const [notasMatricula, setNotasMatricula] = useState<NotasMatricula | null>(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cargarNotas = useCallback(async () => {
    if (!matriculaId) {
      setNotasMatricula(null);
      setCargando(false);
      return false;
    }

    setCargando(true);
    setError("");
    try {
      const datos = await consultarNotasMatricula(matriculaId);
      setNotasMatricula(datos);
      return true;
    } catch (requestError: unknown) {
      setNotasMatricula(null);
      setError(extraerMensajeError(requestError));
      return false;
    } finally {
      setCargando(false);
    }
  }, [matriculaId]);

  useEffect(() => {
    let vigente = true;

    const cargar = async () => {
      if (!matriculaId) {
        setNotasMatricula(null);
        setCargando(false);
        setError("");
        return;
      }

      setCargando(true);
      setError("");
      try {
        const datos = await consultarNotasMatricula(matriculaId);
        if (vigente) setNotasMatricula(datos);
      } catch (requestError: unknown) {
        if (!vigente) return;
        setNotasMatricula(null);
        setError(extraerMensajeError(requestError));
      } finally {
        if (vigente) setCargando(false);
      }
    };

    void cargar();
    return () => {
      vigente = false;
    };
  }, [matriculaId]);

  const guardarHabilidades = useCallback(
    async (notas: NotaHabilidadPayload[]) => {
      if (!matriculaId || notas.length === 0) return false;
      setGuardando(true);
      setError("");
      try {
        await registrarNotasHabilidades(matriculaId, notas);
        return await cargarNotas();
      } catch (requestError: unknown) {
        setError(extraerMensajeError(requestError));
        return false;
      } finally {
        setGuardando(false);
      }
    },
    [cargarNotas, matriculaId],
  );

  const guardarExamenFinal = useCallback(
    async (notaExamenFinal: number) => {
      if (!matriculaId) return false;
      setGuardando(true);
      setError("");
      try {
        await registrarNotaExamenFinal(matriculaId, notaExamenFinal);
        return await cargarNotas();
      } catch (requestError: unknown) {
        setError(extraerMensajeError(requestError));
        return false;
      } finally {
        setGuardando(false);
      }
    },
    [cargarNotas, matriculaId],
  );

  const cambiarPublicacion = useCallback(
    async (notasPublicadas: boolean) => {
      if (!matriculaId) return false;
      setGuardando(true);
      setError("");
      try {
        await cambiarPublicacionNotas(matriculaId, notasPublicadas);
        return await cargarNotas();
      } catch (requestError: unknown) {
        setError(extraerMensajeError(requestError));
        return false;
      } finally {
        setGuardando(false);
      }
    },
    [cargarNotas, matriculaId],
  );

  return {
    notasMatricula,
    cargando,
    guardando,
    error,
    guardarHabilidades,
    guardarExamenFinal,
    cambiarPublicacion,
    recargar: cargarNotas,
  };
}
