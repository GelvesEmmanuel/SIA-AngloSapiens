import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { navigationConfig } from "../layouts/navigation.config";

interface RequireRouteAccessProps {
  children: ReactNode;
}

export function RequireRouteAccess({ children }: RequireRouteAccessProps) {
  const { activeRole } = useAuth();
  const location = useLocation();

  const route = navigationConfig
    .flatMap((section) => section.items)
    .filter(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(`${item.path}/`),
    )
    .sort((left, right) => right.path.length - left.path.length)[0];

  if (!route || !activeRole || !route.allowedRoles.includes(activeRole)) {
    return <Navigate to="/inicio" replace />;
  }

  return children;
}
