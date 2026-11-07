import type { NextFunction, Response } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../middlewares/auth.midleware.js";
import { AuthService } from "../services/auth.service.js";
import { loginSchema, cambiarContrasenaSchema } from "../validators/auth.validator.js";
import { AppError } from "../utils/appError.utils.js";

const validationError = (error: ZodError) =>
  new AppError(
    "Error de validación en los datos de entrada.",
    400,
    "VALIDATION_ERROR",
    error.issues.map((issue) => ({
      field: issue.path.join(".") || "general",
      message: issue.message,
    }))
  );

const mapAuthError = (error: unknown): unknown => {
  if (error instanceof AppError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "";
  if (message === "Credenciales incorrectas") {
    return new AppError("Credenciales incorrectas.", 401, "CREDENCIALES_INVALIDAS");
  }
  if (message === "Su cuenta se encuentra inactiva. Contacte al administrador.") {
    return new AppError(message, 403, "CUENTA_INACTIVA");
  }
  if (message === "Usuario no encontrado") {
    return new AppError(message, 404, "USUARIO_NO_ENCONTRADO");
  }
  if (message === "La contraseña actual es incorrecta") {
    return new AppError(message, 400, "CONTRASENA_ACTUAL_INVALIDA", [
      { field: "contrasenaActual", message },
    ]);
  }

  return error;
};

export const loginController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const datosValidados = loginSchema.parse(req.body);
    const resultado = await AuthService.login(
      datosValidados.username,
      datosValidados.contrasena
    );

    return res.status(200).json({
      exito: true,
      mensaje: "Inicio de sesión exitoso",
      datos: resultado,
    });
  } catch (error: unknown) {
    return next(
      error instanceof ZodError ? validationError(error) : mapAuthError(error)
    );
  }
};

export const cambiarContrasenaController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const datosValidados = cambiarContrasenaSchema.parse(req.body);
    const usuarioId = req.user?.usuarioId;

    if (!usuarioId) {
      throw new AppError("No autorizado.", 401, "NO_AUTORIZADO");
    }

    const resultado = await AuthService.cambiarContrasena(
      usuarioId,
      datosValidados.contrasenaActual,
      datosValidados.nuevaContrasena
    );

    return res.status(200).json({
      exito: true,
      ...resultado,
    });
  } catch (error: unknown) {
    return next(
      error instanceof ZodError ? validationError(error) : mapAuthError(error)
    );
  }
};

export const cerrarSesionUsuarioController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const usuarioId = req.user?.usuarioId;
    if (!usuarioId) {
      throw new AppError(
        "No autorizado: no se encontró una sesión activa en la petición.",
        401,
        "NO_AUTORIZADO"
      );
    }

    const resultado = await AuthService.cerrarSesion(usuarioId);
    return res.status(200).json({
      success: true,
      message: resultado.mensaje,
    });
  } catch (error: unknown) {
    return next(mapAuthError(error));
  }
};
