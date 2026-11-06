// 1. Importas tu tabla desde tu archivo de esquemas
import { docentes } from '../config/db/schema.js'; 

// 2. Importas el creador de plantillas de Drizzle
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

// 3. ¡Drizzle fabrica la plantilla automáticamente!
export type InsertDocente = InferInsertModel<typeof docentes>;
export type Docente = InferSelectModel<typeof docentes>;

export interface FiltrosDocente {
  estado?: string;
  busqueda?: string;
}
export enum EstadoDocente {
  REGISTRADO = "REGISTRADO",
  ACTIVO = "ACTIVO",
  INACTIVO = "INACTIVO"
}
export type DocenteConExpediente = typeof docentes.$inferSelect & {
  documentos: {
    id: string;
    categoria: "FOTO" | "CEDULA" | "FIRMA" | "CV" | "CERTIFICACION" | "DISCAPACIDAD";
    pathOriginal: string;
    url: string | null;
    estado: "VIGENTE" | "HISTORICO";
  }[];
};