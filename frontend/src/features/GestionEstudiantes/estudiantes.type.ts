export type EstudianteStatus =
  | "PRE_REGISTRADO"
  | "REGISTRADO"
  | "MATRICULADO"
  | "INACTIVO";

export type TipoDocumentoEstudiante = "CC" | "CE" | "TI" | "PAS";

export type CategoriaDocumento =
  | "FOTO"
  | "CEDULA"
  | "FIRMA"
  | "DISCAPACIDAD";

export type ArchivoEstudianteField =
  | "profilePicture"
  | "identityDocument"
  | "disabilityCertificate";

export interface ContactoEstudiantePayload {
  tipo: string;
  nombre: string;
  apellidos: string;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  telefono: string;
  direccion?: string | null;
  ocupacion?: string | null;
  parentesco: string;
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
  reportaDiscapacidad: boolean;
  estado: EstudianteStatus;
  motivoInactivacion: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  edadCaculada: number;
  contactos: ContactoEstudiante[];
}

export interface ArchivoEstudiante {
  id: string;
  categoria: CategoriaDocumento;
  pathOriginal: string;
  url: string | null;
  estado: "VIGENTE" | "HISTORICO";
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