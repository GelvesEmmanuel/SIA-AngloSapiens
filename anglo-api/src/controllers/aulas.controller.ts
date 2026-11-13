import type { NextFunction, Response } from "express";
import { ZodError, z } from "zod";
import type { AuthRequest } from "../middlewares/auth.midleware.js";
import {
  actualizarAula,
  cambiarEstadoAula,
  crearAula,
  obtenerAulaPorId,
  obtenerAulas,
} from "../services/aula.service.js";
import { AppError } from "../utils/appError.utils.js";
import {
  actualizarAulaSchema,
  crearAulaSchema,
  filtrosAulaSchema,
} from "../validators/aula.validator.js";

const mapError = (error: unknown) =>
  error instanceof ZodError
    ? new AppError(
        "Error de validación en los datos de entrada.",
        400,
        "VALIDATION_ERROR",
        error.issues.map((issue) => ({
          field: issue.path.join(".") || "general",
          message: issue.message,
        })),
      )
    : error;

const obtenerId = (req: AuthRequest) =>
  z.string().uuid("El ID del aula debe ser un UUID válido.").parse(req.params.id);

const obtenerUsuarioId = (req: AuthRequest) => {
  if (!req.user?.usuarioId) throw new AppError("No autorizado.", 401, "NO_AUTORIZADO");
  return req.user.usuarioId;
};

/** Lista aulas con filtros de disponibilidad o nombre. */
export const listarAulasController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const aulas = await obtenerAulas(filtrosAulaSchema.parse(req.query));
    return res.status(200).json({ success: true, message: "Aulas listadas exitosamente.", data: aulas });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Obtiene un aula específica por ID. */
export const obtenerAulaPorIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const aula = await obtenerAulaPorId(obtenerId(req));
    return res.status(200).json({ success: true, message: "Aula encontrada exitosamente.", data: aula });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Crea un aula que queda activa para asignar grupos. */
export const crearAulaController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { nombre } = crearAulaSchema.parse(req.body);
    const aula = await crearAula(nombre, obtenerUsuarioId(req));
    return res.status(201).json({ success: true, message: "Aula creada exitosamente.", data: aula });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Actualiza el nombre del aula sin cambiar su disponibilidad. */
export const actualizarAulaController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { nombre } = actualizarAulaSchema.parse(req.body);
    const aula = await actualizarAula(obtenerId(req), nombre, obtenerUsuarioId(req));
    return res.status(200).json({ success: true, message: "Aula actualizada exitosamente.", data: aula });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Activa o desactiva un aula para controlar su disponibilidad en grupos. */
export const cambiarEstadoAulaController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { activa } = z.object({ activa: z.boolean() }).strict().parse(req.body);
    const aula = await cambiarEstadoAula(obtenerId(req), activa, obtenerUsuarioId(req));
    return res.status(200).json({ success: true, message: "Estado del aula actualizado.", data: aula });
  } catch (error) {
    return next(mapError(error));
  }
};
