import type { NextFunction, Response } from "express";
import { ZodError, z } from "zod";
import type { AuthRequest } from "../middlewares/auth.midleware.js";
import {
  activarCurso,
  actualizarCurso,
  generarCodigoCurso,
  inactivarCurso,
  obtenerCursoPorId,
  obtenerCursos,
  registrarCurso,
} from "../services/curso.service.js";
import type { InsertCurso } from "../types/cursos.types.js";
import { AppError } from "../utils/appError.utils.js";
import {
  actualizarCursoSchema,
  crearCursoSchema,
  filtrosCursoSchema,
} from "../validators/curso.validator.js";

const mapCursoError = (error: unknown): unknown => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError(
      "Error de validación en los datos de entrada.",
      400,
      "VALIDATION_ERROR",
      error.issues.map((issue) => ({
        field: issue.path.join(".") || "general",
        message: issue.message,
      })),
    );
  }

  const message = error instanceof Error ? error.message : "";
  if (message === "CURSO_NO_ENCONTRADO") {
    return new AppError("El curso especificado no existe.", 404, "CURSO_NO_ENCONTRADO");
  }

  if (message === "CODIGO_CURSO_DUPLICADO") {
    return new AppError(
      "No se pudo registrar el curso porque su código ya existe.",
      409,
      "CODIGO_CURSO_DUPLICADO",
      [{ field: "codigo", message: "El código del curso ya está registrado." }],
    );
  }

  if (
    message === "HABILIDADES_CURSO_REQUERIDAS" ||
    message === "HABILIDADES_CURSO_DUPLICADAS" ||
    message === "DATOS_CURSO_REQUERIDOS"
  ) {
    const messages: Record<string, { message: string; field: string }> = {
      HABILIDADES_CURSO_REQUERIDAS: {
        message: "El curso debe incluir al menos una habilidad.",
        field: "habilidades",
      },
      HABILIDADES_CURSO_DUPLICADAS: {
        message: "No se permiten habilidades duplicadas.",
        field: "habilidades",
      },
      DATOS_CURSO_REQUERIDOS: {
        message: "Debe proporcionar al menos un campo para actualizar.",
        field: "general",
      },
    };
    const detalle = messages[message];
    return new AppError(detalle.message, 400, message, [
      { field: detalle.field, message: detalle.message },
    ]);
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    return new AppError(
      "No se pudo registrar el curso porque su código ya existe.",
      409,
      "CODIGO_CURSO_DUPLICADO",
      [{ field: "codigo", message: "El código del curso ya está registrado." }],
    );
  }

  return error;
};

const obtenerIdCurso = (req: AuthRequest): string => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  return z.string().uuid("El ID del curso debe ser un UUID válido.").parse(id);
};

const obtenerUsuarioAdminId = (req: AuthRequest): string => {
  const usuarioAdminId = req.user?.usuarioId;
  if (!usuarioAdminId) {
    throw new AppError("No autorizado.", 401, "NO_AUTORIZADO");
  }
  return usuarioAdminId;
};

export const listarCursosController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const filtros = filtrosCursoSchema.parse(req.query);
    const cursos = await obtenerCursos(filtros);
    return res.status(200).json({
      success: true,
      message: "Cursos listados exitosamente.",
      data: cursos,
    });
  } catch (error: unknown) {
    return next(mapCursoError(error));
  }
};

export const obtenerCursoPorIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const curso = await obtenerCursoPorId(obtenerIdCurso(req));
    return res.status(200).json({
      success: true,
      message: "Curso encontrado exitosamente.",
      data: curso,
    });
  } catch (error: unknown) {
    return next(mapCursoError(error));
  }
};

export const registrarCursoController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const usuarioAdminId = obtenerUsuarioAdminId(req);
    const datos = crearCursoSchema.parse(req.body);
    const data: InsertCurso = {
      codigo: await generarCodigoCurso(),
      nombre: datos.nombre,
      nivel: datos.nivel,
      descripcion: datos.descripcion ?? null,
      duracionSemanas: datos.duracionSemanas,
      intensidadSemanal: datos.intensidadSemanal,
    };
    const curso = await registrarCurso(data, datos.habilidades, usuarioAdminId);

    return res.status(201).json({
      success: true,
      message: "Curso registrado exitosamente.",
      data: curso,
    });
  } catch (error: unknown) {
    return next(mapCursoError(error));
  }
};

export const actualizarCursoController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const usuarioAdminId = obtenerUsuarioAdminId(req);
    const cursoId = obtenerIdCurso(req);
    const datos = actualizarCursoSchema.parse(req.body);
    const curso = await actualizarCurso(cursoId, datos, usuarioAdminId);

    return res.status(200).json({
      success: true,
      message: "Curso actualizado exitosamente.",
      data: curso,
    });
  } catch (error: unknown) {
    return next(mapCursoError(error));
  }
};

const cambiarEstadoCursoController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
  estado: "ACTIVO" | "INACTIVO",
) => {
  try {
    const usuarioAdminId = obtenerUsuarioAdminId(req);
    const cursoId = obtenerIdCurso(req);
    const curso =
      estado === "ACTIVO"
        ? await activarCurso(cursoId, usuarioAdminId)
        : await inactivarCurso(cursoId, usuarioAdminId);

    return res.status(200).json({
      success: true,
      message: `Curso ${estado === "ACTIVO" ? "activado" : "inactivado"} exitosamente.`,
      data: curso,
    });
  } catch (error: unknown) {
    return next(mapCursoError(error));
  }
};

export const activarCursoController = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => cambiarEstadoCursoController(req, res, next, "ACTIVO");

export const inactivarCursoController = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => cambiarEstadoCursoController(req, res, next, "INACTIVO");