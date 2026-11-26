import api from "../../api/axios";
import type {
  ApiResponse,
  GrupoDocente,
  GrupoMatriculado,
} from "./gestionAcademica.types";

import type {
  EstudianteResumenHistorial,
  HistorialAcademicoResponse,
  ObtenerHistorialAcademicoParams,
} from "./historialAcademico.types";

export const listarMisGrupos = async () => {
  const response = await api.get<ApiResponse<GrupoMatriculado[]>>(
    "/gestion-academica/mis-grupos",
  );
  return response.data;
};

export const listarGruposAsignadosDocente = async () => {
  const response = await api.get<ApiResponse<GrupoDocente[]>>(
    "/gestion-academica/mis-grupos",
  );
  return response.data;
};
// ruta para obtener el hisotorial avcademico del estudiante 
export const obtenerHistorialAcademicoEstudianteService = async (
  estudianteId: string,
  params?: ObtenerHistorialAcademicoParams,
): Promise<HistorialAcademicoResponse> => {
  const response = await api.get<{
    exito: boolean;
    datos: HistorialAcademicoResponse;
  }>(`/gestion-academica/estudiantes/${estudianteId}/historial-academico`, {
    params,
  });

  return response.data.datos;
};

export const obtenerMiHistorialAcademicoService =
  async (
    params?: ObtenerHistorialAcademicoParams,
  ): Promise<HistorialAcademicoResponse> => {
    const response = await api.get<{
      exito: boolean;
      datos: HistorialAcademicoResponse;
    }>("/gestion-academica/mi-historial-academico", {
      params,
    });

    return response.data.datos;
  };

export const buscarEstudianteHistorialService = async (
  numeroDocumento: string,
): Promise<EstudianteResumenHistorial> => {
  const response = await api.get<{
    exito: boolean;
    datos: EstudianteResumenHistorial;
  }>("/gestion-academica/historial-academico/buscar", {
    params: { numeroDocumento },
  });

  return response.data.datos;
};