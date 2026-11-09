import { Interface } from "readline";
import { estudiantes } from "../config/db/schema.js";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

//3. Drizzle fabrica las plantilas automaticamente
export type InsertEstudiante = InferInsertModel<typeof estudiantes>;
export type Estudiante = InferSelectModel<typeof estudiantes>;

export interface FiltrosEstudiante {
  estado?: string;
  busqueda?: string;
}

export enum EstadoEstudiante {
  PRE_REGISTRADO = "PRE_REGISTRADO",
  REGISTRADO = "REGISTRADO",
  MATRICULADO = "MATRICULADO",
  INACTIVO = "INACTIVO",
}
export type EstudianteConExpediente = typeof estudiantes.$inferSelect & {
  documentos: {
    id: string;
    categoria: "FOTO" | "CEDULA" | "FIRMA" | "DISCAPACIDAD";
    pathOriginal: string;
    url: string | null;
    estado: "VIGENTE" | "HISTORICO";
  }[];
};
