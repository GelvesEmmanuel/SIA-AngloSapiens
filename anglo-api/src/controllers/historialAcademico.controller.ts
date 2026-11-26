import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middlewares/auth.midleware.js"; // Ajusta la ruta si difiere
import { obtenerHistorialAcademicoEstudiante } from "../services/historialAcademico.service.js"; // Ajusta la ruta a tu servicio
import { AppError } from "../utils/appError.utils.js"; // Ajusta la ruta a tu clase AppError
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../config/db.js";
import { estudiantes } from "../config/db/schema.js";


const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const leerQueryString = (valor: unknown): string | undefined => {
  if (typeof valor === "string") return valor;
  if (Array.isArray(valor) && typeof valor[0] === "string") return valor[0];
  return undefined;
};

export const obtenerHistorialAcademicoEstudianteController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const usuarioId = req.user?.usuarioId;
    const roles = req.user?.roles ?? [];

    if (!usuarioId) {
      throw new AppError("No autorizado.", 401, "NO_AUTORIZADO");
    }

    const rawEstudianteId = req.params?.estudianteId;
    let estudianteId = Array.isArray(rawEstudianteId)
      ? rawEstudianteId[0]
      : rawEstudianteId;

    if (!estudianteId && roles.includes("ESTUDIANTE")) {
      const [perfilEstudiante] = await db
        .select({ id: estudiantes.id })
        .from(estudiantes)
        .where(
          and(
            eq(estudiantes.usuarioId, usuarioId),
            isNull(estudiantes.deletedAt),
          ),
        )
        .limit(1);

      if (!perfilEstudiante) {
        throw new AppError(
          "No existe un perfil de estudiante asociado a esta cuenta.",
          404,
          "ESTUDIANTE_NO_ENCONTRADO",
        );
      }

      estudianteId = perfilEstudiante.id;
    }

    if (!estudianteId || !UUID_REGEX.test(estudianteId)) {
      throw new AppError(
        "El parámetro estudianteId es obligatorio y debe ser un UUID válido.",
        400,
        "ESTUDIANTE_ID_INVALIDO",
      );
    }

    const esGestorAcademico = roles.some((rol) =>
      ["SUPER_ADMIN", "COORD_ACADEMICO", "COORD_ADMINISTRATIVO"].includes(rol),
    );

    if (roles.includes("ESTUDIANTE") && !esGestorAcademico) {
      const [perfilEstudiante] = await db
        .select({ id: estudiantes.id })
        .from(estudiantes)
        .where(
          and(
            eq(estudiantes.usuarioId, usuarioId),
            isNull(estudiantes.deletedAt),
          ),
        )
        .limit(1);

      if (!perfilEstudiante || perfilEstudiante.id !== estudianteId) {
        throw new AppError(
          "No tienes permiso para consultar el historial de otro estudiante.",
          403,
          "HISTORIAL_ACADEMICO_DENEGADO",
        );
      }
    }

    const rawIncluir = leerQueryString(req.query.incluirNoFinalizadas);
    let incluirNoFinalizadas = false;

    if (rawIncluir !== undefined) {
      if (rawIncluir !== "true" && rawIncluir !== "false") {
        throw new AppError(
          "El parámetro incluirNoFinalizadas debe ser 'true' o 'false'.",
          400,
          "PARAMETRO_INVALIDO",
        );
      }
      incluirNoFinalizadas = rawIncluir === "true";
    }

    // Si el usuario tiene rol ESTUDIANTE (y no es admin/coordinador), solo ve notas publicadas
    const soloPublicadas = roles.includes("ESTUDIANTE") && !esGestorAcademico;

    const datos = await obtenerHistorialAcademicoEstudiante(estudianteId, {
      incluirNoFinalizadas,
      soloPublicadas,
    });

    return res.status(200).json({
      exito: true,
      datos,
    });
  } catch (error) {
    next(error);
  }
};

export const buscarEstudianteHistorialController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const roles = req.user?.roles ?? [];
    const esGestorAcademico = roles.some((rol) =>
      ["SUPER_ADMIN", "COORD_ACADEMICO", "COORD_ADMINISTRATIVO"].includes(rol),
    );

    if (!req.user?.usuarioId || !esGestorAcademico) {
      throw new AppError("No tienes permiso para buscar estudiantes.", 403, "BUSQUEDA_ESTUDIANTE_DENEGADA");
    }

    const numeroDocumento = leerQueryString(req.query.numeroDocumento)?.trim();
    if (!numeroDocumento) {
      throw new AppError(
        "El número de documento es obligatorio.",
        400,
        "DOCUMENTO_REQUERIDO",
      );
    }

    const [estudiante] = await db
      .select({
        id: estudiantes.id,
        codigo: estudiantes.codigo,
        nombre: estudiantes.nombre,
        apellidos: estudiantes.apellidos,
        numeroDocumento: estudiantes.numeroDocumento,
      })
      .from(estudiantes)
      .where(
        and(
          eq(estudiantes.numeroDocumento, numeroDocumento),
          isNull(estudiantes.deletedAt),
        ),
      )
      .limit(1);

    if (!estudiante) {
      throw new AppError(
        "No se encontró un estudiante con ese documento de identidad.",
        404,
        "ESTUDIANTE_NO_ENCONTRADO",
      );
    }

    return res.status(200).json({ exito: true, datos: estudiante });
  } catch (error) {
    next(error);
  }
};