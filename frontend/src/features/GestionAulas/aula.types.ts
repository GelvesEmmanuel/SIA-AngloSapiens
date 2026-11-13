export interface Aula {
  id: string;
  nombre: string;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
