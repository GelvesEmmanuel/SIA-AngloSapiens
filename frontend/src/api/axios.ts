import axios from "axios";
import { authStorage } from "../features/auth/auth.storage";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

if (!backendUrl) {
  throw new Error(
    "Falta configurar la variable VITE_BACKEND_URL."
  );
}

const api = axios.create({
  baseURL: `${backendUrl}/api`,
  headers: {
    Accept: "application/json",
  },
});

// Añadir el JWT en solicitudes autenticadas.
api.interceptors.request.use(
  (config) => {
    const session = authStorage.getSession();

    if (session?.token) {
      config.headers.set(
        "Authorization",
        `Bearer ${session.token}`
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;