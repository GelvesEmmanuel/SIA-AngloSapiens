export type EstudianteStatus =
  | "PRE_REGISTRADO"
  | "REGISTRADO"
  | "MATRICULADO"
  | "INACTIVO";

export type TipoDocumentoEstudiante = "CC" | "CE" | "TI" | "PAS";
export type TipoContacto = "ACUDIENTE_LEGAL" | "EMERGENCIA";

export type CategoriaDocumento =
  | "FOTO"
  | "CEDULA"
  | "FIRMA"
  | "DISCAPACIDAD";

export type ArchivoEstudianteField = 
  | "profilePicture"
  | "identityDocument"
  | "disabilityCertificate"
  | "firmaDigital";

export interface ContactoEstudiantePayload {
  tipo: TipoContacto;
  nombre: string;
  apellidos: string;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  telefono: string;
  direccion?: string | null;
  ocupacion?: string | null;
  parentesco: string;
}

export interface ActualizarContactoEstudiantePayload
  extends ContactoEstudiantePayload {
  id?: string;
}

export interface ContactoEstudiante extends ContactoEstudiantePayload {
  id: string;
  estudianteId: string;
  tipoDocumento: string | null;
  numeroDocumento: string | null;
  direccion: string | null;
  ocupacion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PreRegistrarEstudiantePayload {
  tipoDocumento: TipoDocumentoEstudiante;
  numeroDocumento: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  telefono?: string | null;
  gradoAcademico?: string | null;
  institucionEducativa?: string | null;
  reportaDiscapacidad: boolean;
  contactos: ContactoEstudiantePayload[];
  profilePicture: File;
  identityDocument: File;
  disabilityCertificate?: File;
}

export interface ArchivoEstudiante {
  id: string;
  categoria: CategoriaDocumento;
  pathOriginal: string;
  url: string | null;
  estado: "VIGENTE" | "HISTORICO";
}

export interface Estudiante {
  id: string;
  usuarioId: string | null;
  codigo: string;
  tipoDocumento: TipoDocumentoEstudiante;
  numeroDocumento: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  telefono: string | null;
  gradoAcademico: string | null;
  institucionEducativa: string | null;
  terminosyCondiciones: boolean;
  consentimientoUsoImagen: boolean;
  reportaDiscapacidad: boolean;
  estado: EstudianteStatus;
  motivoInactivacion: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  edadCaculada?: number;
  contactos: ContactoEstudiante[];
  documentos: ArchivoEstudiante[];
}

export interface ListarEstudiantesParams {
  page?: number;
  limit?: number;
  busqueda?: string;
  estado?: EstudianteStatus;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

export interface PreRegistrarEstudianteResponse
  extends ApiResponse<Estudiante> {
  documentPaths: Partial<Record<ArchivoEstudianteField, string>>;
}

export interface RegistrarEstudianteConFirmaPayload {
  numeroDocumento: string;
  terminosyCondiciones: boolean;
  consentimientoUsoImagen: boolean;
  firmaDigital: File;
}

export interface RegistrarEstudianteConFirmaResponse
  extends ApiResponse<Estudiante & { usernameGenerado: string }> {
  documentPaths: { firmaDigital: string };
}
export interface CambiarEstadoEstdiantePayload {
  nuevoEstado: EstudianteStatus;
  motivoInactivacion?: string | null;
}
export type AccionEstudiante =
  | {
      tipo: "estado";
      estudianteId: string;
    }
  | {
      tipo: "actualizar_datos";
      estudianteId: string;
    }
  | {
      tipo: "actualizar_documentos";
      estudianteId: string;
    }
  | {
      tipo: "actualizar_contactos";
      estudianteId: string;
    }
  | null;