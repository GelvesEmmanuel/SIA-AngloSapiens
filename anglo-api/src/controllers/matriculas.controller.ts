import type { NextFunction, Response } from "express";
import { ZodError, z } from "zod";
import type { AuthRequest } from "../middlewares/auth.midleware.js";
import {
  actualizarMatricula,
  cambiarEstadoMatricula,
  crearMatricula,
  obtenerMatriculaPorId,
  obtenerMatriculas,
} from "../services/matricula.service.js";
import { AppError } from "../utils/appError.utils.js";
import {
  actualizarMatriculaSchema,
  cambiarEstadoMatriculaSchema,
  crearMatriculaSchema,
  filtrosMatriculaSchema,
} from "../validators/matricula.validator.js";

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
  z.string().uuid("El ID de la matrícula debe ser un UUID válido.").parse(req.params.id);

const obtenerUsuarioId = (req: AuthRequest) => {
  if (!req.user?.usuarioId) throw new AppError("No autorizado.", 401, "NO_AUTORIZADO");
  return req.user.usuarioId;
};

/** Lista matrículas aplicando los filtros recibidos. */
export const listarMatriculasController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const matriculas = await obtenerMatriculas(filtrosMatriculaSchema.parse(req.query));
    return res.status(200).json({
      success: true,
      message: "Matrículas listadas exitosamente.",
      data: matriculas,
    });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Obtiene una matrícula por identificador. */
export const obtenerMatriculaPorIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const matricula = await obtenerMatriculaPorId(obtenerId(req));
    return res.status(200).json({
      success: true,
      message: "Matrícula encontrada exitosamente.",
      data: matricula,
    });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Matricula un estudiante en un grupo disponible. */
export const crearMatriculaController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const matricula = await crearMatricula(
      crearMatriculaSchema.parse(req.body),
      obtenerUsuarioId(req),
    );
    return res.status(201).json({
      success: true,
      message: "Estudiante matriculado exitosamente.",
      data: matricula,
    });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Actualiza campos no críticos de una matrícula. */
export const actualizarMatriculaController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const matricula = await actualizarMatricula(
      obtenerId(req),
      actualizarMatriculaSchema.parse(req.body),
      obtenerUsuarioId(req),
    );
    return res.status(200).json({
      success: true,
      message: "Matrícula actualizada exitosamente.",
      data: matricula,
    });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Cancela o finaliza una matrícula. */
export const cambiarEstadoMatriculaController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { estado } = cambiarEstadoMatriculaSchema.parse(req.body);
    const matricula = await cambiarEstadoMatricula(
      obtenerId(req),
      estado,
      obtenerUsuarioId(req),
    );
    return res.status(200).json({
      success: true,
      message: `Matrícula ${estado.toLowerCase()} exitosamente.`,
      data: matricula,
    });
  } catch (error) {
    return next(mapError(error));
  }
};
