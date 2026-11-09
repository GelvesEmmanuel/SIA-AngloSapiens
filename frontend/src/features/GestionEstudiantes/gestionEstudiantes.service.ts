import api from "../../api/axios";
import type {
  ArchivoEstudianteField,
  PreRegistrarEstudiantePayload,
  PreRegistrarEstudianteResponse,
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