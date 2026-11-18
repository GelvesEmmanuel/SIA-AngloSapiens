import { useAuth } from "../../auth/useAuth";
import { MisCursosPage } from "./MisCursosPage";
import { MisGruposDocentePage } from "./MisGruposDocentePage";

export function GestionAcademicaInicioPage() {
  const { activeRole } = useAuth();

  return activeRole === "DOCENTE" ? <MisGruposDocentePage /> : <MisCursosPage />;
}
