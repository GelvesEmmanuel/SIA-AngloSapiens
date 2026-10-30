//Su finalidad es impedir que los usuarios que ya iniciaron sesión regresen innecesariamente al formulario de login.
//Con esto, el login y las rutas protegidas empiezan a compartir las mismas reglas de navegación.

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";

interface GuestOnlyRouteProps {
  children: ReactNode;
}

export function GuestOnlyRoute({
  children,
}: GuestOnlyRouteProps) {
  const {
    isAuthenticated,
    isInitializing,
    requiereCambioContrasena,
  } = useAuth();

  if (isInitializing) {
    return (
      <p role="status">
        Comprobando la sesión...
      </p>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={
          requiereCambioContrasena
            ? "/cambiar-contrasena"
            : "/inicio"
        }
        replace
      />
    );
  }

  return children;
}