export type EstadoCurso = "ACTIVO" | "INACTIVO";

export type NivelCurso = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type HabilidadCurso =
  | "SPEAKING"
  | "WRITING"
  | "LISTENING"
  | "READING"
  | "GRAMMAR"
  | "HOMEWORK"
  | "ASISTENCIA"
  | "PARTICIPATION"
  | "EXAMS";

export interface Curso {
  id: string;
  codigo: string;
  nombre: string;
  nivel: NivelCurso;
  descripcion: string | null;
  duracionSemanas: number;
  intensidadSemanal: number;
  estado: EstadoCurso;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  habilidades?: HabilidadCurso[];
}

export interface CursoPayload {
  nombre: string;
  nivel: NivelCurso;
  descripcion?: string | null;
  duracionSemanas: number;
  intensidadSemanal: number;
  habilidades: HabilidadCurso[];
}

export type ActualizarCursoPayload = Partial<CursoPayload>;

export interface ListarCursosParams {
  estado?: EstadoCurso;
  busqueda?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}