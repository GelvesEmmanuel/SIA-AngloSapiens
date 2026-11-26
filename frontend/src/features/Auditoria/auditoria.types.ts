export const TABLAS_AUDITABLES = [
  "grupos",
  "cursos",
  "matriculas",
  "usuarios",
  "estudiantes",
  "docentes",
  "periodos_academicos",
] as const;

export type TablaAuditable = (typeof TABLAS_AUDITABLES)[number];
export type AccionAuditoria = "CREATE" | "UPDATE" | "DELETE";

export interface Auditoria {
  id: string;
  usuarioId: string;
  tablaAfectada: TablaAuditable;
  registroId: string;
  accion: AccionAuditoria;
  datosAntiguos: unknown | null;
  datosNuevos: unknown | null;
  motivo: string | null;
  createdAt: string;
}

export interface AuditoriasResponse {
  success: boolean;
  message: string;
  data: Auditoria[];
}
