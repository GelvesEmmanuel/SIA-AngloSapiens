import type { InferSelectModel } from "drizzle-orm";
import { notas } from "../config/db/schema.js";

export type Nota = InferSelectModel<typeof notas>;

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
  habilidad: HabilidadNota;
  nota: number;
}

export interface RegistrarNotas {
  notas: NotaHabilidad[];
}
