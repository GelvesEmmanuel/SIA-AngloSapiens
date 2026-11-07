import { useCallback, useEffect, useState } from "react";

import {
  listarDocentes,
  obtenerDocentePorId,
  crearDocente,
  cambiarEstadoDocente,
  actualizarDatosDocente,
  actualizarDocumentosDocente,
} from "../gestionDocente.service";
import { extraerMensajeError } from "../../../api/apiError";

import type {
  Docente,
  DocenteStatus,
  CrearDocentePayload,
  CambiarEstadoDocentePayload
} from "../docente.types";

type AccionDocente =
  | {
      tipo: "estado";
      docenteId: string;
    }
  | {
      tipo: "actualizar_datos";
      docenteId: string;
    }
  | {
      tipo: "actualizar_documentos";
      docenteId: string;
    }
  | null;

export function useDocentes() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<DocenteStatus | "">("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [busquedaDebounced, setBusquedaDebounced] = useState("");

  const [accionEnCurso, setAccionEnCurso] = useState<AccionDocente>(null);
  const [mensajeExito, setMensajeExito] = useState("");
  const [errorAccion, setErrorAccion] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Esperar antes de enviar la búsqueda al backend (debounce).
  useEffect(() => {
    const timeout = setTimeout(() => {
      setBusquedaDebounced(busqueda.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [busqueda]);

  const recargarDocentes = useCallback(() => {
    setReload((actual) => actual + 1);
  }, []);

  // Consultar lista de docentes.
  useEffect(() => {
    let isMounted = true;

    const cargarDocentes = async () => {
  try {
    setIsLoading(true);
    setError("");

    const response = await listarDocentes({
      busqueda: busquedaDebounced || undefined,
      estado: estado || undefined,
    });

    console.log("Respuesta cruda del backend:", response);

    if (isMounted) {
      // Extraemos el arreglo de docentes
      const listaFinal = response.data;

      if (Array.isArray(listaFinal)) {
        setDocentes(listaFinal);
        console.log("Docentes cargados:", listaFinal.length);
      } else {
        console.error("La respuesta no contiene un arreglo de docentes:", response);
        setDocentes([]);
        setError("La respuesta del servidor no tiene el formato esperado.");
      }
    }

  } catch (error: unknown) {
    if (isMounted) {
      setError(extraerMensajeError(error));
      setDocentes([]);
    }
  } finally {
    if (isMounted) {
      setIsLoading(false);
    }
  }
};

    cargarDocentes();

    return () => {
      isMounted = false;
    };
  }, [busquedaDebounced, estado, reload]);

  // Obtener un docente específico (con su expediente y URLs firmadas).
  const obtenerDetalleDocente = useCallback(
  async (docenteId: string): Promise<Docente | null> => {
    try {
      setErrorAccion("");

      const response = await obtenerDocentePorId(docenteId);

      return response.data;
    } catch (error: unknown) {
      setErrorAccion(extraerMensajeError(error));
      throw error;
    }
  },
  []
);

  // Activar o desactivar un docente.
  const ejecutarCambiarEstado = async (
  docenteId: string,
  payload: CambiarEstadoDocentePayload
) => {
  try {
    setAccionEnCurso({ tipo: "estado", docenteId });
    setErrorAccion("");
    setMensajeExito("");

    const response = await cambiarEstadoDocente(
      docenteId,
      payload
    );

    setMensajeExito(
      response.message || "Estado actualizado correctamente."
    );

    // Actualizar el listado
    await recargarDocentes();

    return response.data;

  } catch (error: unknown) {
    setErrorAccion(extraerMensajeError(error));
    throw error;
  } finally {
    setAccionEnCurso(null);
  }
};

  // Crear un nuevo docente (Recibe FormData para soportar la subida de archivos iniciales).
  const ejecutarCrearDocente = async (payload: FormData) => {
    try {
      setIsCreating(true);
      setErrorAccion("");
      setMensajeExito("");

      const response = await crearDocente(payload);

      if (response?.success !== true) {
        throw new Error(
          response.message ||
            "El servidor no confirmó el registro del docente.",
        );
      }

      setMensajeExito(response.message || "Docente registrado correctamente.");

      recargarDocentes();

      return response;
    } catch (error: unknown) {
      setErrorAccion(extraerMensajeError(error));
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // Actualizar datos personales del docente.
  const ejecutarActualizarDatos = async (
    docenteId: string,
    payload: Partial<CrearDocentePayload>,
  ) => {
    try {
      setIsUpdating(true);
      setAccionEnCurso({ tipo: "actualizar_datos", docenteId });
      setErrorAccion("");
      setMensajeExito("");

      const response = await actualizarDatosDocente(docenteId, payload);

      setMensajeExito(
        response.message || "Datos del docente actualizados correctamente.",
      );

      recargarDocentes();
      return response;
    } catch (error: unknown) {
      setErrorAccion(extraerMensajeError(error));
      throw error;
    } finally {
      setIsUpdating(false);
      setAccionEnCurso(null);
    }
  };

  // Actualizar documentos (Cédula, CV, Foto, etc.) con control de históricos.
  const ejecutarActualizarDocumentos = async (
    docenteId: string,
    formDataFiles: FormData,
  ) => {
    try {
      setIsUpdating(true);
      setAccionEnCurso({ tipo: "actualizar_documentos", docenteId });
      setErrorAccion("");
      setMensajeExito("");

      const response = await actualizarDocumentosDocente(docenteId, formDataFiles);

      setMensajeExito(
        response.message || "Documentos actualizados y versionados correctamente.",
      );

      recargarDocentes();
      return response;
    } catch (error: unknown) {
      setErrorAccion(extraerMensajeError(error));
      throw error;
    } finally {
      setIsUpdating(false);
      setAccionEnCurso(null);
    }
  };

  const limpiarMensajes = () => {
    setMensajeExito("");
    setErrorAccion("");
  };

  

  return {
    docentes,
    busqueda,
    setBusqueda,
    estado,
    setEstado,
    isLoading,
    error,
    recargarDocentes,
    obtenerDetalleDocente,

    accionEnCurso,
    mensajeExito,
    errorAccion,
    ejecutarCambiarEstado,
    limpiarMensajes,

    isCreating,
    isUpdating,
    ejecutarCrearDocente,
    ejecutarActualizarDatos,
    ejecutarActualizarDocumentos,
  };
}