import { z } from 'zod';

// Esquema secundario para validar cada contacto individualmente dentro del arreglo
const contactoSchema = z.object({
  tipo: z.string().min(1, 'El tipo de contacto es obligatorio'),
  nombre: z.string().trim().min(2, 'El nombre del contacto es obligatorio'),
  apellidos: z.string().trim().min(2, 'Los apellidos del contacto son obligatorios'),
  tipoDocumento: z.string().optional().nullable(),
  numeroDocumento: z.string().optional().nullable(),
  telefono: z.string().trim().min(7, 'El teléfono del contacto es obligatorio'),
  direccion: z.string().optional().nullable(),
  ocupacion: z.string().optional().nullable(),
  parentesco: z.string().trim().min(2, 'El parentesco es obligatorio'),
});

export const crearEstudianteSchema = z.object({
  // Generado automaticamente
  usuarioId: z.preprocess(
    (val) => (val === '' || val == null ? undefined : val),
    z.string().uuid('El ID de usuario debe ser un UUID válido').optional()
  ),

  tipoDocumento: z.enum(['CC', 'CE', 'TI', 'PAS'], {
    message: 'Tipo de documento no válido'
  }),

  numeroDocumento: z.string().trim().min(5, 'El número de documento es obligatorio'),

  nombre: z.string().trim().min(2, 'El nombre es obligatorio'),

  apellidos: z.string().trim().min(2, 'Los apellidos son obligatorios'),

  fechaNacimiento: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    'Formato de fecha inválido (YYYY-MM-DD)'
  ),

  telefono: z.string().trim().max(20, 'El teléfono no puede superar los 20 caracteres').optional().nullable(),

  gradoAcademico: z.string().trim().max(100, 'El grado académico no puede superar los 100 caracteres').optional().nullable(),

  institucionEducativa: z.string().trim().max(150, 'La institución educativa no puede superar los 150 caracteres').optional().nullable(),

  reportaDiscapacidad: z.preprocess(
    (val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return val;
    },
    z.boolean().default(false)
  ),

  // ✨ AQUÍ ESTÁ LA MAGIA: Preprocesamos el string JSON de FormData y lo convertimos en un Array validado
  contactos: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch (e) {
          return val; // Si falla el parseo, lo retorna para que Zod lance error de tipo
        }
      }
      return val;
    },
    z.array(contactoSchema, {
      message: 'Los contactos deben ser un arreglo válido'
    }).min(1, 'Debe registrar al menos un contacto')
  ),
});