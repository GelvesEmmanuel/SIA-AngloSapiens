import { useCallback, useEffect, useState } from "react";
import { extraerMensajeError } from "../../../api/apiError";
import { listarEstudiantes } from "../../GestionEstudiantes/gestionEstudiantes.service";
import type { Estudiante } from "../../GestionEstudiantes/estudiantes.type";
import { listarCursos } from "../../GestionCursos/curso.service";
import type { Curso } from "../../GestionCursos/curso.types";
import { listarGrupos } from "../../GestionGrupos/grupo.service";
import type { Grupo } from "../../GestionGrupos/grupo.types";
import {
  actualizarMatricula,
  cambiarGrupoMatricula,
  cambiarEstadoMatricula,
  listarMatriculas,
  obtenerMatricula,
  registrarMatricula,
} from "../matricula.service";
import type {
  ActualizarMatriculaPayload,
  CambioGrupoMatriculaPayload,
  EstadoMatricula,
  FiltrosMatricula,
  Matricula,
  MatriculaPayload,
} from "../matricula.types";

interface UseMatriculaOptions {
  cargarListado?: boolean;
  matriculaId?: string;
  cargarCursos?: boolean;
}

export function useMatricula({
  cargarListado = true,
  matriculaId,
  cargarCursos = false,
}: UseMatriculaOptions = {}) {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [matricula, setMatricula] = useState<Matricula | null>(null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [isLoadingCursos, setIsLoadingCursos] = useState(cargarCursos);
  const [filtros, setFiltros] = useState<FiltrosMatricula>({});
  const [isLoadingCatalogos, setIsLoadingCatalogos] = useState(true);
  const [isLoadingListado, setIsLoadingListado] = useState(cargarListado);
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(Boolean(matriculaId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [reload, setReload] = useState(0);

  const recargarMatriculas = useCallback(() => {
    setReload((actual) => actual + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const cargarCatalogos = async () => {
      try {
        const [estudiantesResponse, gruposResponse] = await Promise.all([
          listarEstudiantes(),
          listarGrupos(),
        ]);
        if (isMounted) {
          setEstudiantes(estudiantesResponse.data);
          setGrupos(gruposResponse.data);
        }
      } catch (requestError: unknown) {
        if (isMounted) setError(extraerMensajeError(requestError));
      } finally {
        if (isMounted) setIsLoadingCatalogos(false);
      }
    };

    void cargarCatalogos();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!cargarCursos) {
      setIsLoadingCursos(false);
      return;
    }

    let isMounted = true;
    const cargarCatalogoCursos = async () => {
      try {
        setIsLoadingCursos(true);
        const response = await listarCursos();
        if (isMounted) setCursos(response.data);
      } catch (requestError: unknown) {
        if (isMounted) setError(extraerMensajeError(requestError));
      } finally {
        if (isMounted) setIsLoadingCursos(false);
      }
    };

    void cargarCatalogoCursos();
    return () => {
      isMounted = false;
    };
  }, [cargarCursos]);

  useEffect(() => {
    if (!cargarListado) {
      setIsLoadingListado(false);
      return;
    }

    let isMounted = true;
    const cargarListadoMatriculas = async () => {
      try {
        setIsLoadingListado(true);
        setError("");
        const response = await listarMatriculas(filtros);
        if (isMounted) setMatriculas(response.data);
      } catch (requestError: unknown) {
        if (isMounted) {
          setError(extraerMensajeError(requestError));
          setMatriculas([]);
        }
      } finally {
        if (isMounted) setIsLoadingListado(false);
      }
    };

    void cargarListadoMatriculas();
    return () => {
      isMounted = false;
    };
  }, [cargarListado, filtros, reload]);

  useEffect(() => {
    if (!matriculaId) {
      setIsLoadingDetalle(false);
      return;
    }

    let isMounted = true;
    const cargarDetalle = async () => {
      try {
        setIsLoadingDetalle(true);
        setError("");
        const response = await obtenerMatricula(matriculaId);
        if (isMounted) setMatricula(response.data);
      } catch (requestError: unknown) {
        if (isMounted) {
          setError(extraerMensajeError(requestError));
          setMatricula(null);
        }
      } finally {
        if (isMounted) setIsLoadingDetalle(false);
      }
    };

    void cargarDetalle();
    return () => {
      isMounted = false;
    };
  }, [matriculaId, reload]);

  const ejecutarMutacion = async (
    request: () => Promise<{ data: Matricula; message: string }>,
  ): Promise<Matricula | null> => {
    try {
      setIsSubmitting(true);
      setErrorAccion("");
      setMensaje("");
      const response = await request();
      setMatricula(response.data);
      setMatriculas((actuales) =>
        actuales.map((item) =>
          item.id === response.data.id ? response.data : item,
        ),
      );
      setMensaje(response.message);
      return response.data;
    } catch (requestError: unknown) {
      setErrorAccion(extraerMensajeError(requestError));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const ejecutarRegistrar = (payload: MatriculaPayload) =>
    ejecutarMutacion(() => registrarMatricula(payload));

  const ejecutarActualizar = (
    id: string,
    payload: ActualizarMatriculaPayload,
  ) => ejecutarMutacion(() => actualizarMatricula(id, payload));

  const ejecutarCambiarEstado = (
    id: string,
    estado: Exclude<EstadoMatricula, "ACTIVA">,
    motivoCancelacion?: string,
  ) => ejecutarMutacion(() => cambiarEstadoMatricula(id, estado, motivoCancelacion));

  const ejecutarCambiarGrupo = (
    id: string,
    payload: CambioGrupoMatriculaPayload,
  ) => ejecutarMutacion(() => cambiarGrupoMatricula(id, payload));

  return {
    matriculas,
    matricula,
    estudiantes,
    grupos,
    cursos,
    filtros,
    setFiltros,
    isLoading:
      isLoadingCatalogos ||
      isLoadingCursos ||
      isLoadingListado ||
      isLoadingDetalle,
    isSubmitting,
    error,
    errorAccion,
    mensaje,
    recargarMatriculas,
    ejecutarRegistrar,
    ejecutarActualizar,
    ejecutarCambiarEstado,
    ejecutarCambiarGrupo,
  };
}
