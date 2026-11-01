import {z}  from 'zod'
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
export type CrearUsuarioAdminInput = z.infer<typeof crearUsuarioAdminSchema>;