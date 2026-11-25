import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { extraerMensajeError } from "../../../api/apiError";
import { usePermissions } from "../../../api/permissions/usePermissions";
import {
  listarGruposAsignadosDocente,
  listarMisGrupos,
} from "../gestionAcademica.service";
import type { GrupoDocente, GrupoMatriculado } from "../gestionAcademica.types";

const MENSAJE_ACCESO_DENEGADO =
  "No tienes permiso para consultar los grupos académicos.";

export function useGruposAcademicos() {
  const { activeRole, permissions } = usePermissions();
  const [gruposDocente, setGruposDocente] = useState<GrupoDocente[]>([]);
  const [gruposMatriculados, setGruposMatriculados] = useState<GrupoMatriculado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [reload, setReload] = useState(0);

  const recargarGrupos = useCallback(() => {
    setReload((actual) => actual + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const cargarGrupos = async () => {
      setIsLoading(true);
      setError("");
      setIsAccessDenied(false);

      const rolSoportado = activeRole === "DOCENTE" || activeRole === "ESTUDIANTE";
      if (!rolSoportado || !permissions.includes("groups:read")) {
        setGruposDocente([]);
        setGruposMatriculados([]);
        setIsAccessDenied(true);
        setError(MENSAJE_ACCESO_DENEGADO);
        setIsLoading(false);
        return;
      }

      try {
        if (activeRole === "DOCENTE") {
          const response = await listarGruposAsignadosDocente();
          if (!isMounted) return;
          setGruposDocente(response.data);
          setGruposMatriculados([]);
        } else {
          const response = await listarMisGrupos();
          if (!isMounted) return;
          setGruposMatriculados(response.data);
          setGruposDocente([]);
        }
      } catch (requestError: unknown) {
        if (!isMounted) return;

        const accesoDenegado =
          axios.isAxiosError(requestError) && requestError.response?.status === 403;
        setIsAccessDenied(accesoDenegado);
        setError(
          accesoDenegado
            ? MENSAJE_ACCESO_DENEGADO
            : extraerMensajeError(requestError),
        );
        setGruposDocente([]);
        setGruposMatriculados([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void cargarGrupos();
    return () => {
      isMounted = false;
    };
  }, [activeRole, permissions, reload]);

  return {
    gruposDocente,
    gruposMatriculados,
    isLoading,
    error,
    isAccessDenied,
    recargarGrupos,
  };
}
