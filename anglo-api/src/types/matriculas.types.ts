import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { matriculas } from "../config/db/schema.js";

export type Matricula = InferSelectModel<typeof matriculas>;
export type InsertMatricula = InferInsertModel<typeof matriculas>;
export type EstadoMatricula = Matricula["estadoMatricula"];

export interface CrearMatricula {
  estudianteId: string;
  grupoId: string;
  tipoMatricula?: Matricula["tipoMatricula"];
  valorAcordado?: number | null;
  descuentoAplicado?: number | null;
  modoPago?: Matricula["modoPago"];
  estadoPago?: Matricula["estadoPago"];
  observaciones?: string | null;
}

export type ActualizarMatricula = Partial<
  Pick<
    CrearMatricula,
    | "tipoMatricula"
    | "valorAcordado"
    | "descuentoAplicado"
    | "modoPago"
    | "estadoPago"
    | "observaciones"
  >
>;

export interface FiltrosMatricula {
  estudianteId?: string;
  grupoId?: string;
  estadoMatricula?: EstadoMatricula;
  estadoPago?: Matricula["estadoPago"];
}
