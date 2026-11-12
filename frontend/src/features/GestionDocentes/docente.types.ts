import type { UserRole } from "../auth/auth.types";

// Estados de las cuentas / docentes.
export type DocenteStatus = "ACTIVO" | "INACTIVO" | "REGISTRADO";

// Categorías permitidas para los documentos del docente.
export type CategoriaDocumento = "FOTO" | "CEDULA" | "FIRMA" | "CV" | "CERTIFICACION" | "DISCAPACIDAD";

// Estructura de un archivo individual devuelto en el expediente.
export interface ArchivoDocente {
  id: string;
  categoria: CategoriaDocumento;
  pathOriginal: string;
  url: string | null; // URL firmada lista para usar en el frontend (<img src={url} /> o window.open)
  estado: "VIGENTE" | "HISTORICO";
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}
// Estructura completa del Docente (Expediente / Hoja de Vida).
export interface Docente {
    id: string;
  usuarioId: string | null;
  codigo: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  telefono: string | null;
  formacionAcademica: string | null;
  experienciaLaboral: string | null;
  fechaVinculacion: string | null; 
  reportaDiscapacidad: boolean;
  estado: DocenteStatus;
  motivoInactivacion: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  documentos: ArchivoDocente[];
}

export interface CrearDocenteResponse {
  docenteId: string;
  codigo: string;
}

export interface UsuarioDisponibleDocencia {
  usuarioId: string;
  username: string;
  documentoIdentidad: string;
  nombre: string;
  apellidos: string;
  roles: UserRole[];
}

export interface VincularDocentePayload {
  tipoDocumento: "CC" | "CE" | "TI" | "PAS";
  fechaNacimiento: string;
  telefono?: string;
  correo?: string;
  formacionAcademica?: string;
  experienciaLaboral?: string;
  reportaDiscapacidad: boolean;
}

export interface VincularDocenteResponse {
  success: boolean;
  message: string;
  data: Docente;
}

// Parámetros para listar o filtrar docentes (opcional).
export interface ListarDocentesParams {
  page?: number;
  limit?: number;
  busqueda?: string;
  estado?: DocenteStatus;
}

// Datos para registrar un docente (Payload que envías por form-data o JSON al registrar).
export interface CrearDocentePayload {
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  apellidos: string;
  correo: string;
  telefono?: string;
  formacionAcademica?: string;
  reportaDiscapacidad: boolean;
  // Nota: Si usas FormData en el frontend para enviar archivos junto al texto, 
  // los archivos se suelen adjuntar directamente al objeto FormData de JavaScript.
}
export interface DocenteDetalle {
  id: string;
  codigo: string;
  nombre: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  estado: DocenteStatus;
  tipoDocumento: string;
  numeroDocumento: string;
  formacionAcademica: string | null;
  reportaDiscapacidad: boolean;
  createdAt: string;
  updatedAt: string;
  documentos: ArchivoDocente[];
}
export interface CambiarEstadoDocentePayload {
  nuevoEstado: DocenteStatus;
  motivoInactivacion?: string | null;
}
