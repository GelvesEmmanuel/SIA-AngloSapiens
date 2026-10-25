import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validarSchema = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      // Validamos si el error es realmente una instancia de ZodError
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Error de validación en los datos de entrada',
          errors: error.issues.map((err) => ({
            campo: err.path.join('.'),
            mensaje: err.message
          }))
        });
      }

      // Por si ocurre cualquier otro error inesperado
      return res.status(500).json({
        success: false,
        message: 'Error interno en la validación',
        error: error.message
      });
    }
  };
};