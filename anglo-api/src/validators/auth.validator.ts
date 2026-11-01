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