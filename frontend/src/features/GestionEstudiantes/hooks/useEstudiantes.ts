import { useState, useCallback, useEffect } from "react";
import { extraerMensajeError } from "../../../api/apiError";
import { actualizarDatosEstudiante, actualizarDatosContacto, cambiarEstadoEstudiante, preRegistrarEstudiante as enviarPreRegistro, listarEstudiantes, obtenerEstudiantePorId, actualizarDocumentosEstudiante } from "../gestionEstudiantes.service";
import {
  type EstudianteStatus,
  type Estudiante,
  type PreRegistrarEstudiantePayload,
  type PreRegistrarEstudianteResponse,
  type ContactoEstudiante,
  type ActualizarContactoEstudiantePayload,
  type CambiarEstadoEstdiantePayload,
  type AccionEstudiante,

} from "../estudiantes.type";

 
export function useEstudiantes() {
// para la lista de los estudiantes y busquedas
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstudianteStatus | "">("");
  const [contactos, setContactos] = useState<ContactoEstudiante[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
 const [accionEnCurso, setAccionEnCurso] = useState<AccionEstudiante>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  // esperar antes de enviar la busqueda al backend debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      setBusquedaDebounced(busqueda.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [busqueda]);

   const recargarEstudiantes = useCallback(() => {
    setReload((actual) => actual + 1);
  }, []);

  // Consultar lista de docentes.
  useEffect(() => {
    let isMounted = true;

    const cargarEstudiantes = async () => {
  try {
    setIsLoading(true);
    setError("");

    const response = await listarEstudiantes({
      busqueda: busquedaDebounced || undefined,
      estado: estado || undefined,
    });

    console.log("Respuesta cruda del backend:", response);

    if (isMounted) {
      // Extraemos el arreglo de Estudiantes
      const listaFinal = response.data;

      if (Array.isArray(listaFinal)) {
        setEstudiantes(listaFinal);
        console.log("Estduiantes cargados:", listaFinal.length);
      } else {
        console.error("La respuesta no contiene un arreglo de estudiantes:", response);
        setEstudiantes([]);
        setError("La respuesta del servidor no tiene el formato esperado.");
      }
    }

  } catch (error: unknown) {
    if (isMounted) {
      setError(extraerMensajeError(error));
      setEstudiantes([]);
    }
  } finally {
    if (isMounted) {
      setIsLoading(false);
    }
  }
};  
 cargarEstudiantes();

    return () => {
      isMounted = false;
    };
  }, [busquedaDebounced, estado, reload]);


  // Obtener un estudiantes específico (con su expediente y URLs firmadas).
  const obtenerDetalleEstudiante = useCallback(
  async (estudianteId: string): Promise<Estudiante | null> => {
    try {
      setErrorAccion("");

      const response = await obtenerEstudiantePorId(estudianteId);

      return response.data;
    } catch (error: unknown) {
      setErrorAccion(extraerMensajeError(error));
      throw error;
    }
  },
  []
);


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


  // Activar o desactivar un docente.
    const ejecutarCambiarEstado = async (
    estudianteId: string,
    payload: CambiarEstadoEstdiantePayload
  ) => {
    try {
      setAccionEnCurso({ tipo: "estado", estudianteId });
      setErrorAccion("");
      setMensajeExito("");
  
      const response = await cambiarEstadoEstudiante(
        estudianteId,
        payload
      );
  
      setMensajeExito(
        response.message || "Estado actualizado correctamente."
      );
  
      // Actualizar el listado
      await recargarEstudiantes();
  
      return response.data;
  
    } catch (error: unknown) {
      setErrorAccion(extraerMensajeError(error));
      throw error;
    } finally {
      setAccionEnCurso(null);
    }
  };

  // actualizar datos del estudiante

  const ejecutarActualizarDatos = async (
      estudianteId: string,
      payload: Partial<Estudiante>,
    ) => {
      try {
        setIsUpdating(true);
        setAccionEnCurso({ tipo: "actualizar_datos", estudianteId });
        setErrorAccion("");
        setMensajeExito("");
  
        const response = await actualizarDatosEstudiante(estudianteId, payload);
  
        setMensajeExito(
          response.message || "Datos del estudiante actualizados correctamente.",
        );
  
        recargarEstudiantes();
        return response;
      } catch (error: unknown) {
        setErrorAccion(extraerMensajeError(error));
        throw error;
      } finally {
        setIsUpdating(false);
        setAccionEnCurso(null);
      }
    };

  const ejecutarActualizarContacto = async (
    estudianteId: string,
    contacto: ActualizarContactoEstudiantePayload,
  ) => {
    try {
      setIsUpdating(true);
      setAccionEnCurso({ tipo: "actualizar_contactos", estudianteId });
      setErrorAccion("");
      setMensajeExito("");

      const response = await actualizarDatosContacto(estudianteId, [contacto]);

      setMensajeExito(
        response.message || "Contacto del estudiante actualizado correctamente.",
      );
      recargarEstudiantes();
      return response;
    } catch (error: unknown) {
      setErrorAccion(extraerMensajeError(error));
      throw error;
    } finally {
      setIsUpdating(false);
      setAccionEnCurso(null);
    }
  };


    // actualizar documentos del estudiante
    
      // Actualizar documentos (Cédula, firmadigital, Foto, etc.) con control de históricos.
      const ejecutarActualizarDocumentos = async (
        estudianteId: string,
        formDataFiles: FormData,
      ) => {
        try {
          setIsUpdating(true);
          setAccionEnCurso({ tipo: "actualizar_documentos", estudianteId });
          setErrorAccion("");
          setMensajeExito("");
    
          const response = await actualizarDocumentosEstudiante(estudianteId, formDataFiles);
    
          setMensajeExito(
            response.message || "Documentos actualizados y versionados correctamente.",
          );
    
          recargarEstudiantes();
          return response;
        } catch (error: unknown) {
          setErrorAccion(extraerMensajeError(error));
          throw error;
        } finally {
          setIsUpdating(false);
          setAccionEnCurso(null);
        }
      };
    
      
    
      

  return {
    estudiantes,
    busqueda,
    setBusqueda,
    estado,
    setEstado,
    isLoading,
    error,
    recargarEstudiantes,
    obtenerDetalleEstudiante,
    contactos,
    setContactos,
    
    
    accionEnCurso,
    ejecutarCambiarEstado,
    ejecutarActualizarDatos,
    ejecutarActualizarContacto,
    isUpdating,
    ejecutarActualizarDocumentos,

    isCreating,
    mensajeExito,
    errorAccion,
    ejecutarPreRegistro,
    limpiarMensajes,

  };
}