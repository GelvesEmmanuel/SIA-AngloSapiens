
import type { UserRole } from "../auth/auth.types";

// Estados de las cuentas.
export type UserStatus = "ACTIVO" | "INACTIVO";

// Usuario devuelto por el backend.
export interface Usuario {
  usuarioId: string;
  username: string;
  roles: UserRole[];
  estado: UserStatus;
  requiereCambioContrasena: boolean;
  createAt: string;
  updatedAt: string;
  nombre: string;
  apellidos: string;
  documentoIdentidad: string;
}

// Respuesta estándar del backend.
export interface ApiResponse<T> {
  exito: boolean;
  mensaje: string;
  datos: T;
}

export interface CrearUsuarioCoordinadorResponse {
  exito: boolean;
  mensaje: {
    usuarioId: string;
    username: string;
    roles: UserRole[];
    estado: UserStatus;
    mensaje: string;
  };
}

export interface UsuarioDetalleResponse {
  success: boolean;
  data: Usuario;
}

export interface AsignarRolUsuarioPayload {
  rol: UserRole;
}

export interface AsignarRolUsuarioResponse {
  success: boolean;
  message: string;
  data: {
    usuarioId: string;
    roles: UserRole[];
  };
}

export interface UsuarioParaCoordinacion {
  usuarioId: string;
  username: string;
  documentoIdentidad: string;
  nombre: string;
  apellidos: string;
  origen: "DOCENTE" | "ESTUDIANTE" | "COORDINADOR";
  roles: UserRole[];
  rolesCoordinador: UserRole[];
}

export interface BuscarUsuarioParaCoordinacionResponse {
  success: boolean;
  message: string;
  data: UsuarioParaCoordinacion;
}

export interface ConvertirUsuarioEnCoordinadorPayload {
  documentoIdentidad: string;
  rol: "COORD_ACADEMICO" | "COORD_ADMINISTRATIVO";
}

export interface ConvertirUsuarioEnCoordinadorResponse {
  success: boolean;
  message: string;
  data: {
    usuarioId: string;
    username: string;
    documentoIdentidad: string;
    roles: UserRole[];
  };
}

// Parámetros para consultar usuarios.
export interface ListarUsuariosParams {
  busqueda?: string;
  rol?: UserRole;
  estado?: UserStatus;
}

// Datos para crear coordinadores.
export interface CrearUsuarioCoordinadorPayload {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  documentoIdentidad: string;
  diaCumpleanos: number;
  rol: "COORD_ACADEMICO" | "COORD_ADMINISTRATIVO";
}
