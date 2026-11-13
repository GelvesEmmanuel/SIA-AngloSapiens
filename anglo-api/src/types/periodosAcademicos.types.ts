import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { periodosAcademicos } from "../config/db/schema.js";

export type PeriodoAcademico = InferSelectModel<typeof periodosAcademicos>;
export type InsertPeriodoAcademico = InferInsertModel<typeof periodosAcademicos>;
export type EstadoPeriodo = PeriodoAcademico["estado"];
export type ActualizarPeriodoAcademico = Partial<
  Pick<InsertPeriodoAcademico, "nombre" | "fechaInicio" | "fechaFin">
>;

export interface FiltrosPeriodoAcademico {
  estado?: EstadoPeriodo;
  busqueda?: string;
}
