import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { aulas } from "../config/db/schema.js";

export type Aula = InferSelectModel<typeof aulas>;
export type InsertAula = InferInsertModel<typeof aulas>;
export interface FiltrosAula {
  activa?: boolean;
  busqueda?: string;
}
