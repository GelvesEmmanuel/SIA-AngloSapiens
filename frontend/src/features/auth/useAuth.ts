import { useContext } from "react";
import { AuthContext } from "./AuthContext";
//Este hook evitará que tengas que importar AuthContext directamente en cada componente. También permitirá detectar si alguien intenta utilizarlo fuera del proveedor.
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider."
    );
  }

  return context;
}