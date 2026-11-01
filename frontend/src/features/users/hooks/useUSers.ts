import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";

import {
  listarUsuarios,
  cambiarEstadoUsuario,
  restablecerContrasenaUsuario,
  crearUsuarioCoordinador,
} from "../user.service";

import type {
  Usuario,
  UserStatus,
  CrearUsuarioCoordinadorPayload,
} from "../user.types";
import type { UserRole } from "../../auth/auth.types";

type AccionUsuario =
  | {
      tipo: "estado";
      usuarioId: string;
    }
  | {
      tipo: "contrasena";
      usuarioId: string;
    }
  | null;

function obtenerTextoMensaje(valor: unknown): string | undefined {
  if (typeof valor === "string" && valor.trim()) {
    return valor;
  }

  if (valor && typeof valor === "object") {
    const objeto = valor as Record<string, unknown>;

    for (const campo of ["mensaje", "message", "error"]) {
      const mensaje = obtenerTextoMensaje(objeto[campo]);
      if (mensaje) return mensaje;
    }
  }

  return undefined;
}

function obtenerMensajeError(error: unknown): string {
  if (isAxiosError(error)) {
    return (
      obtenerTextoMensaje(error.response?.data) ||
      "No fue posible completar la operación."
    );
  }

  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

export function useUsers() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [rol, setRol] = useState<UserRole | "">("");
  const [estado, setEstado] = useState<UserStatus | "">("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [busquedaDebounced, setBusquedaDebounced] = useState("");

  const [accionEnCurso, setAccionEnCurso] = useState<AccionUsuario>(null);
  const [mensajeExito, setMensajeExito] = useState("");
  const [errorAccion, setErrorAccion] = useState("");

  const [isCreating, setIsCreating] = useState(false);

  // Esperar antes de enviar la búsqueda al backend.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setBusquedaDebounced(busqueda.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [busqueda]);

  const recargarUsuarios = useCallback(() => {
    setReload((actual) => actual + 1);
  }, []);

  // Consultar usuarios.
  useEffect(() => {
    let isMounted = true;

    const cargarUsuarios = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await listarUsuarios({
          busqueda: busquedaDebounced || undefined,
          rol: rol || undefined,
          estado: estado || undefined,
        });

        if (isMounted) {
          setUsuarios(response.datos);
        }
      } catch (error: unknown) {
        if (isMounted) {
          setError(obtenerMensajeError(error));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    cargarUsuarios();

    return () => {
      isMounted = false;
    };
  }, [busquedaDebounced, rol, estado, reload]);

  // Activar o desactivar un usuario.
  const ejecutarCambiarEstado = async (usuarioId: string) => {
    try {
      setAccionEnCurso({ tipo: "estado", usuarioId });
      setErrorAccion("");
      setMensajeExito("");

      const response = await cambiarEstadoUsuario(usuarioId);

      setMensajeExito(
        obtenerTextoMensaje(response) ||
          "El estado del usuario fue actualizado correctamente.",
      );

      recargarUsuarios();
    } catch (error: unknown) {
      setErrorAccion(obtenerMensajeError(error));
      throw error;
    } finally {
      setAccionEnCurso(null);
    }
  };

  // Restablecer contraseña.
  const ejecutarRestablecerContrasena = async (usuarioId: string) => {
    try {
      setAccionEnCurso({ tipo: "contrasena", usuarioId });
      setErrorAccion("");
      setMensajeExito("");

      const response = await restablecerContrasenaUsuario(usuarioId);

      setMensajeExito(
        obtenerTextoMensaje(response) ||
          "La contraseña fue restablecida correctamente.",
      );
    } catch (error: unknown) {
      setErrorAccion(obtenerMensajeError(error));
      throw error;
    } finally {
      setAccionEnCurso(null);
    }
  };

  const ejecutarCrearCoordinador = async (
    payload: CrearUsuarioCoordinadorPayload,
  ) => {
    try {
      setIsCreating(true);
      setErrorAccion("");
      setMensajeExito("");

      const response = await crearUsuarioCoordinador(payload);

      setMensajeExito(
        obtenerTextoMensaje(response) || "Coordinador registrado correctamente.",
      );

      recargarUsuarios();

      return response;
    } catch (error: unknown) {
      setErrorAccion(obtenerMensajeError(error));
      throw error;
    } finally {
      setIsCreating(false);
    }
  };
  const limpiarMensajes = () => {
    setMensajeExito("");
    setErrorAccion("");
  };

  return {
    usuarios,
    busqueda,
    setBusqueda,
    rol,
    setRol,
    estado,
    setEstado,
    isLoading,
    error,
    recargarUsuarios,

    accionEnCurso,
    mensajeExito,
    errorAccion,
    ejecutarCambiarEstado,
    ejecutarRestablecerContrasena,
    limpiarMensajes,

    isCreating,
    ejecutarCrearCoordinador,
  };
}
