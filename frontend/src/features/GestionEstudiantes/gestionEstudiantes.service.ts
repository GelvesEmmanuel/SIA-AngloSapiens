import api from "../../api/axios";
import type {
  ArchivoEstudianteField,
  PreRegistrarEstudiantePayload,
  PreRegistrarEstudianteResponse,
  RegistrarEstudianteConFirmaPayload,
  RegistrarEstudianteConFirmaResponse,
  ListarEstudiantesParams,
  Estudiante, 
  ApiResponse,
  CambiarEstadoEstdiantePayload,
  ContactoEstudiante,
  ActualizarContactoEstudiantePayload,
} from "./estudiantes.type";

const BASE_URL = "/GestionEstudiante";

const crearFormData = (
  payload: PreRegistrarEstudiantePayload,
): FormData => {
  const formData = new FormData();

  formData.append("tipoDocumento", payload.tipoDocumento);
  formData.append("numeroDocumento", payload.numeroDocumento);
  formData.append("nombre", payload.nombre);
  formData.append("apellidos", payload.apellidos);
  formData.append("fechaNacimiento", payload.fechaNacimiento);
  formData.append("reportaDiscapacidad", String(payload.reportaDiscapacidad));
  formData.append("contactos", JSON.stringify(payload.contactos));

  const camposOpcionales: Array<
    ["telefono" | "gradoAcademico" | "institucionEducativa", string | null | undefined]
  > = [
    ["telefono", payload.telefono],
    ["gradoAcademico", payload.gradoAcademico],
    ["institucionEducativa", payload.institucionEducativa],
  ];

  for (const [campo, valor] of camposOpcionales) {
    if (valor != null) {
      formData.append(campo, valor);
    }
  }

  const archivos: Array<[ArchivoEstudianteField, File | undefined]> = [
    ["profilePicture", payload.profilePicture],
    ["identityDocument", payload.identityDocument],
    ["disabilityCertificate", payload.disabilityCertificate],
  ];

  for (const [campo, archivo] of archivos) {
    if (archivo) {
      formData.append(campo, archivo);
    }
  }

  return formData;
};
export const listarEstudiantes = async(
    params: ListarEstudiantesParams= {}): Promise<ApiResponse<Estudiante[]>> =>{

        const response = await api.get<ApiResponse<Estudiante[]>>(`${BASE_URL}/listar`,{
            params,
        });

        return response.data;
    };

    // 2. Obtener un Estudiante por ID (Incluye el expediente con sus archivos y URLs firmadas)
    export const obtenerEstudiantePorId = async(
        estudianteId: string
    ): Promise<ApiResponse<Estudiante>> => {
        const response = await api.get<ApiResponse<Estudiante>>
       ( `${BASE_URL}/listar/${estudianteId}`);

    
    return response.data;
    }
export const preRegistrarEstudiante = async (
  payload: PreRegistrarEstudiantePayload,
): Promise<PreRegistrarEstudianteResponse> => {
  const response = await api.post<PreRegistrarEstudianteResponse>(
    `${BASE_URL}/preRegistrar`,
    crearFormData(payload),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
};

export const registrarEstudianteConFirma = async (
  payload: RegistrarEstudianteConFirmaPayload,
): Promise<RegistrarEstudianteConFirmaResponse> => {
  const formData = new FormData();
  formData.append("numeroDocumento", payload.numeroDocumento);
  formData.append(
    "terminosyCondiciones",
    String(payload.terminosyCondiciones),
  );
  formData.append(
    "consentimientoUsoImagen",
    String(payload.consentimientoUsoImagen),
  );
  formData.append("firmaDigital", payload.firmaDigital);

  const response = await api.post<RegistrarEstudianteConFirmaResponse>(
    `${BASE_URL}/registrar`,
    formData,
  );

  return response.data;
};

// 4 cmabiar estado del Estudiante
   export const cambiarEstadoEstudiante = async (
  estudianteId: string,
  payload: CambiarEstadoEstdiantePayload
): Promise<ApiResponse<Estudiante>> => {
  const response = await api.patch<ApiResponse<Estudiante>>(
    `${BASE_URL}/estado/${estudianteId}`,
    payload
  );

  return response.data;
};

//5 Actualizar informacion personal /datos del docente
export const actualizarDatosEstudiante = async (
  estudianteId: string,
  payload: Partial<Estudiante>
): Promise<ApiResponse<Estudiante>> => {
  const response = await api.patch<ApiResponse<Estudiante>>(
    `${BASE_URL}/actualizar/${estudianteId}`,
    payload
  );
  return response.data;
};

// 6. Actualizar documentos específicos del Estudiante (Foto, Cédula, firmaDigital, etc.)
// Recibe el ID del docente y un objeto FormData con los archivos nuevos que se van a adjuntar.
export const actualizarDocumentosEstudiante = async (
  estudianteId: string,
  formDataFiles: FormData
): Promise<ApiResponse<unknown>> => {
  const response = await api.patch<ApiResponse<unknown>>(
    `${BASE_URL}/actualizardocumento/${estudianteId}`,
    formDataFiles,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
// actualizar datos contactos
export const actualizarDatosContacto = async (
  estudianteId: string,
  contactos: ActualizarContactoEstudiantePayload[],
): Promise<ApiResponse<ContactoEstudiante[]>> => {
  const response = await api.patch<ApiResponse<ContactoEstudiante[]>>(
    `${BASE_URL}/contactos/${estudianteId}`,
    { contactos },
  );
  return response.data;
};