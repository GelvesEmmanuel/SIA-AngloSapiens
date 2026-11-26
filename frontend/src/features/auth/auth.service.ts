import api from '../../api/axios';
import type {
    ApiResponse,
    LoginPayload,
    LoginResponse,
    PerfilAutenticado,
} from './auth.types';
import type { CambiarContrasenaPayload } from './auth.types';
export const authService ={
    login: async(credentials: LoginPayload) => {

        const response = await api.post<LoginResponse>('/auth/login', credentials);
        return response.data; // retorna exito {exito, mensaje, dato{token,usuario}}
    },

    obtenerPerfilActual: async () => {
        const response = await api.get<ApiResponse<PerfilAutenticado>>('/auth/perfil');
        return response.data;
    },

    cambiarContrasena: async(payload: CambiarContrasenaPayload) =>{
        const response = await api.patch('/auth/cambiar-contrasena', payload);
        return response.data;
    },

    cambiarContrasenaDesdeSesion: async(payload: CambiarContrasenaPayload) =>{
        const response = await api.patch('/auth/cambiar-contrasena-sesion', payload);
        return response.data;
    },

    logout : async ()=>{
        const response = await api.post('/auth/logout');
        return response.data;
    }
}