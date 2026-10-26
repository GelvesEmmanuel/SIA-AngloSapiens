import {z} from 'zod'
// validar el inicio de sesion

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
export const loginSchema = z.object({

    username: z.string().min(1, {message: "El usuario  es requerido"}),
    contrasena: z.string().min(1,{message: " la contraseña es requeridad"}),
});

export const cambiarContrasenaSchema = z.object({
    contrasenaActual:z.string().min(1,{message: 'la contraseña actual es requeridad '}),
    nuevaContrasena:z.string().min(6,{message: 'la nueva contraseña debe de tener almenos 6 caracteres'}),
})