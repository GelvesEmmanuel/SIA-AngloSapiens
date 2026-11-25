export type EstadoGrupoEstudiante =
  | "PROGRAMADO"
  | "EN_CURSO"
  | "FINALIZADO"
  | "CANCELADO";

export type DiaSemana =
  | "LUNES"
  | "MARTES"
  | "MIERCOLES"
  | "JUEVES"
  | "VIERNES"
  | "SABADO";

export interface HorarioEstudiante {
  id: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFin: string;
}

export interface GrupoEstudiante {
  id: string;
  codigo: string;
  estado: EstadoGrupoEstudiante;
  fechaInicio: string;
  fechaFin: string;
  curso: {
    id: string;
    codigo: string;
    nombre: string;
    nivel: string;
  };
  periodo: {
    id: string;
    codigo: string;
    nombre: string;
  };
  docente: {
    id: string;
    codigo: string;
    nombre: string;
    apellidos: string;
  } | null;
  horarios: HorarioEstudiante[];
}

export type GrupoDocente = Omit<GrupoEstudiante, "docente">;

export interface GrupoMatriculado {
  matriculaId: string;
  fechaMatricula: string;
  grupo: GrupoEstudiante;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
