import { z } from "zod";
import {
  estadoMatriculaEnum,
  estadoPagoEnum,
  modoPagoEnum,
  tipoMatriculaEnum,
} from "../config/db/schema.js";

const camposEditablesMatriculaSchema = z.object({
  tipoMatricula: z.enum(tipoMatriculaEnum.enumValues).optional(),
  valorAcordado: z.number().nonnegative().nullable().optional(),
  descuentoAplicado: z.number().nonnegative().nullable().optional(),
  modoPago: z.enum(modoPagoEnum.enumValues).nullable().optional(),
  estadoPago: z.enum(estadoPagoEnum.enumValues).optional(),
  observaciones: z.string().trim().nullable().optional(),
});

export const crearMatriculaSchema = camposEditablesMatriculaSchema
  .extend({
    estudianteId: z.string().uuid(),
    grupoId: z.string().uuid(),
  })
  .strict();

export const actualizarMatriculaSchema = camposEditablesMatriculaSchema
  .strict()
  .refine((datos) => Object.values(datos).some((valor) => valor !== undefined), {
    message: "Debe proporcionar al menos un campo para actualizar.",
  });

export const cambiarEstadoMatriculaSchema = z
  .object({
    estado: z.enum(
      estadoMatriculaEnum.enumValues.filter((estado) => estado !== "ACTIVA"),
    ),
    motivoCancelacion: z
      .string()
      .trim()
      .min(1, "El motivo de cancelación es obligatorio.")
      .optional(),
  })
  .superRefine((datos, contexto) => {
    if (datos.estado === "CANCELADA" && !datos.motivoCancelacion) {
      contexto.addIssue({
        code: "custom",
        path: ["motivoCancelacion"],
        message: "El motivo de cancelación es obligatorio.",
      });
    }
    if (datos.estado === "FINALIZADA" && datos.motivoCancelacion !== undefined) {
      contexto.addIssue({
        code: "custom",
        path: ["motivoCancelacion"],
        message: "El motivo de cancelación solo aplica a matrículas canceladas.",
      });
    }
  })
  .strict();

export const cambiarGrupoMatriculaSchema = z
  .object({
    grupoId: z.string().uuid(),
    motivo: z.string().trim().min(1, "El motivo del cambio de grupo es obligatorio."),
  })
  .strict();

export const filtrosMatriculaSchema = z
  .object({
    estudianteId: z.string().uuid().optional(),
    grupoId: z.string().uuid().optional(),
    estadoMatricula: z.enum(estadoMatriculaEnum.enumValues).optional(),
    estadoPago: z.enum(estadoPagoEnum.enumValues).optional(),
  })
  .strict();
