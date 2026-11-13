import { z } from "zod";
import { estadoPeriodoEnum } from "../config/db/schema.js";

const camposPeriodoSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del periodo es obligatorio."),
  fechaInicio: z.iso.date(),
  fechaFin: z.iso.date(),
});

export const crearPeriodoAcademicoSchema = camposPeriodoSchema
  .refine((periodo) => periodo.fechaFin >= periodo.fechaInicio, {
    path: ["fechaFin"],
    message: "La fecha de fin debe ser igual o posterior a la fecha de inicio.",
  })
  .strict();

export const actualizarPeriodoAcademicoSchema = camposPeriodoSchema
  .partial()
  .strict()
  .refine((datos) => Object.values(datos).some((valor) => valor !== undefined), {
    message: "Debe proporcionar al menos un campo para actualizar.",
  });

export const filtrosPeriodoAcademicoSchema = z
  .object({
    estado: z.enum(estadoPeriodoEnum.enumValues).optional(),
    busqueda: z.string().trim().optional(),
  })
  .strict();

export const cambiarEstadoPeriodoAcademicoSchema = z
  .object({ estado: z.enum(estadoPeriodoEnum.enumValues) })
  .strict();
