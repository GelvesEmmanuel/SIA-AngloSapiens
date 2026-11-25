import api from "../../api/axios";
import type {
  ApiResponse,
  GrupoDocente,
  GrupoMatriculado,
} from "./gestionAcademica.types";

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
