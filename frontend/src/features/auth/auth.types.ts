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
  roles: UserRole[];
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
  roles: UserRole[];
  activeRole: UserRole | null;
  requiereCambioContrasena: boolean;
}

export interface AuthContextValue {
  token: string | null;
  roles: UserRole[];
  activeRole: UserRole | null;
  requiereCambioContrasena: boolean;

  isAuthenticated: boolean;
  isInitializing: boolean;

  login: (credentials: LoginPayload) => Promise<LoginData>;
  setActiveRole: (role: UserRole) => void;

  cambiarContrasena: (
    payload: CambiarContrasenaPayload
  ) => Promise<void>;

  logout: () => Promise<void>;
}