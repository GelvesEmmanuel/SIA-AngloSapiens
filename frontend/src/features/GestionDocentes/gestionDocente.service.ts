import api from "../../api/axios";
import type {Docente,CrearDocentePayload,CrearDocenteResponse,ListarDocentesParams, ApiResponse,CambiarEstadoDocentePayload } from "./docente.types"
const BASE_URL = "/docentes";
// 1. Listar docentes con filtros opcionales
export const listarDocentes = async(
    params: ListarDocentesParams= {}): Promise<ApiResponse<Docente[]>> =>{

        const response = await api.get<ApiResponse<Docente[]>>(`${BASE_URL}/listar`,{
            params,
        });

        return response.data;
    };
    // 2. Obtener un docente por ID (Incluye el expediente con sus archivos y URLs firmadas)
    export const obtenerDocentePorId = async(
        docenteId: string
    ): Promise<ApiResponse<Docente>> => {
        const response = await api.get<ApiResponse<Docente>>
       ( `${BASE_URL}/listar/${docenteId}`);

    
    return response.data;
    }
// 3. Crear docente (Usando FormData para soportar la subida inicial de archivos y datos)
  export const crearDocente = async (
  payload: FormData
): Promise<ApiResponse<CrearDocenteResponse>> => {
  const response = await api.post<ApiResponse<CrearDocenteResponse>>(
    `${BASE_URL}/registrar`, // 👈 Añadimos "/registrar" aquí para que coincida con tu backend
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
// 4 cmabiar estado del docente
   export const cambiarEstadoDocente = async (
  docenteId: string,
  payload: CambiarEstadoDocentePayload
): Promise<ApiResponse<Docente>> => {
  const response = await api.patch<ApiResponse<Docente>>(
    `${BASE_URL}/estado/${docenteId}`,
    payload
  );

  return response.data;
};
//5 Actualizar informacion personal /datos del docente
export const actualizarDatosDocente = async (
  docenteId: string,
  payload: Partial<CrearDocentePayload>
): Promise<ApiResponse<Docente>> => {
  const response = await api.patch<ApiResponse<Docente>>(
    `${BASE_URL}/actualizar/${docenteId}`,
    payload
  );
  return response.data;
};

// 6. Actualizar documentos específicos del docente (Foto, Cédula, CV, etc.)
// Recibe el ID del docente y un objeto FormData con los archivos nuevos que se van a adjuntar.
export const actualizarDocumentosDocente = async (
  docenteId: string,
  formDataFiles: FormData
): Promise<ApiResponse<unknown>> => {
  const response = await api.patch<ApiResponse<unknown>>(
    `${BASE_URL}/actualizardocumento/${docenteId}`,
    formDataFiles,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
