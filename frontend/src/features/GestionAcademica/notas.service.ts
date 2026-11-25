import api from "../../api/axios";
import type {
  ApiResponse,
  ExamenFinalActualizado,
  NotaHabilidadPayload,
  NotasActualizadas,
  NotasMatricula,
  PublicacionNotasActualizada,
  ResumenNotasEstudiante,
} from "./notas.types";

export const consultarNotasMatricula = async (matriculaId: string) => {
  const response = await api.get<ApiResponse<NotasMatricula>>(
    `/notas/matricula/${matriculaId}`,
  );
  return response.data.data;
};

export const registrarNotasHabilidades = async (
  matriculaId: string,
  notas: NotaHabilidadPayload[],
) => {
  const response = await api.put<ApiResponse<NotasActualizadas>>(
    `/notas/matricula/${matriculaId}`,
    { notas },
  );
  return response.data.data;
};

export const registrarNotaExamenFinal = async (
  matriculaId: string,
  notaExamenFinal: number,
) => {
  const response = await api.patch<ApiResponse<ExamenFinalActualizado>>(
    `/notas/matricula/${matriculaId}/examen-final`,
    { notaExamenFinal },
  );
  return response.data.data;
};

export const cambiarPublicacionNotas = async (
  matriculaId: string,
  notasPublicadas: boolean,
) => {
  const response = await api.patch<ApiResponse<PublicacionNotasActualizada>>(
    `/notas/matricula/${matriculaId}/publicacion`,
    { notasPublicadas },
  );
  return response.data.data;
};

export const consultarMisNotas = async () => {
  const response = await api.get<ApiResponse<ResumenNotasEstudiante[]>>(
    "/notas/mis-notas",
  );
  return response.data.data;
};
