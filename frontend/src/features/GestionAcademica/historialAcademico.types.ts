export interface EstudianteResumenHistorial {
  id: string;
  codigo: string;
  nombre: string;
  apellidos: string;
  numeroDocumento: string;
}

export interface MatriculaHistorial {
  id: string;
  codigo: string;
  tipoMatricula: string;
  estadoMatricula: string;
  estadoPago: string;
  notasPublicadas: boolean;
  fechaMatricula: string;
  fechaFinalizacion: string | null;
}

export interface PeriodoHistorial {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface CursoHistorial {
  id: string;
  codigo: string;
  nombre: string;
  nivel: string | null;
  totalHabilidadesConfiguradas: number;
}

export interface GrupoHistorial {
  id: string;
  codigo: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface NotaHabilidadHistorial {
  id: string;
  habilidad: string;
  nota: string; // Viene como string desde numeric/decimal en Postgres/Drizzle
}

export interface CalificacionesHistorial {
  visible: boolean;
  notasPorHabilidad: NotaHabilidadHistorial[];
  promedioHabilidades: number | null;
  notaExamenFinal: string | null;
  notaFinal: string | null;
}

export interface RegistroHistorialAcademico {
  matricula: MatriculaHistorial;
  periodo: PeriodoHistorial;
  curso: CursoHistorial;
  grupo: GrupoHistorial;
  calificaciones: CalificacionesHistorial;
}

export interface HistorialAcademicoResponse {
  estudiante: EstudianteResumenHistorial;
  totalRegistros: number;
  historial: RegistroHistorialAcademico[];
}

export interface ObtenerHistorialAcademicoParams {
  incluirNoFinalizadas?: boolean;
}