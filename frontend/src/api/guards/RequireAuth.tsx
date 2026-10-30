//  Este componente comprobará si existe una sesión y si el usuario tiene pendiente el cambio obligatorio de contraseña.


import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";

interface RequireAuthProps {
  children: ReactNode;
  allowPasswordChange?: boolean;
}

export function RequireAuth({
  children,
  allowPasswordChange = false,
}: RequireAuthProps) {
  const {
    isAuthenticated,
    isInitializing,
    requiereCambioContrasena,
  } = useAuth();

  const location = useLocation();

  if (isInitializing) {
    return (
      <p role="status">
        Comprobando la sesión...
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (
    requiereCambioContrasena &&
    !allowPasswordChange
  ) {
    return (
      <Navigate
        to="/cambiar-contrasena"
        replace
      />
    );
  }

  if (
    !requiereCambioContrasena &&
    allowPasswordChange
  ) {
    return <Navigate to="/inicio" replace />;
  }

  return children;
}