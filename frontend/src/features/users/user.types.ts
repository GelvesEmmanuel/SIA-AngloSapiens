
import type { UserRole } from "../auth/auth.types";

// Estados de las cuentas.
export type UserStatus = "ACTIVO" | "INACTIVO";

// Usuario devuelto por el backend.
export interface Usuario {
  usuarioId: string;
  username: string;
  rol: UserRole;
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
    rol: "COORD_ACADEMICO" | "COORD_ADMINISTRATIVO";
    estado: UserStatus;
    mensaje: string;
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
