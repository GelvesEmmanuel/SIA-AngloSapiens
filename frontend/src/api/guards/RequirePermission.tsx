//Este componente impedirá que un usuario acceda a una página si no tiene autorización, incluso si escribe directamente la URL.

import { Navigate, Outlet } from "react-router-dom";

import { usePermissions } from
  "../permissions/usePermissions";

import type { Permission } from
  "../permissions/permissions.config";

interface RequirePermissionProps {
  permission: Permission;
}

export function RequirePermission({
  permission,
}: RequirePermissionProps) {
  const { can } = usePermissions();

  if (!can(permission)) {
    return <Navigate to="/inicio" replace />;
  }

  return <Outlet />;
}
