import type { NextFunction, Request, Response } from "express";
import { obtenerUrlFirmada } from "../services/storage.service.js";
import { archivos } from "../config/db/schema.js";
import { db } from "../config/db.js";
import { eq } from "drizzle-orm";
import { AppError } from "../utils/appError.utils.js";

export const verArchivoController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { path } = req.query;

    if (!path || typeof path !== "string") {
      throw new AppError(
        'El parámetro "path" es requerido y debe ser una cadena de texto válida.',
        400,
        "PARAMETRO_INVALIDO",
        [{ field: "path", message: "Ingrese una ruta de archivo válida." }]
      );
    }

    const [archivoRegistrado] = await db
      .select()
      .from(archivos)
      .where(eq(archivos.urlArchivo, path))
      .limit(1);

    if (!archivoRegistrado) {
      throw new AppError(
        "El archivo solicitado no se encuentra registrado en el sistema.",
        404,
        "ARCHIVO_NO_ENCONTRADO"
      );
    }

    const signedUrl = await obtenerUrlFirmada(path, 3600);

    return res.status(200).json({
      success: true,
      url: signedUrl,
      categoria: archivoRegistrado.categoria,
      estado: archivoRegistrado.estado,
    });
  } catch (error: unknown) {
    return next(error);
  }
};
