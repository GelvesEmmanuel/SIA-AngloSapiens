import {z}  from 'zod'
import { rolUsuarioEnum } from '../config/db/schema.js'

export const crearUsuarioAdminSchema = z.object({
  primerNombre: z.string().min(1, 'El primer nombre es obligatorio'),
  segundoNombre: z.string().optional(),
  primerApellido: z.string().min(1, 'El primer apellido es obligatorio'),
  segundoApellido: z.string().optional(),
  documentoIdentidad: z.string().min(5, 'El documento de identidad es obligatorio'),
  diaCumpleanos: z.number().int().min(1).max(31, 'Día de cumpleaños inválido'),
  rol: z.enum(['COORD_ACADEMICO', 'COORD_ADMINISTRATIVO'] as const, {
    message: 'Rol no permitido o inválido',
  }),
});

export const asignarRolUsuarioSchema = z.object({
  rol: z.enum(rolUsuarioEnum.enumValues, {
    message: 'Rol no permitido o inválido',
  }),
});

export const buscarUsuarioCoordinadorSchema = z.object({
  documentoIdentidad: z.string().trim().min(5, 'El documento de identidad es obligatorio'),
});

export const convertirUsuarioEnCoordinadorSchema = z.object({
  documentoIdentidad: z.string().trim().min(5, 'El documento de identidad es obligatorio'),
  rol: z.enum(['COORD_ACADEMICO', 'COORD_ADMINISTRATIVO'], {
    message: 'Seleccione COORD_ACADEMICO o COORD_ADMINISTRATIVO',
  }),
});

export type CrearUsuarioAdminInput = z.infer<typeof crearUsuarioAdminSchema>;