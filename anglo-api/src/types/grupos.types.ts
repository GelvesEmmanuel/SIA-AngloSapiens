import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { grupos, horariosGrupos } from "../config/db/schema.js";

export type Grupo = InferSelectModel<typeof grupos>;
export type InsertGrupo = InferInsertModel<typeof grupos>;
export type HorarioGrupo = InferSelectModel<typeof horariosGrupos>;
export type InsertHorarioGrupo = InferInsertModel<typeof horariosGrupos>;
export type EstadoGrupo = Grupo["estado"];

export interface GrupoConHorarios extends Grupo {
  horarios: HorarioGrupo[];
}

export interface FiltrosGrupo {
  periodoId?: string;
  cursoId?: string;
  docenteId?: string;
  aulaId?: string;
  estado?: EstadoGrupo;
}

export interface CrearGrupo {
  periodoId: string;
  cursoId: string;
  docenteId?: string | null;
  aulaId?: string | null;
  cupoMaximo: number;
  fechaInicio: string;
  fechaFin: string;
  horarios: Array<Pick<InsertHorarioGrupo, "diaSemana" | "horaInicio" | "horaFin">>;
}

export type ActualizarGrupo = Partial<Omit<CrearGrupo, "horarios" | "docenteId">> & {
  horarios?: CrearGrupo["horarios"];
};
