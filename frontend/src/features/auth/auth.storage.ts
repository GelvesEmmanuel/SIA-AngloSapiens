import type { AuthSession } from "./auth.types";
import { USER_ROLES, type UserRole } from "./auth.types";

const AUTH_STORAGE_KEY = "sia.auth.session";

function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (USER_ROLES as readonly string[]).includes(value)
  );
}

function isUserRoleArray(value: unknown): value is UserRole[] {
  return Array.isArray(value) && value.every(isUserRole);
}

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

      let roles: unknown = data.roles;
      if (!isUserRoleArray(roles) && isUserRole(data.rol)) {
        roles = [data.rol];
      }

      if (
        typeof data.token !== "string" ||
        !isUserRoleArray(roles) ||
        typeof data.requiereCambioContrasena !== "boolean"
      ) {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }

      const validRoles = roles as UserRole[];
      const activeRole = isUserRole(data.activeRole) &&
          validRoles.includes(data.activeRole)
        ? data.activeRole
        : validRoles[0] ?? null;

      return {
        token: data.token,
        roles: validRoles,
        activeRole,
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