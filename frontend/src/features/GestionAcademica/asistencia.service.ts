import api from "../../api/axios";

interface ApiResponse<T> {
  exito: boolean;
  mensaje?: string;
  datos: T;
}

export interface AusenteAsistencia {
  estudianteId: string;
  motivoInasistencia: string | null;
}

export interface AsistenciaPorFecha {
  claseRegistrada: boolean;
  sesion: { id: string; fechaClase: string } | null;
  ausentes: Array<{
    estudianteId: string;
    motivoInasistencia: string | null;
  }>;
}

export interface ItemHistorialInasistencia {
  asistenciaId: string;
  sesionId: string;
  fechaClase: string;
  estudianteId: string;
  estudianteCodigo: string;
  estudianteNombre: string;
  estudianteApellidos: string;
  estado: "AUSENTE";
  motivoInasistencia: string | null;
  createdAt: string;
}

export interface HistorialInasistenciasGrupoResponse {
  grupoId: string;
  totalInasistencias: number;
  inasistencias: ItemHistorialInasistencia[];
}
// --- NUEVOS TIPOS PARA CONTEO ACUMULADO ---
export interface ConteoEstudianteInasistencia {
  estudianteId: string;
  totalInasistencias: number;
  totalSesionesDictadas: number;
}

export interface ConteoInasistenciasGrupoResponse {
  grupoId: string;
  totalSesionesDictadas: number;
  estudiantes: ConteoEstudianteInasistencia[];
}

export const obtenerAsistenciaFecha = async (grupoId: string, fecha: string) => {
  const response = await api.get<ApiResponse<AsistenciaPorFecha>>(
    `/gestion-academica/grupos/${grupoId}/asistencias`,
    { params: { fecha } },
  );
  return response.data.datos;
};

export const registrarAsistencia = async (
  grupoId: string,
  fechaClase: string,
  ausentes: AusenteAsistencia[],
  editar: boolean,
) => {
  const request = editar ? api.patch : api.post;
  const response = await request<ApiResponse<unknown>>(
    `/gestion-academica/grupos/${grupoId}/asistencias`,
    { fechaClase, ausentes },
  );
  return response.data;
};

// obtener conteod e inaxistencias por grupo 
export const obtenerConteoInasistenciasGrupo = async (grupoId: string) => {
  const response = await api.get<ApiResponse<ConteoInasistenciasGrupoResponse>>(
    `/gestion-academica/grupos/${grupoId}/asistencias/conteo`,
  );
  return response.data.datos;
};
// obtener el historial d elas inaxistencias del grupo
export const obtenerHistorialInasistenciasGrupo = async (grupoId: string) => {
  const response = await api.get<ApiResponse<HistorialInasistenciasGrupoResponse>>(
    `/gestion-academica/grupos/${grupoId}/asistencias/historial`,
  );
  return response.data.datos;
};
