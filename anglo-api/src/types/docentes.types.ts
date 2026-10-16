// 1. Importas tu tabla desde tu archivo de esquemas
import { docentes } from '../config/db/schema.js'; 

// 2. Importas el creador de plantillas de Drizzle
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

// 3. ¡Drizzle fabrica la plantilla automáticamente!
export type InsertDocente = InferInsertModel<typeof docentes>;
export type Docente = InferSelectModel<typeof docentes>;