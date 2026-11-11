
import {
  ChevronRight,
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { navigationConfig } from "../layouts/navigation.config";

interface TopbarProps {
  onMenuClick: () => void;
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Superadministrador",
  COORD_ACADEMICO: "Coord. académico",
  COORD_ADMINISTRATIVO: "Coord. administrativo",
  DOCENTE: "Docente",
  ESTUDIANTE: "Estudiante",
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const { roles, activeRole, setActiveRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentItem = navigationConfig
    .flatMap((section) => section.items)
    .find((item) => item.path === location.pathname);

  const pageTitle = currentItem?.label ?? "Inicio";

  const roleLabel = activeRole
    ? roleLabels[activeRole] ?? activeRole
    : "Usuario";

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-border bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Breadcrumb */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className="mr-1 rounded-md p-2 text-navy hover:bg-surface-muted lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={21} />
        </button>

        <span className="hidden text-xs text-muted sm:block">
          Anglosapiens
        </span>

        <ChevronRight
          size={14}
          className="hidden text-muted sm:block"
        />

        <span className="truncate text-xs font-bold text-navy">
          {pageTitle}
        </span>
      </div>

      {/* Usuario y sesión */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-white">
          <UserRound size={18} />
        </div>

        <div className="min-w-0 text-right">
          <p className="hidden text-xs font-bold text-navy sm:block">
            Usuario autenticado
          </p>

          {roles.length > 1 ? (
            <label className="sr-only" htmlFor="active-role">
              Perfil activo
            </label>
          ) : null}
          {roles.length > 1 ? (
            <select
              id="active-role"
              aria-label="Seleccionar perfil activo"
              value={activeRole ?? ""}
              onChange={(event) => {
                const nextRole = roles.find((role) => role === event.target.value);
                if (nextRole) setActiveRole(nextRole);
              }}
              className="max-w-32 cursor-pointer truncate border-0 bg-transparent text-[10px] text-muted outline-none sm:max-w-48"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role] ?? role}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-[10px] text-muted">{roleLabel}</p>
          )}
        </div>

        <div className="hidden h-8 w-px bg-border sm:block" />

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold text-navy transition-colors hover:border-red hover:text-red"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">
            Cerrar sesión
          </span>
        </button>
      </div>
    </header>
  );
}
