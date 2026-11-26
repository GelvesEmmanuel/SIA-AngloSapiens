import {z} from 'zod'
// validar el inicio de sesion


export const loginSchema = z.object({

    username: z.string().min(1, {message: "El usuario  es requerido"}),
    contrasena: z.string().min(1,{message: " la contraseña es requeridad"}),
});

export const cambiarContrasenaSchema = z.object({
    contrasenaActual:z.string().min(1,{message: 'la contraseña actual es requeridad '}),
    nuevaContrasena:z.string().min(6,{message: 'la nueva contraseña debe de tener almenos 6 caracteres'}),
})

export const cambiarContrasenaSesionSchema = z.object({
    contrasenaActual: z.string().min(1, { message: 'La contraseña actual es requerida.' }),
    nuevaContrasena: z.string().min(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres.' }),
}).refine((datos) => datos.contrasenaActual !== datos.nuevaContrasena, {
    message: 'La nueva contraseña debe ser diferente de la actual.',
    path: ['nuevaContrasena'],
});