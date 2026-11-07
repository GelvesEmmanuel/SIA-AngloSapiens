import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { authService } from "./auth.service";
import { authStorage } from "./auth.storage";

import type {
  AuthContextValue,
  AuthSession,
  LoginData,
  LoginPayload,
  CambiarContrasenaPayload,
} from "./auth.types";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthContext =
  createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [session, setSession] =
    useState<AuthSession | null>(null);

  const [isInitializing, setIsInitializing] =
    useState(true);

  // Recuperar la sesión guardada al iniciar la aplicación.
  useEffect(() => {
    try {
      setSession(authStorage.getSession());
    } catch {
      setSession(null);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Iniciar sesión y guardar los datos entregados por el backend.
  const login = useCallback(
    async (
      credentials: LoginPayload
    ): Promise<LoginData> => {
      const response =
        await authService.login(credentials);

      if (!response.exito) {
        throw new Error(
          response.mensaje || "No se pudo iniciar sesión."
        );
      }

      const newSession: AuthSession = {
        token: response.datos.token,
        rol: response.datos.rol,
        requiereCambioContrasena:
          response.datos.requiereCambioContrasena,
      };

      authStorage.saveSession(newSession);
      setSession(newSession);

      return response.datos;
    },
    []
  );

  // Cambiar la contraseña e invalidar la sesión local.
  const cambiarContrasena = useCallback(
    async (
      payload: CambiarContrasenaPayload
    ): Promise<void> => {
      if (!session?.token) {
        throw new Error(
          "Debes iniciar sesión para cambiar tu contraseña."
        );
      }

      const response =
        await authService.cambiarContrasena(payload);

      if (!response.exito) {
        throw new Error(
          response.mensaje ||
            "No fue posible cambiar la contraseña."
        );
      }

      try {
        sessionStorage.setItem(
          "sia.auth.passwordChangedNotice",
          "true"
        );
      } catch {
        // La confirmación es opcional si el almacenamiento no está disponible.
      }

      // El backend invalida el JWT anterior.
      authStorage.clearSession();
      setSession(null);
    },
    [session?.token]
  );

  const logout = useCallback(async (): Promise<void> => {
    
    try {
      // DIAGNÓSTICO: ¿Tenemos token guardado justo ahora?
      //console.log("Token actual antes del logout:", authStorage.getSession());
      await authService.logout();
    } finally {
      authStorage.clearSession();
      setSession(null);
    }
  }, []);

  const value: AuthContextValue = {
    token: session?.token ?? null,
    rol: session?.rol ?? null,

    requiereCambioContrasena:
      session?.requiereCambioContrasena ?? false,

    isAuthenticated: Boolean(session?.token),
    isInitializing,

    login,
    cambiarContrasena,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
/**(session	Mantiene el token, el rol y el indicador de cambio obligatorio.
isInitializing	Evita que las rutas decidan si redirigir antes de recuperar la sesión.
login()	Consulta el backend, guarda la sesión y devuelve los datos del login.
cambiarContrasena()	Ejecuta el cambio y elimina la sesión cuando el backend lo confirma.
logout()	Elimina el estado de la sesión y el token almacenado.
value	Expone el estado y las operaciones al resto de la aplicación.) */