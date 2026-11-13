export type EstadoMatricula = "ACTIVA" | "CANCELADA" | "FINALIZADA";
export type TipoMatricula = "REGULAR" | "EXTENSIVA";
export type ModoPagoMatricula = "CONTADO" | "CUOTAS";
export type EstadoPagoMatricula = "PAGO" | "NO_PAGO";

export interface Matricula {
  id: string;
  estudianteId: string;
  grupoId: string;
  codigo: string;
  tipoMatricula: TipoMatricula;
  valorAcordado: string | number | null;
  descuentoAplicado: string | number | null;
  modoPago: ModoPagoMatricula | null;
  estadoPago: EstadoPagoMatricula;
  estadoMatricula: EstadoMatricula;
  observaciones: string | null;
  fechaFinalizacion: string | null;
  fechaMatricula: string;
  fechaCancelacion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MatriculaPayload {
  estudianteId: string;
  grupoId: string;
  tipoMatricula?: TipoMatricula;
  valorAcordado?: number | null;
  descuentoAplicado?: number | null;
  modoPago?: ModoPagoMatricula | null;
  estadoPago?: EstadoPagoMatricula;
  observaciones?: string | null;
}

export type ActualizarMatriculaPayload = Partial<
  Omit<MatriculaPayload, "estudianteId" | "grupoId">
>;

export interface FiltrosMatricula {
  estudianteId?: string;
  grupoId?: string;
  estadoMatricula?: EstadoMatricula;
  estadoPago?: EstadoPagoMatricula;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
