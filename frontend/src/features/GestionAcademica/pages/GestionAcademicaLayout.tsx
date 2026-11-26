import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

const seccionesEstudiante = [
  { label: "Mis cursos", path: "/gestion-academica", end: true },
  { label: "Mis calificaciones", path: "/gestion-academica/calificaciones" },
  { label: "Historial académico", path: "/gestion-academica/historial" },
];

export function GestionAcademicaLayout() {
  const { activeRole } = useAuth();
  const esGestor =
    activeRole === "SUPER_ADMIN" ||
    activeRole === "COORD_ACADEMICO" ||
    activeRole === "COORD_ADMINISTRATIVO";
  const secciones = esGestor
    ? [{ label: "Historial académico", path: "/gestion-academica/historial" }]
    : activeRole === "DOCENTE"
      ? [
          { label: "Mis grupos", path: "/gestion-academica", end: true },
          { label: "Registrar notas", path: "/gestion-academica/notas" },
          { label: "Registrar asistencia", path: "/gestion-academica/asistencias" },
        ]
      : seccionesEstudiante;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <header>
        <p className="eyebrow mb-2">
          {esGestor
            ? "Gestión académica"
            : activeRole === "DOCENTE"
              ? "Portal del docente"
              : "Portal del estudiante"}
        </p>
        <h1 className="page-title">Gestión académica</h1>
        <p className="mt-2 text-sm text-muted">
          {esGestor
            ? "Consulta el historial académico de los estudiantes por documento de identidad."
            : activeRole === "DOCENTE"
              ? "Consulta tus grupos y administra la información académica de tus estudiantes."
              : "Consulta tus cursos matriculados y accede a tu información académica."}
        </p>
      </header>

      <nav aria-label="Secciones de gestión académica" className="flex flex-wrap gap-2 border-b border-border">
        {secciones.map((seccion) => (
          <NavLink
            key={seccion.path}
            to={seccion.path}
            end={seccion.end}
            className={({ isActive }) =>
              `border-b-2 px-3 py-3 text-sm font-semibold transition ${
                isActive
                  ? "border-red text-navy"
                  : "border-transparent text-muted hover:text-navy"
              }`
            }
          >
            {seccion.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
