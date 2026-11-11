import api from "../../api/axios";
import type {
  Usuario,
  ApiResponse,
  ListarUsuariosParams,
  CrearUsuarioCoordinadorPayload,
  CrearUsuarioCoordinadorResponse,
  UsuarioDetalleResponse,
  AsignarRolUsuarioPayload,
  AsignarRolUsuarioResponse,
  BuscarUsuarioParaCoordinacionResponse,
  ConvertirUsuarioEnCoordinadorPayload,
  ConvertirUsuarioEnCoordinadorResponse,
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
): Promise<UsuarioDetalleResponse> => {
  const response = await api.get<UsuarioDetalleResponse>(
    `${BASE_URL}/${usuarioId}`
  );

  return response.data;
};

export const asignarRolUsuario = async (
  usuarioId: string,
  payload: AsignarRolUsuarioPayload
): Promise<AsignarRolUsuarioResponse> => {
  const response = await api.post<AsignarRolUsuarioResponse>(
    `${BASE_URL}/${usuarioId}/roles`,
    payload
  );

  return response.data;
};

export const buscarUsuarioParaCoordinacion = async (
  documentoIdentidad: string
): Promise<BuscarUsuarioParaCoordinacionResponse> => {
  const response = await api.get<BuscarUsuarioParaCoordinacionResponse>(
    `${BASE_URL}/coordinadores/buscar`,
    { params: { documentoIdentidad } }
  );

  return response.data;
};

export const convertirUsuarioEnCoordinador = async (
  payload: ConvertirUsuarioEnCoordinadorPayload
): Promise<ConvertirUsuarioEnCoordinadorResponse> => {
  const response = await api.post<ConvertirUsuarioEnCoordinadorResponse>(
    `${BASE_URL}/coordinadores`,
    payload
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