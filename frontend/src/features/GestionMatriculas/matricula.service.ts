import api from "../../api/axios";
import type {
  ActualizarMatriculaPayload,
  ApiResponse,
  EstadoMatricula,
  FiltrosMatricula,
  Matricula,
  MatriculaPayload,
} from "./matricula.types";

const BASE_URL = "/matriculas";

export const listarMatriculas = async (params: FiltrosMatricula = {}) => {
  const response = await api.get<ApiResponse<Matricula[]>>(
    `${BASE_URL}/listar`,
    { params },
  );
  return response.data;
};

export const obtenerMatricula = async (id: string) => {
  const response = await api.get<ApiResponse<Matricula>>(
    `${BASE_URL}/listar/${id}`,
  );
  return response.data;
};

export const registrarMatricula = async (payload: MatriculaPayload) => {
  const response = await api.post<ApiResponse<Matricula>>(
    `${BASE_URL}/registrar`,
    payload,
  );
  return response.data;
};

export const actualizarMatricula = async (
  id: string,
  payload: ActualizarMatriculaPayload,
) => {
  const response = await api.patch<ApiResponse<Matricula>>(
    `${BASE_URL}/actualizar/${id}`,
    payload,
  );
  return response.data;
};

export const cambiarEstadoMatricula = async (
  id: string,
  estado: Exclude<EstadoMatricula, "ACTIVA">,
) => {
  const response = await api.patch<ApiResponse<Matricula>>(
    `${BASE_URL}/estado/${id}`,
    { estado },
  );
  return response.data;
};
