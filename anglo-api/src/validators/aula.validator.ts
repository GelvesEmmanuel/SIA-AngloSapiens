import { z } from "zod";

export const crearAulaSchema = z
  .object({ nombre: z.string().trim().min(1).max(50) })
  .strict();

export const actualizarAulaSchema = crearAulaSchema;

export const filtrosAulaSchema = z
  .object({
    activa: z
      .enum(["true", "false"])
      .transform((valor) => valor === "true")
      .optional(),
    busqueda: z.string().trim().optional(),
  })
  .strict();
