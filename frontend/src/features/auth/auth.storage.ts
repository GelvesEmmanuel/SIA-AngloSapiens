import type { AuthSession } from "./auth.types";
import { USER_ROLES } from "./auth.types";

const AUTH_STORAGE_KEY = "sia.auth.session";

export const authStorage = {
  getSession(): AuthSession | null {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);

      if (
        typeof parsed !== "object" ||
        parsed === null
      ) {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }

      const data = parsed as Record<string, unknown>;

      const validRole =
        typeof data.rol === "string" &&
        (USER_ROLES as readonly string[]).includes(data.rol);

      if (
        typeof data.token !== "string" ||
        !validRole ||
        typeof data.requiereCambioContrasena !== "boolean"
      ) {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }

      return {
        token: data.token,
        rol: data.rol as AuthSession["rol"],
        requiereCambioContrasena:
          data.requiereCambioContrasena,
      };
    } catch {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
  },

  saveSession(session: AuthSession): void {
    sessionStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify(session)
    );
  },

  clearSession(): void {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  },
};