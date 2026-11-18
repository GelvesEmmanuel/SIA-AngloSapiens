import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middlewares/auth.midleware.js";
import { obtenerMisGrupos } from "../services/gestionAcademica.service.js";
import { AppError } from "../utils/appError.utils.js";

export const obtenerMisGruposController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const usuarioId = req.user?.usuarioId;
    if (!usuarioId) {
      throw new AppError("No autorizado.", 401, "NO_AUTORIZADO");
    }

    const grupos = await obtenerMisGrupos(usuarioId);
    return res.status(200).json({
      success: true,
      message: "Grupos del estudiante obtenidos exitosamente.",
      data: grupos,
    });
  } catch (error) {
    return next(error);
  }
};
