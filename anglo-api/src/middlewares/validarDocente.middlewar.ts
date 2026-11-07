import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/appError.utils.js';

export const validarSchema = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            'Error de validación en los datos de entrada',
            400,
            'VALIDATION_ERROR',
            error.issues.map((issue) => ({
              field: issue.path.join('.') || 'general',
              message: issue.message,
            }))
          )
        );
      }

      return next(error);
    }
  };
};