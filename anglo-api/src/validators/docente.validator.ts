// aqui configuro Zod para validar los datos de entrada del docente luego hago uso de el en un midelware y luego el midleware en la ruta docentes
import { z } from 'zod';

export const crearDocenteSchema = z.object({
  // generado automaticamentecodigo: z.string().trim().min(1, 'El código es obligatorio'),
  usuarioId: z.preprocess((val)=> (val == '' || val == null ? undefined : val), z.string().uuid('El ID de usuario debe ser un UUID válido').optional()),
  tipoDocumento: z.enum(['CC', 'CE', 'TI', 'PAS'], {
    message: '  Tipo de documento no válido'
  }),
  numeroDocumento: z.string().trim().min(5, 'El número de documento es obligatorio'),
  nombre: z.string().trim().min(2, 'El nombre es obligatorio'),
  apellidos: z.string().trim().min(2, 'Los apellidos son obligatorios'),
  fechaNacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  telefono: z.string().trim().optional().nullable(),
  formacionAcademica: z.string().trim().optional().nullable(),
  reportaDiscapacidad: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return val;
}, z.boolean().default(false)),
});