import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { AppError } from "../utils/appError.utils.js";
import { cleanupTemporaryFiles } from "../utils/uploadCleanup.utils.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const errorHandler: ErrorRequestHandler = async (
  err: unknown,
  req,
  res,
  next
) => {
  if (res.headersSent) {
    return next(err);
  }

  const uploadedFiles = [
    ...(req.file ? [req.file] : []),
    ...(Array.isArray(req.files)
      ? req.files
      : req.files
        ? Object.values(req.files).flat()
        : []),
  ];
  await cleanupTemporaryFiles(uploadedFiles.map((file) => file.path));

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
      code: err.code,
      errors: err.errors ?? null,
    });
  }

  if (err instanceof multer.MulterError) {
    const isFileTooLarge = err.code === "LIMIT_FILE_SIZE";
    const message = isFileTooLarge
      ? "El archivo supera el tamaño máximo permitido."
      : "No se pudo procesar el archivo enviado.";

    return res.status(isFileTooLarge ? 413 : 400).json({
      success: false,
      message,
      data: null,
      code: isFileTooLarge ? "FILE_TOO_LARGE" : "UPLOAD_ERROR",
      errors: [{ field: err.field || "file", message }],
    });
  }

  if (isRecord(err) && err.code === "23505") {
    const message = "Ya existe un registro con estos datos en el sistema.";
    return res.status(409).json({
      success: false,
      message: "No se pudo completar la operación.",
      data: null,
      code: "REGISTRO_DUPLICADO",
      errors: [{ field: "general", message }],
    });
  }

  console.error("Error inesperado al procesar la solicitud:", err);
  return res.status(500).json({
    success: false,
    message: "Error interno al procesar la solicitud.",
    data: null,
    code: "INTERNAL_SERVER_ERROR",
    errors: null,
  });
};
