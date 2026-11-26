// este servcie lo que hace procesa la funcion o helper para registrar la auditoria en el esquema auditoria sistema 
import {db} from '../config/db.js'
import {auditoriaSistema} from '../config/db/schema.js'
import { desc, eq, inArray } from 'drizzle-orm'
type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];
type AccionAuditoria = 'CREATE' | 'UPDATE' | 'CAMBIOESTADO' | 'LOGIN' | 'CAMBIO_CONTRASEÑA' | ' ESTADO_CAMBIADO';

export const TABLAS_AUDITABLES = [
  'grupos',
  'cursos',
  'matriculas',
  'usuarios',
  'estudiantes',
  'docentes',
  'periodos_academicos',
] as const;

export type TablaAuditable = (typeof TABLAS_AUDITABLES)[number];

interface RegistrarAuditoriaParams{
    usuarioId: string;
    tablaAfectada: string;
    registroId: string;
    accion: any;
    datosAntiguos?: any;
    datosNuevos?: any;
    motivo?: string;
} 
export const registrarAuditoria = async (
  params: RegistrarAuditoriaParams,
  tx?: Transaccion,
) => {
  try {
    const conexion = tx ?? db;
    await conexion.insert(auditoriaSistema).values({
      usuarioId: params.usuarioId,
      tablaAfectada: params.tablaAfectada,
      registroId: params.registroId,
      accion: params.accion,
      datosAntiguos: params.datosAntiguos ?? null,
      datosNuevos: params.datosNuevos ?? null,
      motivo: params.motivo ?? null,
    });
  } catch (error) {
    if (tx) throw error;
    // La auditoría nunca debe tumbar la petición principal del usuario, 
    // pero es vital registrar el fallo en consola si llega a fallar.
    console.error('Error al registrar traza de auditoría:', error);
  }
};

export const obtenerAuditorias = async (tablaAfectada?: TablaAuditable) => {
  const filtro = tablaAfectada
    ? eq(auditoriaSistema.tablaAfectada, tablaAfectada)
    : inArray(auditoriaSistema.tablaAfectada, TABLAS_AUDITABLES);

  return db
    .select()
    .from(auditoriaSistema)
    .where(filtro)
    .orderBy(desc(auditoriaSistema.createdAt));
};


