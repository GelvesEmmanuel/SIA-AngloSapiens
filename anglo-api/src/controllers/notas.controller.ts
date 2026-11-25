import type { NextFunction, Response } from "express";
import { ZodError, z } from "zod";
import type { AuthRequest } from "../middlewares/auth.midleware.js";
import {
  actualizarNotaHabilidad,
  cambiarPublicacionNotas,
  consultarMisNotas,
  consultarNotasEstudiante,
  consultarNotasMatricula,
  registrarNotaExamenFinal,
  registrarNotasHabilidades,
} from "../services/nota.service.js";
import { AppError } from "../utils/appError.utils.js";
import {
  actualizarNotaSchema,
  notaExamenFinalSchema,
  publicarNotasSchema,
  registrarNotasSchema,
} from "../validators/nota.validator.js";

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

const obtenerUsuario = (req: AuthRequest) => {
  if (!req.user?.usuarioId) throw new AppError("No autorizado.", 401, "NO_AUTORIZADO");
  return { usuarioId: req.user.usuarioId, roles: req.user.roles };
};

const uuid = (valor: string, mensaje: string) =>
  z.string().uuid(mensaje).parse(valor);

const obtenerParametro = (valor: string | string[] | undefined, mensaje: string) => {
  if (typeof valor !== "string") {
    throw new AppError(mensaje, 400, "VALIDATION_ERROR");
  }
  return uuid(valor, mensaje);
};

export const registrarNotasController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { usuarioId, roles } = obtenerUsuario(req);
    const matriculaId = obtenerParametro(
      req.params.matriculaId,
      "La matrícula debe tener un UUID válido.",
    );
    const { notas } = registrarNotasSchema.parse(req.body);
    const resultado = await registrarNotasHabilidades(matriculaId, notas, usuarioId, roles);
    return res.status(200).json({
      success: true,
      message: "Notas registradas exitosamente.",
      data: resultado,
    });
  } catch (error) {
    return next(mapError(error));
  }
};

export const actualizarNotaController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { usuarioId, roles } = obtenerUsuario(req);
    const notaId = obtenerParametro(req.params.notaId, "La nota debe tener un UUID válido.");
    const { nota } = actualizarNotaSchema.parse(req.body);
    const resultado = await actualizarNotaHabilidad(notaId, nota, usuarioId, roles);
    return res.status(200).json({
      success: true,
      message: "Nota actualizada exitosamente.",
      data: resultado,
    });
  } catch (error) {
    return next(mapError(error));
  }
};

export const registrarExamenFinalController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { usuarioId, roles } = obtenerUsuario(req);
    const matriculaId = obtenerParametro(
      req.params.matriculaId,
      "La matrícula debe tener un UUID válido.",
    );
    const { notaExamenFinal } = notaExamenFinalSchema.parse(req.body);
    const resultado = await registrarNotaExamenFinal(
      matriculaId,
      notaExamenFinal,
      usuarioId,
      roles,
    );
    return res.status(200).json({
      success: true,
      message: "Nota del examen final registrada exitosamente.",
      data: resultado,
    });
  } catch (error) {
    return next(mapError(error));
  }
};

export const cambiarPublicacionNotasController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { usuarioId, roles } = obtenerUsuario(req);
    const matriculaId = obtenerParametro(
      req.params.matriculaId,
      "La matrícula debe tener un UUID válido.",
    );
    const { notasPublicadas } = publicarNotasSchema.parse(req.body);
    const resultado = await cambiarPublicacionNotas(
      matriculaId,
      notasPublicadas,
      usuarioId,
      roles,
    );
    return res.status(200).json({
      success: true,
      message: notasPublicadas
        ? "Notas publicadas exitosamente."
        : "Publicación de notas retirada exitosamente.",
      data: resultado,
    });
  } catch (error) {
    return next(mapError(error));
  }
};

export const consultarNotasMatriculaController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { usuarioId, roles } = obtenerUsuario(req);
    const matriculaId = obtenerParametro(
      req.params.matriculaId,
      "La matrícula debe tener un UUID válido.",
    );
    const resultado = await consultarNotasMatricula(matriculaId, usuarioId, roles);
    return res.status(200).json({
      success: true,
      message: "Notas de la matrícula consultadas exitosamente.",
      data: resultado,
    });
  } catch (error) {
    return next(mapError(error));
  }
};

export const consultarNotasEstudianteController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { usuarioId, roles } = obtenerUsuario(req);
    const estudianteId = obtenerParametro(
      req.params.estudianteId,
      "El estudiante debe tener un UUID válido.",
    );
    const resultado = await consultarNotasEstudiante(estudianteId, usuarioId, roles);
    return res.status(200).json({
      success: true,
      message: "Notas del estudiante consultadas exitosamente.",
      data: resultado,
    });
  } catch (error) {
    return next(mapError(error));
  }
};

export const consultarMisNotasController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const resultado = await consultarMisNotas(obtenerUsuario(req).usuarioId);
    return res.status(200).json({
      success: true,
      message: "Mis notas consultadas exitosamente.",
      data: resultado,
    });
  } catch (error) {
    return next(mapError(error));
  }
};
