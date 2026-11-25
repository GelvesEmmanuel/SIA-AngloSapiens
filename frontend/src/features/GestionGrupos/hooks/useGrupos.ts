import { useCallback, useEffect, useState } from "react";
import { extraerMensajeError } from "../../../api/apiError";
import { useAuth } from "../../auth/useAuth";
import { listarAulas } from "../../GestionAulas/aula.service";
import type { Aula } from "../../GestionAulas/aula.types";
import { listarCursos } from "../../GestionCursos/curso.service";
import type { Curso } from "../../GestionCursos/curso.types";
import { listarDocentes } from "../../GestionDocentes/gestionDocente.service";
import type { Docente } from "../../GestionDocentes/docente.types";
import { listarPeriodos } from "../../GestionPeriodos/periodo.service";
import type { PeriodoAcademico } from "../../GestionPeriodos/periodo.types";
import { listarGruposAsignadosDocente } from "../../GestionAcademica/gestionAcademica.service";
import type { GrupoDocente } from "../../GestionAcademica/gestionAcademica.types";
import {
  actualizarGrupo,
  cambiarDocenteGrupo,
  cambiarEstadoGrupo,
  cancelarGrupo,
  listarEstudiantesPorGrupo,
  listarGrupos,
  obtenerGrupo,
  registrarGrupo,
} from "../grupo.service";
import type {
  EstadoGrupo,
  EstudianteMatriculadoGrupo,
  FiltrosGrupo,
  Grupo,
  GrupoPayload,
} from "../grupo.types";

interface UseGruposOptions {
  cargarListado?: boolean;
  grupoId?: string;
}

export function useGrupos({ cargarListado = true, grupoId }: UseGruposOptions = {}) {
  const { activeRole } = useAuth();
  const esDocente = activeRole === "DOCENTE";
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [gruposDocente, setGruposDocente] = useState<GrupoDocente[]>([]);
  const [grupo, setGrupo] = useState<Grupo | null>(null);
  const [estudiantesGrupo, setEstudiantesGrupo] = useState<EstudianteMatriculadoGrupo[]>([]);
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
    const cargarCatalogos = !esDocente && (cargarListado || Boolean(grupoId));
    const cargarCursos = !esDocente && (cargarListado || Boolean(grupoId));
    if (!cargarListado && !grupoId) return;

    let isMounted = true;
    const cargarDatos = async () => {
      try {
        setIsLoading(true);
        setError("");
        if (cargarListado && esDocente) {
          const gruposResponse = await listarGruposAsignadosDocente();
          if (!isMounted) return;
          setGruposDocente(gruposResponse.data);
          setGrupos([]);
          return;
        }

        const [gruposResponse, catalogosResponse, cursosResponse, grupoResponse, estudiantesResponse] = await Promise.all([
          cargarListado ? listarGrupos(filtros) : Promise.resolve(undefined),
          cargarCatalogos
            ? Promise.all([listarPeriodos(), listarDocentes(), listarAulas()])
            : Promise.resolve(undefined),
          cargarCursos ? listarCursos() : Promise.resolve(undefined),
          grupoId ? obtenerGrupo(grupoId) : Promise.resolve(undefined),
          grupoId ? listarEstudiantesPorGrupo(grupoId) : Promise.resolve(undefined),
        ]);

        if (!isMounted) return;
        if (gruposResponse) setGrupos(gruposResponse.data);
        setGruposDocente([]);
        if (cursosResponse) setCursos(cursosResponse.data);
        if (catalogosResponse) {
          const [periodosResponse, docentesResponse, aulasResponse] = catalogosResponse;
          setPeriodos(periodosResponse.data);
          setDocentes(docentesResponse.data);
          setAulas(aulasResponse.data);
        }
        if (grupoResponse) setGrupo(grupoResponse.data);
        if (estudiantesResponse) setEstudiantesGrupo(estudiantesResponse.data);
      } catch (requestError: unknown) {
        if (!isMounted) return;
        setError(extraerMensajeError(requestError));
        if (cargarListado) {
          setGrupos([]);
          setGruposDocente([]);
        }
        if (grupoId) setGrupo(null);
        if (grupoId) setEstudiantesGrupo([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void cargarDatos();
    return () => {
      isMounted = false;
    };
  }, [activeRole, cargarListado, esDocente, filtros, grupoId, reload]);

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
    gruposDocente,
    grupo,
    estudiantesGrupo,
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
