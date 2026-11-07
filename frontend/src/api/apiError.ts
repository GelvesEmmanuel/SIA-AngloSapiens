import axios from "axios";

export interface ApiValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  data: null;
  code: string;
  errors: ApiValidationError[] | null;
}

export function extraerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body: unknown = error.response?.data;

    if (body && typeof body === "object") {
      const respuesta = body as Partial<ApiErrorResponse>;
      const message =
        typeof respuesta.message === "string" ? respuesta.message.trim() : "";
      const detalles = Array.isArray(respuesta.errors)
        ? respuesta.errors
            .filter(
              (detalle): detalle is ApiValidationError =>
                Boolean(
                  detalle &&
                    typeof detalle.field === "string" &&
                    typeof detalle.message === "string",
                ),
            )
            .map(({ field, message: detalle }) => `${field}: ${detalle}`)
        : [];

      if (message && detalles.length > 0) {
        return `${message}: ${detalles.join("; ")}`;
      }

      if (message) return message;
      if (detalles.length > 0) return detalles.join("; ");
    } else if (typeof body === "string" && body.trim()) {
      return body;
    }

    if (!error.response) {
      return "No fue posible conectar con el servidor.";
    }

    return error.message || "No fue posible completar la solicitud.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}
