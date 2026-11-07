// exporta typer para que se pueda trabajar con consistencia

export const USER_ROLES = [
     "SUPER_ADMIN",
  "COORD_ACADEMICO",
  "COORD_ADMINISTRATIVO",
  "DOCENTE",
  "ESTUDIANTE"
]
export type UserRole = (typeof USER_ROLES)[number];
export interface LoginPayload{
    username:string;
    contrasena: string;
}

export interface CambiarContrasenaPayload{
    contrasenaActual:string;
    nuevaContrasena: string;
}
export interface LoginData {
  token: string;
  rol: UserRole;
  requiereCambioContrasena: boolean;
}

export interface LoginResponse {
  exito: boolean;
  mensaje: string;
  datos: LoginData;
}

export interface CambiarContrasenaResponse {
  exito: boolean;
  mensaje: string;
}

export interface AuthSession {
  token: string;
  rol: UserRole;
  requiereCambioContrasena: boolean;
}

export interface AuthContextValue {
  token: string | null;
  rol: UserRole | null;
  requiereCambioContrasena: boolean;

  isAuthenticated: boolean;
  isInitializing: boolean;

  login: (credentials: LoginPayload) => Promise<LoginData>;

  cambiarContrasena: (
    payload: CambiarContrasenaPayload
  ) => Promise<void>;

  logout: () => Promise<void>;
}