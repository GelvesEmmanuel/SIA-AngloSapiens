import { useState } from "react";
import { useAuth } from "../../features/auth/useAuth";

export default function HomePage() {
  const { rol, logout } = useAuth();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async (): Promise<void> => {
    setLogoutError(null);

    try {
      await logout();
    } catch {
      setLogoutError(
        "La sesión se cerró en este navegador, pero no se pudo confirmar el cierre en el servidor."
      );
    }
  };

  return (
    <main>
      <h1>Inicio del SIA académico</h1>

      <p>Rol actual: {rol}</p>

      <button onClick={() => void handleLogout()}>
        Cerrar sesión
      </button>
      {logoutError && <p role="alert">{logoutError}</p>}
    </main>
  );
}