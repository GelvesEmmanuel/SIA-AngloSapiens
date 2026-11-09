import {contactoEstudiante} from "../config/db/schema.js"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"

export type InsertContacto = InferInsertModel<typeof contactoEstudiante>;
export type Contactos = InferSelectModel<typeof contactoEstudiante>;