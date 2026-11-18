import api from "../../api/axios";
import type { ApiResponse, GrupoMatriculado } from "./gestionAcademica.types";

export const listarMisGrupos = async () => {
  const response = await api.get<ApiResponse<GrupoMatriculado[]>>(
    "/gestion-academica/mis-grupos",
  );
  return response.data;
};
