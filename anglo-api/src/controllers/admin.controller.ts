import type { NextFunction, Response } from "express";
import { ZodError } from "zod";
import { AuthRequest } from "../middlewares/auth.midleware.js";
import { AdminService } from "../services/admin.service.js";
import {
  asignarRolUsuarioSchema,
  buscarUsuarioCoordinadorSchema,
  crearUsuarioAdminSchema,
  convertirUsuarioEnCoordinadorSchema,
} from "../validators/user.validator.js";
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

const mapAdminError = (error: unknown): unknown => {
  if (error instanceof AppError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "";
  if (message === "DOCUMENTO_IDENTIDAD_DUPLICADO") {
    return new AppError(
      "No se pudo crear el coordinador porque el documento ya está registrado.",
      409,
      "DOCUMENTO_DUPLICADO",
      [
        {
          field: "documentoIdentidad",
          message: "El documento de identidad ya se encuentra registrado.",
        },
      ]
    );
  }
  if (message === "Usuario no encontrado") {
    return new AppError(message, 404, "USUARIO_NO_ENCONTRADO");
  }
  if (message === "ROL_INVALIDO") {
    return new AppError("El rol indicado no es válido.", 400, "ROL_INVALIDO");
  }
  if (message === "USUARIO_PROMOCION_NO_ENCONTRADO") {
    return new AppError(
      "No se encontró un usuario asociado a ese documento.",
      404,
      "USUARIO_NO_ENCONTRADO",
    );
  }
  if (message === "DOCUMENTO_IDENTIDAD_AMBIGUO") {
    return new AppError(
      "El documento coincide con más de una cuenta. No es posible convertirla automáticamente.",
      409,
      "DOCUMENTO_AMBIGUO",
    );
  }
  if (message.startsWith("No se puede restablecer la contraseña:")) {
    return new AppError(message, 400, "RESTABLECIMIENTO_NO_DISPONIBLE");
  }

  return error;
};

const getParamId = (id: string | string[] | undefined) =>
  Array.isArray(id) ? id[0] : id;

export const crearUSuarioAdminController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const datosValidados = crearUsuarioAdminSchema.parse(req.body);
    const resultado = await AdminService.crearUsuarioPorAdmin({
      primerNombre: datosValidados.primerNombre,
      segundoNombre: datosValidados.segundoNombre,
      primerApellido: datosValidados.primerApellido,
      segundoApellido: datosValidados.segundoApellido,
      documentoIdentidad: datosValidados.documentoIdentidad,
      diaCumpleanos: datosValidados.diaCumpleanos,
      rol: datosValidados.rol as "COORD_ACADEMICO" | "COORD_ADMINISTRATIVO",
    });

    return res.status(201).json({
      exito: true,
      mensaje: resultado,
    });
  } catch (error: unknown) {
    return next(
      error instanceof ZodError ? validationError(error) : mapAdminError(error)
    );
  }
};

export const listarUsuariosController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rol, estado, busqueda } = req.query;
    const usuariosListados = await AdminService.obtenerUsuarios({
      rol: rol as string,
      estado: estado as string,
      busqueda: busqueda as string,
    });

    return res.status(200).json({
      exito: true,
      mensaje: "Usuarios listados exitosamente",
      datos: usuariosListados,
    });
  } catch (error: unknown) {
    return next(mapAdminError(error));
  }
};

export const obtenerUsuarioPorIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      throw new AppError("El ID del usuario es obligatorio.", 400, "ID_REQUERIDO", [
        { field: "id", message: "Este parámetro es obligatorio." },
      ]);
    }

    const usuario = await AdminService.obtenerUsuarioPorId(id);
    if (!usuario) {
      throw new AppError("Usuario no encontrado.", 404, "USUARIO_NO_ENCONTRADO");
    }

    return res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error: unknown) {
    return next(mapAdminError(error));
  }
};

export const asignarRolUsuarioController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      throw new AppError("El ID del usuario es obligatorio.", 400, "ID_REQUERIDO", [
        { field: "id", message: "Este parámetro es obligatorio." },
      ]);
    }

    const { rol } = asignarRolUsuarioSchema.parse(req.body);
    const roles = await AdminService.asignarRolUsuario(id, rol);

    return res.status(200).json({
      success: true,
      message: `Rol ${rol} asignado exitosamente.`,
      data: { usuarioId: id, roles },
    });
  } catch (error: unknown) {
    return next(
      error instanceof ZodError ? validationError(error) : mapAdminError(error)
    );
  }
};

export const buscarUsuarioCoordinadorController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentoIdentidad } = buscarUsuarioCoordinadorSchema.parse(req.query);
    const usuario = await AdminService.buscarUsuarioParaPromocionCoordinador(
      documentoIdentidad,
    );

    if (!usuario) {
      throw new AppError(
        "No se encontró un usuario asociado a ese documento.",
        404,
        "USUARIO_NO_ENCONTRADO",
      );
    }

    return res.status(200).json({
      success: true,
      message: "Usuario encontrado para conversión a coordinador.",
      data: usuario,
    });
  } catch (error: unknown) {
    return next(
      error instanceof ZodError ? validationError(error) : mapAdminError(error)
    );
  }
};

export const convertirUsuarioEnCoordinadorController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { documentoIdentidad, rol } =
      convertirUsuarioEnCoordinadorSchema.parse(req.body);
    const usuario = await AdminService.convertirUsuarioEnCoordinador(
      documentoIdentidad,
      rol,
    );

    return res.status(200).json({
      success: true,
      message: `Usuario convertido a ${rol} exitosamente.`,
      data: usuario,
    });
  } catch (error: unknown) {
    return next(
      error instanceof ZodError ? validationError(error) : mapAdminError(error)
    );
  }
};

export const cambiarEstadoUsuarioController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      throw new AppError("El ID del usuario es obligatorio.", 400, "ID_REQUERIDO", [
        { field: "id", message: "Este parámetro es obligatorio." },
      ]);
    }

    const usuarioActualizado = await AdminService.cambiarEstadoUsuario(id);
    if (!usuarioActualizado) {
      throw new AppError("Usuario no encontrado.", 404, "USUARIO_NO_ENCONTRADO");
    }

    return res.status(200).json({
      success: true,
      message: `El estado del usuario ${usuarioActualizado.username} ha cambiado exitosamente a ${usuarioActualizado.estado}.`,
      data: usuarioActualizado,
    });
  } catch (error: unknown) {
    return next(mapAdminError(error));
  }
};

export const restablecerContrasenaUsuarioController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = getParamId(req.params.id);
    if (!id) {
      throw new AppError("El ID del usuario es obligatorio.", 400, "ID_REQUERIDO", [
        { field: "id", message: "Este parámetro es obligatorio." },
      ]);
    }

    const resultado = await AdminService.restablecerContrasenaUsuario(id);
    return res.status(200).json(resultado);
  } catch (error: unknown) {
    return next(mapAdminError(error));
  }
};
