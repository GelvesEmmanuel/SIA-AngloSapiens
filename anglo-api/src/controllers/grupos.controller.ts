import type { NextFunction, Response } from "express";
import { ZodError, z } from "zod";
import type { AuthRequest } from "../middlewares/auth.midleware.js";
import {
  actualizarGrupo,
  cambiarEstadoGrupo,
  cambiarDocenteGrupo,
  cancelarGrupo,
  crearGrupo,
  obtenerGrupoPorId,
  obtenerGrupos,
} from "../services/grupo.service.js";
import { AppError } from "../utils/appError.utils.js";
import {
  actualizarGrupoSchema,
  cambiarDocenteGrupoSchema,
  cambiarEstadoGrupoSchema,
  cancelarGrupoSchema,
  crearGrupoSchema,
  filtrosGrupoSchema,
} from "../validators/grupo.validator.js";

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
  z.string().uuid("El ID del grupo debe ser un UUID válido.").parse(req.params.id);

const obtenerUsuarioId = (req: AuthRequest) => {
  if (!req.user?.usuarioId) throw new AppError("No autorizado.", 401, "NO_AUTORIZADO");
  return req.user.usuarioId;
};

/** Lista grupos con sus horarios, aplicando los filtros recibidos. */
export const listarGruposController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const grupos = await obtenerGrupos(filtrosGrupoSchema.parse(req.query));
    return res.status(200).json({ success: true, message: "Grupos listados exitosamente.", data: grupos });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Devuelve un grupo y el detalle de sus horarios. */
export const obtenerGrupoPorIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const grupo = await obtenerGrupoPorId(obtenerId(req));
    return res.status(200).json({ success: true, message: "Grupo encontrado exitosamente.", data: grupo });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Crea un grupo, verificando disponibilidad y asignando su cupo inicial. */
export const crearGrupoController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const grupo = await crearGrupo(crearGrupoSchema.parse(req.body), obtenerUsuarioId(req));
    return res.status(201).json({ success: true, message: "Grupo creado exitosamente.", data: grupo });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Actualiza datos u horarios de un grupo existente. */
export const actualizarGrupoController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const grupo = await actualizarGrupo(
      obtenerId(req),
      actualizarGrupoSchema.parse(req.body),
      obtenerUsuarioId(req),
    );
    return res.status(200).json({ success: true, message: "Grupo actualizado exitosamente.", data: grupo });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Cambia el estado del grupo al valor permitido por el esquema. */
export const cambiarEstadoGrupoController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { estado } = cambiarEstadoGrupoSchema.parse(req.body);
    const grupo = await cambiarEstadoGrupo(obtenerId(req), estado, obtenerUsuarioId(req));
    return res.status(200).json({ success: true, message: "Estado del grupo actualizado.", data: grupo });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Cancela definitivamente un grupo programado con un motivo auditable. */
export const cancelarGrupoController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { motivo } = cancelarGrupoSchema.parse(req.body);
    const grupo = await cancelarGrupo(obtenerId(req), motivo, obtenerUsuarioId(req));
    return res.status(200).json({
      success: true,
      message: "Grupo cancelado definitivamente.",
      data: grupo,
    });
  } catch (error) {
    return next(mapError(error));
  }
};

/** Reasigna el docente validando su estado y disponibilidad horaria. */
export const cambiarDocenteGrupoController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { docenteId, motivo } = cambiarDocenteGrupoSchema.parse(req.body);
    const grupo = await cambiarDocenteGrupo(
      obtenerId(req),
      docenteId,
      motivo,
      obtenerUsuarioId(req),
    );
    return res.status(200).json({
      success: true,
      message: "Docente del grupo actualizado exitosamente.",
      data: grupo,
    });
  } catch (error) {
    return next(mapError(error));
  }
};