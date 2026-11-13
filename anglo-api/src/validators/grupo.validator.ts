import { z } from "zod";
import {
  diaSemanaEnum,
  estadoGrupoEnum,
} from "../config/db/schema.js";

const horarioSchema = z
  .object({
    diaSemana: z.enum(diaSemanaEnum.enumValues),
    horaInicio: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use el formato HH:MM."),
    horaFin: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use el formato HH:MM."),
  })
  .refine(({ horaInicio, horaFin }) => horaFin > horaInicio, {
    path: ["horaFin"],
    message: "La hora de fin debe ser posterior a la hora de inicio.",
  });

const horariosSchema = z
  .array(horarioSchema)
  .min(1, "El grupo debe tener al menos un horario.")
  .refine(
    (horarios) => new Set(horarios.map(({ diaSemana }) => diaSemana)).size === horarios.length,
    "No se permiten horarios duplicados para el mismo día.",
  );

const camposGrupoSchema = z.object({
  periodoId: z.string().uuid(),
  cursoId: z.string().uuid(),
  docenteId: z.string().uuid().nullable().optional(),
  aulaId: z.string().uuid().nullable().optional(),
  cupoMaximo: z.number().int().positive(),
  fechaInicio: z.iso.date(),
  fechaFin: z.iso.date(),
});

export const crearGrupoSchema = camposGrupoSchema
  .extend({ horarios: horariosSchema })
  .refine((grupo) => grupo.fechaFin >= grupo.fechaInicio, {
    path: ["fechaFin"],
    message: "La fecha de fin debe ser igual o posterior a la fecha de inicio.",
  })
  .strict();

export const actualizarGrupoSchema = camposGrupoSchema
  .omit({ docenteId: true })
  .partial()
  .extend({ horarios: horariosSchema.optional() })
  .strict()
  .refine((datos) => Object.values(datos).some((valor) => valor !== undefined), {
    message: "Debe proporcionar al menos un campo para actualizar.",
  })
  .refine(
    (datos) =>
      datos.fechaInicio === undefined ||
      datos.fechaFin === undefined ||
      datos.fechaFin >= datos.fechaInicio,
    { path: ["fechaFin"], message: "La fecha de fin debe ser igual o posterior a la fecha de inicio." },
  );

export const filtrosGrupoSchema = z
  .object({
    periodoId: z.string().uuid().optional(),
    cursoId: z.string().uuid().optional(),
    docenteId: z.string().uuid().optional(),
    aulaId: z.string().uuid().optional(),
    estado: z.enum(estadoGrupoEnum.enumValues).optional(),
  })
  .strict();

export const cambiarEstadoGrupoSchema = z
  .object({
    estado: z.enum(
      estadoGrupoEnum.enumValues.filter((estado) => estado !== "CANCELADO"),
    ),
  })
  .strict();

export const cancelarGrupoSchema = z
  .object({ motivo: z.string().trim().min(1, "El motivo de cancelación es obligatorio.") })
  .strict();

export const cambiarDocenteGrupoSchema = z
  .object({
    docenteId: z.string().uuid(),
    motivo: z.string().trim().min(1, "El motivo del cambio de docente es obligatorio."),
  })
  .strict();
