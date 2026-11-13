import type { NextFunction, Response } from "express";
import { ZodError, z } from "zod";
import type { AuthRequest } from "../middlewares/auth.midleware.js";
import {
  actualizarPeriodoAcademico,
  cambiarEstadoPeriodoAcademico,
  crearPeriodoAcademico,
  obtenerPeriodoAcademicoPorId,
  obtenerPeriodosAcademicos,
} from "../services/periodosAcademicos.service.js";
import { AppError } from "../utils/appError.utils.js";
import {
  actualizarPeriodoAcademicoSchema,
  cambiarEstadoPeriodoAcademicoSchema,
  crearPeriodoAcademicoSchema,
  filtrosPeriodoAcademicoSchema,
} from "../validators/periodosAcademicos.validator.js";

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
  z.string().uuid("El ID del periodo debe ser un UUID válido.").parse(req.params.id);

const obtenerUsuarioId = (req: AuthRequest) => {
  if (!req.user?.usuarioId) throw new AppError("No autorizado.", 401, "NO_AUTORIZADO");
  return req.user.usuarioId;
};

/** Lista los periodos académicos, filtrados por estado y nombre/código. */
export const listarPeriodosAcademicosController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const periodos = await obtenerPeriodosAcademicos(filtrosPeriodoAcademicoSchema.parse(req.query));
    return res.status(200).json({ success: true, message: "Periodos listados exitosamente.", data: periodos });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Obtiene un periodo académico por identificador. */
export const obtenerPeriodoAcademicoPorIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const periodo = await obtenerPeriodoAcademicoPorId(obtenerId(req));
    return res.status(200).json({ success: true, message: "Periodo encontrado exitosamente.", data: periodo });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Crea un periodo y permite al servicio asignar el código PER-000x. */
export const crearPeriodoAcademicoController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const datos = crearPeriodoAcademicoSchema.parse(req.body);
    const periodo = await crearPeriodoAcademico(datos, obtenerUsuarioId(req));
    return res.status(201).json({ success: true, message: "Periodo creado exitosamente.", data: periodo });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Actualiza nombre o fechas del periodo. */
export const actualizarPeriodoAcademicoController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const periodo = await actualizarPeriodoAcademico(
      obtenerId(req),
      actualizarPeriodoAcademicoSchema.parse(req.body),
      obtenerUsuarioId(req),
    );
    return res.status(200).json({ success: true, message: "Periodo actualizado exitosamente.", data: periodo });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Cambia el estado del periodo usando el enum definido en el esquema. */
export const cambiarEstadoPeriodoAcademicoController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { estado } = cambiarEstadoPeriodoAcademicoSchema.parse(req.body);
    const periodo = await cambiarEstadoPeriodoAcademico(
      obtenerId(req),
      estado,
      obtenerUsuarioId(req),
    );
    return res.status(200).json({ success: true, message: "Estado del periodo actualizado.", data: periodo });
  } catch (error) {
    return next(mapError(error));
  }
};
