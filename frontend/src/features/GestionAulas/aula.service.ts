import api from "../../api/axios";
import type { ApiResponse, Aula } from "./aula.types";

const BASE_URL = "/aulas";

export const listarAulas = async (params: { activa?: boolean; busqueda?: string } = {}) => {
  const response = await api.get<ApiResponse<Aula[]>>(`${BASE_URL}/listar`, { params });
  return response.data;
};

export const obtenerAula = async (id: string) => {
  const response = await api.get<ApiResponse<Aula>>(`${BASE_URL}/listar/${id}`);
  return response.data;
};

export const registrarAula = async (nombre: string) => {
  const response = await api.post<ApiResponse<Aula>>(`${BASE_URL}/registrar`, { nombre });
  return response.data;
};

export const actualizarAula = async (id: string, nombre: string) => {
  const response = await api.patch<ApiResponse<Aula>>(`${BASE_URL}/actualizar/${id}`, { nombre });
  return response.data;
};

export const cambiarEstadoAula = async (id: string, activa: boolean) => {
  const response = await api.patch<ApiResponse<Aula>>(`${BASE_URL}/estado/${id}`, { activa });
  return response.data;
};
