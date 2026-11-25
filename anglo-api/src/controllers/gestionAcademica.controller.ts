import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middlewares/auth.midleware.js";
import { obtenerMisGrupos, obtenerMisGruposDocente, guardarAsistenciaSesion,
  obtenerAsistenciaPorFecha,
  obtenerConteoInasistenciasGrupo,obtenerHistorialInasistenciasGrupo } from "../services/gestionAcademica.service.js";
import { AppError } from "../utils/appError.utils.js";
import type { EstudianteAusenteInput } from "../types/asistencias.types.js";
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

    const roles = req.user?.roles ?? [];
    const esDocente = roles.includes("DOCENTE");
    const grupos = esDocente
      ? await obtenerMisGruposDocente(usuarioId)
      : await obtenerMisGrupos(usuarioId);
    return res.status(200).json({
      success: true,
      message: esDocente
        ? "Grupos asignados al docente obtenidos exitosamente."
        : "Grupos del estudiante obtenidos exitosamente.",
      data: grupos,
    });
  } catch (error) {
    return next(error);
  }
};

// asistencias

/**
 * POST /api/gestion-academica/grupos/:grupoId/asistencias
 * Registra o edita la asistencia de una fecha específica (lógica de excepciones).
 */
export const guardarAsistenciaController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const grupoIdParam = req.params.grupoId;
    const grupoId = Array.isArray(grupoIdParam) ? grupoIdParam[0] : grupoIdParam;
    const { fechaClase, ausentes = [] } = req.body as {
      fechaClase?: string;
      ausentes?: EstudianteAusenteInput[];
    };

    const usuarioId = req.user?.usuarioId;
    const roles = req.user?.roles ?? [];

    if (!usuarioId) {
      throw new AppError("No autorizado.", 401, "NO_AUTORIZADO");
    }

    if (!grupoId) {
      throw new AppError("El parámetro grupoId es obligatorio.", 400, "GRUPO_ID_REQUERIDO");
    }

    if (!fechaClase || !/^\d{4}-\d{2}-\d{2}$/.test(fechaClase)) {
      throw new AppError(
        "La fechaClase es obligatoria y debe tener el formato YYYY-MM-DD.",
        400,
        "FECHA_INVALIDA",
      );
    }

    if (!Array.isArray(ausentes)) {
      throw new AppError(
        "El campo ausentes debe ser un arreglo.",
        400,
        "AUSENTES_INVALIDO",
      );
    }

    const resultado = await guardarAsistenciaSesion({
      grupoId,
      fechaClase,
      ausentes,
      usuarioId,
      roles,
    });

    return res.status(resultado.esEdicion ? 200 : 201).json({
      exito: true,
      mensaje: resultado.esEdicion
        ? "Asistencia actualizada correctamente"
        : "Asistencia y sesión de clase registradas correctamente",
      datos: resultado,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/gestion-academica/grupos/:grupoId/asistencias?fecha=YYYY-MM-DD
 */
export const obtenerAsistenciaFechaController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const grupoIdParam = req.params.grupoId;
    const grupoId = Array.isArray(grupoIdParam) ? grupoIdParam[0] : grupoIdParam;
    const fechaParam = req.query.fecha;
    const fechaClase = Array.isArray(fechaParam) ? fechaParam[0] : fechaParam;
    const fechaClaseTexto =
      typeof fechaClase === "string" ? fechaClase : undefined;

    if (!grupoId) {
      throw new AppError("El parámetro grupoId es obligatorio.", 400, "GRUPO_ID_REQUERIDO");
    }

    if (!fechaClaseTexto || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(fechaClaseTexto)) {
      throw new AppError(
        "El query param 'fecha' es obligatorio y debe tener el formato YYYY-MM-DD.",
        400,
        "FECHA_INVALIDA",
      );
    }

    const datos = await obtenerAsistenciaPorFecha(
      grupoId,
      fechaClaseTexto,
      req.user?.usuarioId,
      req.user?.roles ?? [],
    );

    return res.status(200).json({
      exito: true,
      datos,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/gestion-academica/grupos/:grupoId/asistencias/conteo
 */
export const obtenerConteoInasistenciasController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const grupoIdParam = req.params.grupoId;
    const grupoId = Array.isArray(grupoIdParam) ? grupoIdParam[0] : grupoIdParam;

    if (!grupoId) {
      throw new AppError("El parámetro grupoId es obligatorio.", 400, "GRUPO_ID_REQUERIDO");
    }

    const datos = await obtenerConteoInasistenciasGrupo(
      grupoId,
      req.user?.usuarioId,
      req.user?.roles ?? [],
    );

    return res.status(200).json({
      exito: true,
      datos,
    });
  } catch (error) {
    next(error);
  }
};


// controlador para historial d einaxistencias d egrupo o consultar todas

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const obtenerHistorialInasistenciasController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const grupoIdParam = req.params.grupoId;
    const  grupoId  = Array.isArray(grupoIdParam) ? grupoIdParam[0] : grupoIdParam;
    const usuarioId = req.user?.usuarioId;
    const roles = req.user?.roles ? [req.user.roles] : [];

    if (!grupoId) {
      throw new AppError("El parámetro grupoId es obligatorio.", 400, "GRUPO_ID_REQUERIDO");
    }

    const datos = await obtenerHistorialInasistenciasGrupo(grupoId, usuarioId,  req.user?.roles ?? []);

    return res.status(200).json({
      exito: true,
      datos,
    });
  } catch (error) {
    next(error);
  }
};

