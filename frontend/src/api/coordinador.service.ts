import api from './axios';

export interface RegistrarCoordinadorPayload {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  documentoIdentidad: string;
  diaCumpleanos: number;
  rol: 'COORD_ACADEMICO' | 'COORD_ADMINISTRATIVO';
}

export const coordinadorService = {
  registrar: async (payload: RegistrarCoordinadorPayload) => {
    const response = await api.post('/auth/usuarios', payload);
    return response.data; // Retorna { exito, mensaje, datos: { username, ... } }
  },
};