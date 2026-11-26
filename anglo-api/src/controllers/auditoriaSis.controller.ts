import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middlewares/auth.midleware.js";
import {
  obtenerAuditorias,
  TABLAS_AUDITABLES,
} from "../services/auditoriaSis.service.js";
import { AppError } from "../utils/appError.utils.js";

const filtroAuditoriaSchema = z.object({
  tablaAfectada: z.enum(TABLAS_AUDITABLES).optional(),
});

export const obtenerAuditoriasController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tablaAfectada } = filtroAuditoriaSchema.parse(req.query);
    const auditorias = await obtenerAuditorias(tablaAfectada);

    return res.status(200).json({
      success: true,
      message: "Auditorías obtenidas exitosamente.",
      data: auditorias,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(
          "La tabla indicada no está habilitada para consulta.",
          400,
          "TABLA_AUDITORIA_INVALIDA",
          error.issues.map((issue) => ({
            field: issue.path.join(".") || "tablaAfectada",
            message: issue.message,
          })),
        ),
      );
    }

    return next(error);
  }
};
