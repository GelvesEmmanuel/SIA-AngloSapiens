// src/db/schema.ts
import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const docentes = pgTable('docentes', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 50 }).notNull(),
  apellido: varchar('apellido', { length: 50 }).notNull(),
  correo: varchar('correo', { length: 50 }).notNull().unique(),
  telefono: varchar('telefono', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
    });


export const usuarios = pgTable('usuarios', {


})

export const estudiantes =pgTable('estudiantes',{})
export const cursos = pgTable('cursos',{})
export const grupos = pgTable('grupos',{})
export const matriculas = pgTable('matriculas', {})
