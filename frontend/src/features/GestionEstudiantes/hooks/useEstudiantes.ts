import { useState } from "react";
import { extraerMensajeError } from "../../../api/apiError";
import { preRegistrarEstudiante as enviarPreRegistro } from "../gestionEstudiantes.service";
import type {
  PreRegistrarEstudiantePayload,
  PreRegistrarEstudianteResponse,
} from "../estudiantes.type";

export function useEstudiantes() {
  const [isCreating, setIsCreating] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [errorAccion, setErrorAccion] = useState("");

  const ejecutarPreRegistro = async (
    payload: PreRegistrarEstudiantePayload,
  ): Promise<PreRegistrarEstudianteResponse> => {
    try {
      setIsCreating(true);
      setErrorAccion("");
      setMensajeExito("");

      const response = await enviarPreRegistro(payload);

      if (response.success !== true) {
        throw new Error(
          response.message ||
            "El servidor no confirmó el pre-registro del estudiante.",
        );
      }

      setMensajeExito(
        response.message || "Estudiante pre-registrado correctamente.",
      );

      return response;
    } catch (error: unknown) {
      setErrorAccion(extraerMensajeError(error));
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
    isCreating,
    mensajeExito,
    errorAccion,
    ejecutarPreRegistro,
    limpiarMensajes,
  };
}