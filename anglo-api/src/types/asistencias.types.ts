import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { asistencias , sesionesClase} from "../config/db/schema.js";
// lectura SEECT
export type Asistencia = InferSelectModel<typeof asistencias>;
export type SesionClase = InferSelectModel<typeof sesionesClase>;

// escritura INSERT
export type InsertAsistencia = InferInsertModel<typeof asistencias>;
export type InsertSesionClase = InferInsertModel<typeof sesionesClase>;
// estudiante marcado como ausente
export interface EstudianteAusenteInput {
  estudianteId: string;
  motivoInasistencia?: string | null;
}

//payload recibe controlador para registrar o editar
export interface GuardarAsistenciaPayload {
  grupoId: string;
  fechaClase: string; // YYYY-MM-DD
  ausentes: EstudianteAusenteInput[]; // Si va vacío [], significa que hubo clase y todos asistieron
  usuarioId: string; // Para auditoría (extraído de req.user en el controlador)
  roles?: string[];
}

//Tipo de resumen / conteo de inasistencias por estudiante en un grupo (para reportes o vista del docente)
export interface ConteoInasistenciaEstudiante {
  estudianteId: string;
  totalInasistencias: number;
  totalSesionesDictadas: number;
}