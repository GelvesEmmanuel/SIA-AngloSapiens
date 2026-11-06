
// controlador para las funciones de los archivos como poder verlos y actuaizarlos
import { Request, Response } from "express";
import { obtenerUrlFirmada } from "../services/storage.service.js";
import {archivos} from "../config/db/schema.js"
import {db} from "../config/db.js"
import {eq} from 'drizzle-orm'
// funcion para obtener url firmada y poder renderizar el archivo en el frontend
export const verArchivoController = async (req: Request, res: Response) => {
  try {
    const { path } = req.query;

    if (!path || typeof path !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'El parámetro "path" es requerido y debe ser una cadena de texto válida.'
      });
    }

    // 🛡️ MEJORA DE SEGURIDAD: Verificar en la BD si el archivo existe y está registrado
    const [archivoRegistrado] = await db
      .select()
      .from(archivos)
      .where(eq(archivos.urlArchivo, path))
      .limit(1);

    if (!archivoRegistrado) {
      return res.status(404).json({
        success: false,
        message: 'El archivo solicitado no se encuentra registrado en el sistema.'
      });
    }

    // Si existe en BD, procedemos a generar la URL firmada temporal (ej. 1 hora = 3600s)
    const signedUrl = await obtenerUrlFirmada(path, 3600);

    return res.status(200).json({
      success: true,
      url: signedUrl,
      categoria: archivoRegistrado.categoria,
      estado: archivoRegistrado.estado
    });

  } catch (error: any) {
    console.error('Error al procesar la visualización del archivo:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno al obtener la URL del archivo'
    });
  }
};