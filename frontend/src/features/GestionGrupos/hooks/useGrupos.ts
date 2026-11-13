import { useCallback, useEffect, useState } from "react";
import { extraerMensajeError } from "../../../api/apiError";
import { listarAulas } from "../../GestionAulas/aula.service";
import type { Aula } from "../../GestionAulas/aula.types";
import { listarCursos } from "../../GestionCursos/curso.service";
import type { Curso } from "../../GestionCursos/curso.types";
import { listarDocentes } from "../../GestionDocentes/gestionDocente.service";
import type { Docente } from "../../GestionDocentes/docente.types";
import { listarPeriodos } from "../../GestionPeriodos/periodo.service";
import type { PeriodoAcademico } from "../../GestionPeriodos/periodo.types";
import {
  actualizarGrupo,
  cambiarDocenteGrupo,
  cambiarEstadoGrupo,
  cancelarGrupo,
  listarGrupos,
  obtenerGrupo,
  registrarGrupo,
} from "../grupo.service";
import type {
  EstadoGrupo,
  FiltrosGrupo,
  Grupo,
  GrupoPayload,
} from "../grupo.types";

interface UseGruposOptions {
  cargarListado?: boolean;
  grupoId?: string;
}

export function useGrupos({ cargarListado = true, grupoId }: UseGruposOptions = {}) {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [filtros, setFiltros] = useState<FiltrosGrupo>({});
  const [isLoading, setIsLoading] = useState(cargarListado || Boolean(grupoId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [reload, setReload] = useState(0);

  const recargarGrupos = useCallback(() => {
    setReload((actual) => actual + 1);
  }, []);

  useEffect(() => {
    const cargarCatalogos = cargarListado || Boolean(grupoId);
    if (!cargarListado && !grupoId) return;

    let isMounted = true;
    const cargarDatos = async () => {
      try {
        setIsLoading(true);
        setError("");
        const [gruposResponse, catalogosResponse, grupoResponse] = await Promise.all([
          cargarListado ? listarGrupos(filtros) : Promise.resolve(undefined),
          cargarCatalogos
            ? Promise.all([listarPeriodos(), listarCursos(), listarDocentes(), listarAulas()])
            : Promise.resolve(undefined),
          grupoId ? obtenerGrupo(grupoId) : Promise.resolve(undefined),
        ]);

        if (!isMounted) return;
        if (gruposResponse) setGrupos(gruposResponse.data);
        if (catalogosResponse) {
          const [periodosResponse, cursosResponse, docentesResponse, aulasResponse] =
            catalogosResponse;
          setPeriodos(periodosResponse.data);
          setCursos(cursosResponse.data);
          setDocentes(docentesResponse.data);
          setAulas(aulasResponse.data);
        }
        if (grupoResponse) setGrupo(grupoResponse.data);
      } catch (requestError: unknown) {
        if (!isMounted) return;
        setError(extraerMensajeError(requestError));
        if (cargarListado) setGrupos([]);
        if (grupoId) setGrupo(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void cargarDatos();
    return () => {
      isMounted = false;
    };
  }, [cargarListado, filtros, grupoId, reload]);

  const ejecutarMutacion = async (
    request: () => Promise<{ data: Grupo; message: string }>,
  ): Promise<Grupo | null> => {
    try {
      setIsSubmitting(true);
      setErrorAccion("");
      setMensaje("");
      const response = await request();
      setGrupo(response.data);
      setMensaje(response.message);
      return response.data;
    } catch (requestError: unknown) {
      setErrorAccion(extraerMensajeError(requestError));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const ejecutarRegistrar = (payload: GrupoPayload) =>
    ejecutarMutacion(() => registrarGrupo(payload));

  const ejecutarActualizar = (
    id: string,
    payload: Partial<Omit<GrupoPayload, "docenteId">>,
  ) => ejecutarMutacion(() => actualizarGrupo(id, payload));

  const ejecutarCambiarEstado = (
    id: string,
    estado: Exclude<EstadoGrupo, "CANCELADO">,
  ) => ejecutarMutacion(() => cambiarEstadoGrupo(id, estado));

  const ejecutarCambiarDocente = (id: string, docenteId: string, motivo: string) =>
    ejecutarMutacion(() => cambiarDocenteGrupo(id, docenteId, motivo));

  const ejecutarCancelar = (id: string, motivo: string) =>
    ejecutarMutacion(() => cancelarGrupo(id, motivo));

  return {
    grupos,
    grupo,
    periodos,
    cursos,
    docentes,
    aulas,
    filtros,
    setFiltros,
    isLoading,
    isSubmitting,
    error,
    errorAccion,
    mensaje,
    recargarGrupos,
    ejecutarRegistrar,
    ejecutarActualizar,
    ejecutarCambiarEstado,
    ejecutarCambiarDocente,
    ejecutarCancelar,
  };
}
