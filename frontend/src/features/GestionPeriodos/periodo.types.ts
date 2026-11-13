export type EstadoPeriodo = "PROGRAMADO" | "ACTIVO" | "FINALIZADO" | "INACTIVO";

export interface PeriodoAcademico {
  id: string;
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoPeriodo;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodoPayload {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
