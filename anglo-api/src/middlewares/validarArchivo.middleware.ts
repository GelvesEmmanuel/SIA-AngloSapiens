import { Request, NextFunction } from 'express';
import { AppError } from '../utils/appError.utils.js';

interface FieldConfig {
  name: string;
  tiposPermitidos: string[];
  required?: boolean;
}

/**
 * Middleware para validar archivos agrupados por campos específicos (ej. multer.fields)
 */
export const validarArchivosPorCampos = (configuracionCampos: FieldConfig[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Si req.files no existe o no es un objeto
    if (!files || typeof files !== 'object' || Array.isArray(files)) {
      return next(new AppError(
        'No se recibieron archivos o la estructura no es válida.',
        400,
        'ARCHIVOS_INVALIDOS',
        [{ field: 'files', message: 'Revise los archivos adjuntos.' }]
      ));
    }

    // Iteramos sobre las reglas de cada campo configurado
    for (const config of configuracionCampos) {
      const fileArray = files[config.name];

      // 1. Validar campos requeridos
      if (config.required && (!fileArray || fileArray.length === 0)) {
        return next(new AppError(
          `El campo obligatorio "${config.name}" es requerido y no fue enviado.`,
          400,
          'ARCHIVO_REQUERIDO',
          [{ field: config.name, message: 'Adjunte este archivo.' }]
        ));
      }

      // 2. Si el archivo viene, validar su tipo MIME
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0]; // Tomamos el primero (o iteramos si permites varios por campo)
        
        if (!config.tiposPermitidos.includes(file.mimetype)) {
          return next(new AppError(
            `El archivo en el campo "${config.name}" tiene un tipo no permitido.`,
            400,
            'TIPO_ARCHIVO_INVALIDO',
            [{
              field: config.name,
              message: `Tipos permitidos: ${config.tiposPermitidos.join(', ')}`,
            }]
          ));
        }
      }
    }

    return next();
  };
};