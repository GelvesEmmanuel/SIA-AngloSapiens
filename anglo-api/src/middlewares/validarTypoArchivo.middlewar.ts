import { Request, NextFunction } from 'express';
import { AppError } from '../utils/appError.utils.js';

// Definimos explícitamente que tiposPermitidos es un array de strings (string[])
export const validarTipoArchivo = (tiposPermitidos: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    
    if (!file) {
      return next(new AppError(
        'No se recibió ningún archivo.',
        400,
        'ARCHIVO_REQUERIDO',
        [{ field: 'file', message: 'Adjunte un archivo.' }]
      ));
    }

    if (!tiposPermitidos.includes(file.mimetype)) {
      return next(new AppError(
        'El tipo de archivo no está permitido.',
        400,
        'TIPO_ARCHIVO_INVALIDO',
        [{ field: file.fieldname, message: `Tipos permitidos: ${tiposPermitidos.join(', ')}` }]
      ));
    }

    return next();
  };
};

// Middleware para validar múltiples archivos
export const validarMultiplesArchivos = (tiposPermitidos: string[], maxArchivos = 5) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const files = req.files;
    
    // 1. Validamos que existan archivos
    if (!files) {
      return next(new AppError(
        'No se recibieron archivos.',
        400,
        'ARCHIVOS_REQUERIDOS',
        [{ field: 'files', message: 'Adjunte al menos un archivo.' }]
      ));
    }

    // 2. Le aseguramos a TypeScript que 'files' es un arreglo plano (como lo entrega Multer con .array())
    if (!Array.isArray(files)) {
      return next(new AppError(
        'La estructura de archivos subidos no es válida.',
        400,
        'ARCHIVOS_INVALIDOS'
      ));
    }

    // Ahora TypeScript sabe que es un Array y te permite usar .length de forma segura
    if (files.length === 0) {
      return next(new AppError(
        'No se recibieron archivos.',
        400,
        'ARCHIVOS_REQUERIDOS',
        [{ field: 'files', message: 'Adjunte al menos un archivo.' }]
      ));
    }

    if (files.length > maxArchivos) {
      return next(new AppError(
        `Se permite un máximo de ${maxArchivos} archivos.`,
        400,
        'LIMITE_ARCHIVOS_EXCEDIDO',
        [{ field: 'files', message: `Máximo ${maxArchivos} archivos.` }]
      ));
    }

    // Ahora puedes usar .find() sin que TypeScript proteste
    const archivoInvalido = files.find(f => !tiposPermitidos.includes(f.mimetype));
    if (archivoInvalido) {
      return next(new AppError(
        'El tipo de archivo no está permitido.',
        400,
        'TIPO_ARCHIVO_INVALIDO',
        [{ field: archivoInvalido.fieldname, message: `Tipos permitidos: ${tiposPermitidos.join(', ')}` }]
      ));
    }

    return next();
  };
};
