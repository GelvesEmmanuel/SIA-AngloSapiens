 import { cursos, habilidadesCurso } from '../config/db/schema.js'
 import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

 export type InsertCurso= InferInsertModel<typeof cursos>;
 export type Curso = InferSelectModel<typeof cursos>;
 export type EstadoCurso = Curso["estado"];
 export type CursoConHabilidades = Curso & {
   habilidades: HabilidadCurso[];
 };
 export type ActualizarCurso = Partial<
   Pick<
     InsertCurso,
     "nombre" | "nivel" | "descripcion" | "duracionSemanas" | "intensidadSemanal"
   >
 > & {
   habilidades?: HabilidadCurso[];
 };

 export interface FiltrosCurso {
   estado?: EstadoCurso;
  busqueda?: string;
}

export enum cursoEstado {
    ACTIVO = "ACTIVO",
    INACTIVO = "INACTIVO",
}

 export type Inserthabilidad= InferInsertModel<typeof habilidadesCurso>;
 export type HabiliadC = InferSelectModel<typeof habilidadesCurso>;


export type HabilidadCurso = 
  | "SPEAKING"
  | "WRITING"
  | "LISTENING"
  | "READING"
  | "GRAMMAR"
  | "HOMEWORK"
  | "ASISTENCIA"
  | "PARTICIPATION"
  | "EXAMS";

  export type NivelCurso = 
  |"A1"
  |"A2"
  |"B1"
  |"B2"
  |"C1"
  |"C2";

