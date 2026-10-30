//Será útil cuando una página permita entrar a distintos roles con permisos diferentes.

import { Navigate, Outlet } from "react-router-dom";

import { usePermissions } from
  "../permissions/usePermissions";

import type { Permission } from
  "../permissions/permissions.config";

interface RequireAnyPermissionProps {
  permissions: Permission[];
}

export function RequireAnyPermission({
  permissions,
}: RequireAnyPermissionProps) {
  const { canAny } = usePermissions();

  if (!canAny(permissions)) {
    return <Navigate to="/inicio" replace />;
  }

  return <Outlet />;
}
