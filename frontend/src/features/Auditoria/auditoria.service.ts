import api from "../../api/axios";
import type {
  AuditoriasResponse,
  TablaAuditable,
} from "./auditoria.types";

export const listarAuditorias = async (
  tablaAfectada?: TablaAuditable,
): Promise<AuditoriasResponse> => {
  const response = await api.get<AuditoriasResponse>("/admin/auditorias", {
    params: tablaAfectada ? { tablaAfectada } : undefined,
  });

  return response.data;
};
