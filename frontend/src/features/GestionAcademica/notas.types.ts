export type HabilidadNota =
  | "SPEAKING"
  | "WRITING"
  | "LISTENING"
  | "READING"
  | "GRAMMAR"
  | "HOMEWORK"
  | "ASISTENCIA"
  | "PARTICIPATION"
  | "EXAMS";

export interface NotaHabilidad {
  id: string;
  matriculaId: string;
  cursoId: string;
  habilidad: HabilidadNota;
  nota: string | number;
}

export interface NotasMatricula {
  matriculaId: string;
  estudianteId: string;
  grupoId: string;
  cursoId?: string;
  habilidadesConfiguradas?: HabilidadNota[];
  notas: NotaHabilidad[];
  notaExamenFinal: string | number | null;
  notaFinal: string | number | null;
  notasPublicadas?: boolean;
  mensaje?: string;
}

export interface ResumenNotasEstudiante {
  matriculaId: string;
  grupoId: string;
  cursoId: string;
  codigoMatricula: string;
  estadoMatricula: string;
  notasPublicadas: boolean;
  notaExamenFinal: string | number | null;
  notaFinal: string | number | null;
}

export interface NotaHabilidadPayload {
  habilidad: HabilidadNota;
  nota: number;
}

export interface NotasActualizadas {
  notas: NotaHabilidad[];
  notaFinal: string | null;
}

export interface ExamenFinalActualizado {
  matriculaId: string;
  notaExamenFinal: string;
  notaFinal: string | null;
}

export interface PublicacionNotasActualizada {
  id: string;
  notasPublicadas: boolean;
  notaExamenFinal: string | number | null;
  notaFinal: string | number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
