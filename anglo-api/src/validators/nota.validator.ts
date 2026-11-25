import { z } from "zod";
import { habilidadEnum } from "../config/db/schema.js";

const notaSchema = z.number().min(0).max(5);

export const registrarNotasSchema = z
  .object({
    notas: z
      .array(
        z
          .object({
            habilidad: z.enum(habilidadEnum.enumValues),
            nota: notaSchema,
          })
          .strict(),
      )
      .min(1, "Debe proporcionar al menos una nota.")
      .refine(
        (items) =>
          new Set(items.map((item) => item.habilidad)).size === items.length,
        "No se puede registrar la misma habilidad más de una vez.",
      ),
  })
  .strict();

export const actualizarNotaSchema = z
  .object({
    nota: notaSchema,
  })
  .strict();

export const notaExamenFinalSchema = z
  .object({
    notaExamenFinal: notaSchema,
  })
  .strict();

export const publicarNotasSchema = z
  .object({
    notasPublicadas: z.boolean(),
  })
  .strict();
