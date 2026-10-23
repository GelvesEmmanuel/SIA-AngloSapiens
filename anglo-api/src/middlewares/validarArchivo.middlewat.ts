import { Request, Response, NextFunction } from 'express';

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
      return res.status(400).json({
        ok: false,
        error: 'No se recibieron archivos o la estructura no es válida'
      });
    }

    // Iteramos sobre las reglas de cada campo configurado
    for (const config of configuracionCampos) {
      const fileArray = files[config.name];

      // 1. Validar campos requeridos
      if (config.required && (!fileArray || fileArray.length === 0)) {
        return res.status(400).json({
          ok: false,
          error: `El campo obligatorio "${config.name}" es requerido y no fue enviado.`
        });
      }

      // 2. Si el archivo viene, validar su tipo MIME
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0]; // Tomamos el primero (o iteramos si permites varios por campo)
        
        if (!config.tiposPermitidos.includes(file.mimetype)) {
          return res.status(400).json({
            ok: false,
            error: `El archivo en el campo "${config.name}" ("${file.originalname}") tiene un tipo no permitido. Esperados: ${config.tiposPermitidos.join(', ')}`
          });
        }
      }
    }

    next();
  };
};