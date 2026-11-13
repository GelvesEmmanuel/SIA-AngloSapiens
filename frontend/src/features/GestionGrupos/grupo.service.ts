import api from "../../api/axios";
import type { ApiResponse, EstadoGrupo, FiltrosGrupo, Grupo, GrupoPayload } from "./grupo.types";

const BASE_URL = "/grupos";

export const listarGrupos = async (params: FiltrosGrupo = {}) => {
  const response = await api.get<ApiResponse<Grupo[]>>(`${BASE_URL}/listar`, { params });
  return response.data;
};

export const obtenerGrupo = async (id: string) => {
  const response = await api.get<ApiResponse<Grupo>>(`${BASE_URL}/listar/${id}`);
  return response.data;
};

export const registrarGrupo = async (payload: GrupoPayload) => {
  const response = await api.post<ApiResponse<Grupo>>(`${BASE_URL}/registrar`, payload);
  return response.data;
};

export const actualizarGrupo = async (id: string, payload: Partial<Omit<GrupoPayload, "docenteId">>) => {
  const response = await api.patch<ApiResponse<Grupo>>(`${BASE_URL}/actualizar/${id}`, payload);
  return response.data;
};

export const cambiarEstadoGrupo = async (id: string, estado: Exclude<EstadoGrupo, "CANCELADO">) => {
  const response = await api.patch<ApiResponse<Grupo>>(`${BASE_URL}/estado/${id}`, { estado });
  return response.data;
};

export const cancelarGrupo = async (id: string, motivo: string) => {
  const response = await api.patch<ApiResponse<Grupo>>(`${BASE_URL}/cancelar/${id}`, { motivo });
  return response.data;
};

export const cambiarDocenteGrupo = async (id: string, docenteId: string, motivo: string) => {
  const response = await api.patch<ApiResponse<Grupo>>(`${BASE_URL}/cambiar-docente/${id}`, {
    docenteId,
    motivo,
  });
  return response.data;
};
