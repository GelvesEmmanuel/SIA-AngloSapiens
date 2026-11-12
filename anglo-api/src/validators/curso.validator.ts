import { z } from "zod";
import {
  estadoCursoEnum,
  habilidadEnum,
  nivelMcerEnum,
} from "../config/db/schema.js";

const habilidadesSchema = z
  .array(z.enum(habilidadEnum.enumValues))
  .min(1, "El curso debe incluir al menos una habilidad.")
  .refine(
    (habilidades) => new Set(habilidades).size === habilidades.length,
    "No se permiten habilidades duplicadas.",
  );

const camposCursoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del curso es obligatorio."),
  nivel: z.enum(nivelMcerEnum.enumValues),
  descripcion: z.string().trim().nullable().optional(),
  duracionSemanas: z.number().int().positive(),
  intensidadSemanal: z.number().int().positive(),
});

export const crearCursoSchema = camposCursoSchema
  .extend({ habilidades: habilidadesSchema })
  .strict();

export const actualizarCursoSchema = camposCursoSchema
  .partial()
  .extend({ habilidades: habilidadesSchema.optional() })
  .strict()
  .refine(
    (datos) => Object.values(datos).some((valor) => valor !== undefined),
    "Debe proporcionar al menos un campo para actualizar.",
  );

export const filtrosCursoSchema = z
  .object({
    estado: z.enum(estadoCursoEnum.enumValues).optional(),
    busqueda: z.string().trim().optional(),
  })
  .strict();
