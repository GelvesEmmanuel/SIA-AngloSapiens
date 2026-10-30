//Este archivo centralizará los permisos de todos los módulos. Empezaremos con los permisos de grupos y dejaremos preparados los demás dominios para ampliarlos conforme revisemos el backend.

import type { UserRole } from
  "../../features/auth/auth.types";

// Permisos disponibles en el sistema.
export type Permission =
  // Usuarios
  | "users:read"
  | "users:create"
  | "users:update"
  | "users:deactivate"

  // Estudiantes
  | "students:read"
  | "students:create"
  | "students:update"
  | "students:delete"

  // Docentes
  | "teachers:read"
  | "teachers:create"
  | "teachers:update"
  | "teachers:delete"

  // Cursos
  | "courses:read"
  | "courses:create"
  | "courses:update"
  | "courses:delete"

  // Grupos
  | "groups:read"
  | "groups:create"
  | "groups:update"
  | "groups:delete"
  | "groups:assign_teacher"
  | "groups:read_students"

  // Matrículas
  | "enrollments:read"
  | "enrollments:create"
  | "enrollments:update"
  | "enrollments:cancel"

  // Asistencias
  | "attendance:read"
  | "attendance:create"
  | "attendance:update"

  // Calificaciones
  | "grades:read"
  | "grades:create"
  | "grades:update"

  // Historial académico
  | "academic_history:read";

// Configuración centralizada por rol.
export const permissionsByRole:
  Record<UserRole, Permission[]> = {

  SUPER_ADMIN: [
    "users:read",
    "users:create",
    "users:update",
    "users:deactivate",

    "students:read",
    "students:create",
    "students:update",
    "students:delete",

    "teachers:read",
    "teachers:create",
    "teachers:update",
    "teachers:delete",

    "courses:read",
    "courses:create",
    "courses:update",
    "courses:delete",

    "groups:read",
    "groups:create",
    "groups:update",
    "groups:delete",
    "groups:assign_teacher",
    "groups:read_students",

    "enrollments:read",
    "enrollments:create",
    "enrollments:update",
    "enrollments:cancel",

    "attendance:read",
    "attendance:create",
    "attendance:update",

    "grades:read",
    "grades:create",
    "grades:update",

    "academic_history:read",
  ],

  COORD_ACADEMICO: [
    "students:read",
    "students:create",
    "students:update",

    "teachers:read",
    "teachers:create",
    "teachers:update",

    "courses:read",
    "courses:create",
    "courses:update",

    "groups:read",
    "groups:create",
    "groups:update",
    "groups:assign_teacher",
    "groups:read_students",

    "enrollments:read",
    "enrollments:create",
    "enrollments:update",

    "attendance:read",
    "grades:read",
    "grades:create",
    "grades:update",

    "academic_history:read",
  ],

  COORD_ADMINISTRATIVO: [
    "users:read",
    "students:read",
    "students:create",
    "students:update",

    "teachers:read",
    "teachers:create",
    "teachers:update",

    "groups:read",

    "enrollments:read",
    "enrollments:create",
    "enrollments:update",
    "enrollments:cancel",

    "academic_history:read",
  ],

  DOCENTE: [
    "courses:read",
    "groups:read",
    "groups:read_students",

    "attendance:read",
    "attendance:create",
    "attendance:update",

    "grades:read",
    "grades:create",
    "grades:update",

    "academic_history:read",
  ],

  ESTUDIANTE: [
    "courses:read",
    "groups:read",
    "attendance:read",
    "grades:read",
    "academic_history:read",
  ],
};
