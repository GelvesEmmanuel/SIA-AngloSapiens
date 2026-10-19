import { Request, Response, NextFunction } from 'express';

// Definimos explícitamente que tiposPermitidos es un array de strings (string[])
export const validarTipoArchivo = (tiposPermitidos: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ 
        error: 'No se recibió ningún archivo' 
      });
    }

    if (!tiposPermitidos.includes(file.mimetype)) {
      return res.status(400).json({ 
        error: `Tipo de archivo no permitido. Se esperaba: ${tiposPermitidos.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware para validar múltiples archivos
export const validarMultiplesArchivos = (tiposPermitidos: string[], maxArchivos = 5) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const files = req.files;
    
    // 1. Validamos que existan archivos
    if (!files) {
      return res.status(400).json({ 
        error: 'No se recibieron archivos' 
      });
    }

    // 2. Le aseguramos a TypeScript que 'files' es un arreglo plano (como lo entrega Multer con .array())
    if (!Array.isArray(files)) {
      return res.status(400).json({
        error: 'La estructura de archivos subidos no es válida'
      });
    }

    // Ahora TypeScript sabe que es un Array y te permite usar .length de forma segura
    if (files.length === 0) {
      return res.status(400).json({ 
        error: 'No se recibieron archivos' 
      });
    }

    if (files.length > maxArchivos) {
      return res.status(400).json({ 
        error: `Máximo ${maxArchivos} archivos permitidos` 
      });
    }

    // Ahora puedes usar .find() sin que TypeScript proteste
    const archivoInvalido = files.find(f => !tiposPermitidos.includes(f.mimetype));
    if (archivoInvalido) {
      return res.status(400).json({ 
        error: `Archivo "${archivoInvalido.originalname}" tiene tipo no permitido` 
      });
    }

    next();
  };
};
