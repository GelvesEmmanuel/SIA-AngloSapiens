import api from "../../api/axios";
import type {
  Usuario,
  ApiResponse,
  ListarUsuariosParams,
  CrearUsuarioCoordinadorPayload,
  CrearUsuarioCoordinadorResponse,
} from "./user.types";

const BASE_URL = "/admin/usuarios";

export const listarUsuarios = async (
  params: ListarUsuariosParams = {}
): Promise<ApiResponse<Usuario[]>> => {
  const response = await api.get<ApiResponse<Usuario[]>>(BASE_URL, {
    params,
  });

  return response.data;
};

export const obtenerUsuarioPorId = async (
  usuarioId: string
): Promise<ApiResponse<Usuario>> => {
  const response = await api.get<ApiResponse<Usuario>>(
    `${BASE_URL}/${usuarioId}`
  );

  return response.data;
};

export const crearUsuarioCoordinador = async (
  payload: CrearUsuarioCoordinadorPayload
): Promise<CrearUsuarioCoordinadorResponse> => {
  const response = await api.post<CrearUsuarioCoordinadorResponse>(
    BASE_URL,
    payload
  );

  return response.data;
};

export const cambiarEstadoUsuario = async (
  usuarioId: string
): Promise<ApiResponse<unknown>> => {
  const response = await api.patch(
    `${BASE_URL}/${usuarioId}/estado`
  );

  return response.data;
};

export const restablecerContrasenaUsuario = async (
  usuarioId: string
): Promise<ApiResponse<unknown>> => {
  const response = await api.patch(
    `${BASE_URL}/${usuarioId}/restablecer-contrasena`
  );

  return response.data;
};