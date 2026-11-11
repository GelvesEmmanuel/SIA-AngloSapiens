
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ContactRound,
  ClipboardList,
  BookOpen,
  UsersRound,
  CalendarCheck,
  ChartNoAxesColumn,
  History,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { navigationConfig } from "../layouts/navigation.config";
import logoAnglosapiens from '../../assets/anglologo.png';
interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const icons: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  GraduationCap,
  ContactRound,
  ClipboardList,
  BookOpen,
  UsersRound,
  CalendarCheck,
  ChartNoAxesColumn,
  History,
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Superadministrador",
  COORD_ACADEMICO: "Coord. académico",
  COORD_ADMINISTRATIVO: "Coord. administrativo",
  DOCENTE: "Docente",
  ESTUDIANTE: "Estudiante",
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const { activeRole } = useAuth();

  const sections = navigationConfig
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        activeRole ? item.allowedRoles.includes(activeRole) : false
      ),
    }))
    .filter((section) => section.items.length > 0);

  const roleLabel = activeRole
    ? roleLabels[activeRole] ?? activeRole
    : "Usuario";

  return (
    <>
      {/* Fondo para móviles */}
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-navy/40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          border-r border-border bg-white
          transition-transform duration-300
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* Logo */}
        <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-border px-5">
        <div className="flex w-full items-center justify-center gap-3">
  <div className="flex items-center justify-center">
    <img 
      src={logoAnglosapiens} 
      alt="miau" 
      className="h-15 w-auto object-contain" 
    />
  </div>
</div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted hover:bg-surface-muted lg:hidden"
            aria-label="Cerrar navegación"
          >
            <X size={19} />
          </button>
        </div>

        {/* Perfil activo */}
        <div className="px-3 pt-4">
          <div className="rounded-lg bg-navy p-4 text-white">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck size={14} className="text-red" />

              <span className="text-[10px] font-extrabold tracking-wider">
                PERFIL ACTIVO
              </span>
            </div>

            <p className="text-sm font-bold">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-2 text-[10px] font-extrabold tracking-wider text-muted">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon =
                    icons[item.icon] ?? LayoutDashboard;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/inicio"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `
                        flex items-center gap-3 rounded-md
                        border-l-4 px-3 py-3 text-sm
                        transition-colors
                        ${
                          isActive
                            ? "border-red bg-navy-soft font-semibold text-navy"
                            : "border-transparent text-body hover:bg-surface-muted"
                        }
                        `
                      }
                    >
                      <Icon size={17} strokeWidth={1.9} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Pie del Sidebar */}
        <div className="flex shrink-0 items-center gap-3 border-t border-border p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-xs font-bold text-white">
            SA
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-navy">
              Sesión activa
            </p>

            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
              {roleLabel}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
