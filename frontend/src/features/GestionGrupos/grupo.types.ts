export type EstadoGrupo = "PROGRAMADO" | "EN_CURSO" | "FINALIZADO" | "CANCELADO";
export type DiaSemana =
  | "LUNES"
  | "MARTES"
  | "MIERCOLES"
  | "JUEVES"
  | "VIERNES"
  | "SABADO";

export interface HorarioGrupo {
  id?: string;
  grupoId?: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
}

export interface Grupo {
  id: string;
  periodoId: string;
  cursoId: string;
  docenteId: string | null;
  aulaId: string | null;
  codigo: string;
  cupoMaximo: number;
  cuposDisponibles: number;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoGrupo;
  horarios: HorarioGrupo[];
}

export interface GrupoPayload {
  periodoId: string;
  cursoId: string;
  docenteId?: string | null;
  aulaId?: string | null;
  cupoMaximo: number;
  fechaInicio: string;
  fechaFin: string;
  horarios: HorarioGrupo[];
}

export interface FiltrosGrupo {
  periodoId?: string;
  cursoId?: string;
  docenteId?: string;
  aulaId?: string;
  estado?: EstadoGrupo;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
