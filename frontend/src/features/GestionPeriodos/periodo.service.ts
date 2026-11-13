import api from "../../api/axios";
import type { ApiResponse, EstadoPeriodo, PeriodoAcademico, PeriodoPayload } from "./periodo.types";

const BASE_URL = "/periodos";

export const listarPeriodos = async (params: { estado?: EstadoPeriodo; busqueda?: string } = {}) => {
  const response = await api.get<ApiResponse<PeriodoAcademico[]>>(`${BASE_URL}/listar`, { params });
  return response.data;
};

export const obtenerPeriodo = async (id: string) => {
  const response = await api.get<ApiResponse<PeriodoAcademico>>(`${BASE_URL}/listar/${id}`);
  return response.data;
};

export const registrarPeriodo = async (payload: PeriodoPayload) => {
  const response = await api.post<ApiResponse<PeriodoAcademico>>(`${BASE_URL}/registrar`, payload);
  return response.data;
};

export const actualizarPeriodo = async (id: string, payload: Partial<PeriodoPayload>) => {
  const response = await api.patch<ApiResponse<PeriodoAcademico>>(`${BASE_URL}/actualizar/${id}`, payload);
  return response.data;
};

export const cambiarEstadoPeriodo = async (id: string, estado: EstadoPeriodo) => {
  const response = await api.patch<ApiResponse<PeriodoAcademico>>(`${BASE_URL}/estado/${id}`, { estado });
  return response.data;
};
