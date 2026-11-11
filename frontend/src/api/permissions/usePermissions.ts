//Este hook será el encargado de consultar los permisos del usuario autenticado desde cualquier página o componente.

import { useAuth } from
  "../../features/auth/useAuth";

import {
  permissionsByRole,
  type Permission,
} from "./permissions.config";

export function usePermissions() {
  const { activeRole } = useAuth();

  const permissions = activeRole ? permissionsByRole[activeRole] : [];

  // Comprobar un permiso específico.
  const can = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  // Comprobar si tiene al menos uno de los permisos.
  const canAny = (required: Permission[]): boolean => {
    return required.some((permission) =>
      permissions.includes(permission)
    );
  };

  // Comprobar si tiene todos los permisos.
  const canAll = (required: Permission[]): boolean => {
    return required.every((permission) =>
      permissions.includes(permission)
    );
  };

  return {
    activeRole,
    permissions,
    can,
    canAny,
    canAll,
  };
}
