import api from "../../api/axios";
import type {
  ActualizarCursoPayload,
  ApiResponse,
  Curso,
  CursoPayload,
  ListarCursosParams,
} from "./curso.types";

const BASE_URL = "/cursos";

export const listarCursos = async (
  params: ListarCursosParams = {},
): Promise<ApiResponse<Curso[]>> => {
  const response = await api.get<ApiResponse<Curso[]>>(
    `${BASE_URL}/listar`,
    { params },
  );
  return response.data;
};

export const obtenerCursoPorId = async (
  cursoId: string,
): Promise<ApiResponse<Curso>> => {
  const response = await api.get<ApiResponse<Curso>>(
    `${BASE_URL}/listar/${cursoId}`,
  );
  return response.data;
};

export const registrarCurso = async (
  payload: CursoPayload,
): Promise<ApiResponse<Curso>> => {
  const response = await api.post<ApiResponse<Curso>>(
    `${BASE_URL}/registrar`,
    payload,
  );
  return response.data;
};

export const actualizarCurso = async (
  cursoId: string,
  payload: ActualizarCursoPayload,
): Promise<ApiResponse<Curso>> => {
  const response = await api.patch<ApiResponse<Curso>>(
    `${BASE_URL}/actualizar/${cursoId}`,
    payload,
  );
  return response.data;
};

export const activarCurso = async (
  cursoId: string,
): Promise<ApiResponse<Curso>> => {
  const response = await api.patch<ApiResponse<Curso>>(
    `${BASE_URL}/activar/${cursoId}`,
  );
  return response.data;
};

export const inactivarCurso = async (
  cursoId: string,
): Promise<ApiResponse<Curso>> => {
  const response = await api.patch<ApiResponse<Curso>>(
    `${BASE_URL}/inactivar/${cursoId}`,
  );
  return response.data;
};