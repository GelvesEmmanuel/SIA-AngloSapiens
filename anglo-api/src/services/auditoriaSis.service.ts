// este servcie lo que hace procesa la funcion o helper para registrar la auditoria en el esquema auditoria sistema 
import {db} from '../config/db.js'
import {auditoriaSistema} from '../config/db/schema.js'
type AccionAuditoria = 'CREATE' | 'UPDATE' | 'CAMBIOESTADO' | 'LOGIN' | 'CAMBIO_CONTRASEÑA' | ' ESTADO_CAMBIADO';

interface RegistrarAuditoriaParams{
    usuarioId: string;
    tablaAfectada: string;
    registroId: string;
    accion: any;
    datosAntiguos?: any;
    datosNuevos?: any;
    motivo?: string;
} 
export const registrarAuditoria = async (params: RegistrarAuditoriaParams) => {
  try {
    await db.insert(auditoriaSistema).values({
      usuarioId: params.usuarioId,
      tablaAfectada: params.tablaAfectada,
      registroId: params.registroId,
      accion: params.accion,
      datosAntiguos: params.datosAntiguos ?? null,
      datosNuevos: params.datosNuevos ?? null,
      motivo: params.motivo ?? null,
    });
  } catch (error) {
    // La auditoría nunca debe tumbar la petición principal del usuario, 
    // pero es vital registrar el fallo en consola si llega a fallar.
    console.error('Error al registrar traza de auditoría:', error);
  }
};


