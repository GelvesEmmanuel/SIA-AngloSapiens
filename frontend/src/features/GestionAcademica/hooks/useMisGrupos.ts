import { useCallback, useEffect, useState } from "react";
import { extraerMensajeError } from "../../../api/apiError";
import { listarMisGrupos } from "../gestionAcademica.service";
import type { GrupoMatriculado } from "../gestionAcademica.types";

export function useMisGrupos() {
  const [grupos, setGrupos] = useState<GrupoMatriculado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  const recargarGrupos = useCallback(() => {
    setReload((actual) => actual + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const cargarGrupos = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await listarMisGrupos();
        if (isMounted) setGrupos(response.data);
      } catch (requestError: unknown) {
        if (isMounted) {
          setError(extraerMensajeError(requestError));
          setGrupos([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void cargarGrupos();
    return () => {
      isMounted = false;
    };
  }, [reload]);

  return { grupos, isLoading, error, recargarGrupos };
}
