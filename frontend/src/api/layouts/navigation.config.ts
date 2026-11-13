
import type { UserRole } from "../../features/auth/auth.types";

export interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  allowedRoles: UserRole[];
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const ALL_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "COORD_ACADEMICO",
  "COORD_ADMINISTRATIVO",
  "DOCENTE",
  "ESTUDIANTE",
];

const ADMIN_ROLES: UserRole[] = [
  "SUPER_ADMIN",
];

const COORD_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "COORD_ACADEMICO",
  "COORD_ADMINISTRATIVO",
];
/*
const ACADEMIC_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "COORD_ACADEMICO",
];
*/

export const navigationConfig: NavigationSection[] = [
  {
    title: "GENERAL",
    items: [
      {
        label: "Inicio",
        path: "/inicio",
        icon: "LayoutDashboard",
        allowedRoles: ALL_ROLES,
      },
    ],
  },
  {
    title: "ADMINISTRACIÓN",
    items: [
      {
        label: "Usuarios",
        path: "/usuarios",
        icon: "Users",
        allowedRoles: ADMIN_ROLES,
      },
      {
        label: "Estudiantes",
        path: "/estudiantes",
        icon: "GraduationCap",
        allowedRoles: COORD_ROLES,
      },
      {
        label: "Docentes",
        path: "/docentes",
        icon: "ContactRound",
        allowedRoles: COORD_ROLES,
      },
      {
        label: "Matrículas",
        path: "/matriculas",
        icon: "ClipboardList",
        allowedRoles: ["SUPER_ADMIN", "COORD_ADMINISTRATIVO"],
      },
    ],
  },
  {
    title: "GESTIÓN ACADÉMICA",
    items: [
      {
        label: "Cursos",
        path: "/cursos",
        icon: "BookOpen",
        allowedRoles: [
          "SUPER_ADMIN",
          "COORD_ACADEMICO",
          "COORD_ADMINISTRATIVO",
        ],
      },
      {
        label: "Grupos",
        path: "/grupos",
        icon: "UsersRound",
        allowedRoles: [
          "SUPER_ADMIN",
          "COORD_ACADEMICO",
          "COORD_ADMINISTRATIVO",
        ],
      },
      {
        label: "Periodos académicos",
        path: "/periodos",
        icon: "CalendarDays",
        allowedRoles: ["SUPER_ADMIN", "COORD_ACADEMICO"],
      },
      {
        label: "Aulas",
        path: "/aulas",
        icon: "School",
        allowedRoles: COORD_ROLES,
      },
      {
        label: "Asistencias",
        path: "/asistencias",
        icon: "CalendarCheck",
        allowedRoles: [
          "SUPER_ADMIN",
          "COORD_ACADEMICO",
          "DOCENTE",
          "ESTUDIANTE",
        ],
      },
      {
        label: "Calificaciones",
        path: "/calificaciones",
        icon: "ChartNoAxesColumn",
        allowedRoles: [
          "SUPER_ADMIN",
          "COORD_ACADEMICO",
          "DOCENTE",
          "ESTUDIANTE",
        ],
      },
      {
        label: "Historial académico",
        path: "/historial-academico",
        icon: "History",
        allowedRoles: [
          "SUPER_ADMIN",
          "COORD_ACADEMICO",
          "COORD_ADMINISTRATIVO",
          "ESTUDIANTE",
        ],
      },
    ],
  },
];
