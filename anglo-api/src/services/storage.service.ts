// src/services/storage.service.ts
import fs from 'fs/promises';
import { supabase } from '../config/storage.js';

const BUCKET: string = process.env.SUPABASE_BUCKET || 'AngloPrueba';

/**
 * Sube un archivo a Supabase Storage
 */
export async function subirArchivo(
  localPath: string, 
  carpeta: string, 
  mimetype: string
): Promise<string> {
  try {
    // Leer archivo como Buffer
    const buffer = await fs.readFile(localPath);

    // Generar nombre único en Supabase
    const nombreArchivo = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = localPath.split('.').pop() || '';
    const storagePath = `${carpeta}/${nombreArchivo}.${extension}`;

    // Subir a Supabase
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: mimetype,
        upsert: false,
      });
      console.log('Resultado de la subida a Supabase:', { data, error });

    if (error) {
      throw new Error(`Error Supabase: ${error.message}`);
    }

    if (!data) {
      throw new Error('No se recibieron datos de la subida');
    }

    return data.path;
  } catch (error: any) {
    // Tipamos el error como 'any' para poder acceder a .message sin que TS proteste
    throw new Error(`Error al subir archivo: ${error.message}`);
  }
}

/**
 * Genera URL firmada para acceder a archivo privado
 */
export async function obtenerUrlFirmada(
  storagePath: string, 
  segundos: number = 600
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, segundos);

    if (error) {
      throw new Error(`Error al generar URL: ${error.message}`);
    }

    if (!data) {
      throw new Error('No se recibió la URL firmada');
    }

    return data.signedUrl;
  } catch (error: any) {
    throw new Error(`Error al obtener URL firmada: ${error.message}`);
  }
}

/**
 * Elimina archivo del bucket
 */
export async function eliminarArchivo(storagePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath]);

    if (error) {
      throw new Error(`Error al eliminar: ${error.message}`);
    }
  } catch (error: any) {
    throw new Error(`Error al eliminar archivo: ${error.message}`);
  }
}
