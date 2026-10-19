// src/controllers/upload.controller.ts
import { Request, Response } from 'express';
import fs from 'fs/promises';
import { subirArchivo, obtenerUrlFirmada } from '../services/storage.service.js';

/**
 * Controlador para subir foto de perfil
 */
export const subirFotoPerfil = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const file = req.file;

    // Validación obligatoria para TypeScript (evita el error 'Object is possibly undefined')
    if (!file) {
      return res.status(400).json({
        ok: false,
        error: 'No se recibió ningún archivo para la foto de perfil'
      });
    }
    console.log('Archivo recibido:', file);
    // 1. Subir a Supabase
    const storagePath = await subirArchivo(
      file.path,
      'FotosPerfil',
      file.mimetype
    );

    // 2. Limpiar archivo local
    await fs.unlink(file.path).catch(() => {});

    // 3. Generar URL temporal
    const urlTemporal = await obtenerUrlFirmada(storagePath, 600);

    // 4. Responder
    return res.status(201).json({
      ok: true,
      message: 'Foto de perfil subida correctamente',
      data: {
        storagePath,      // Guardar esto en tu BD
        urlTemporal,      // Para verificar ahora
        fileName: file.originalname,
        size: file.size
      }
    });

  } catch (error: any) {
    // Limpieza en caso de error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    console.error('Error en subirFotoPerfil:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * Controlador para subir múltiples archivos
 */
export const subirMultiplesArchivos = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const files = req.files;

    // Validación para TypeScript: asegurar que existan los archivos y vengan en formato Array plano
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({
        ok: false,
        error: 'No se recibieron archivos o el formato no es válido'
      });
    }

    // Definimos el tipo del array resultados para evitar problemas de tipo 'never[]'
    const resultados: any[] = [];

    // Procesar cada archivo de forma segura gracias al tipado de Multer
    for (const file of files as Express.Multer.File[]) {
      try {
        const storagePath = await subirArchivo(
          file.path,
          'Documentos',
          file.mimetype
        );

        await fs.unlink(file.path).catch(() => {});

        const urlTemporal = await obtenerUrlFirmada(storagePath, 600);

        resultados.push({
          fileName: file.originalname,
          storagePath,
          urlTemporal,
          size: file.size,
          status: 'success'
        });

      } catch (error: any) {
        // Limpiar archivo que falló
        await fs.unlink(file.path).catch(() => {});

        resultados.push({
          fileName: file.originalname,
          status: 'error',
          error: error.message || 'Error al procesar archivo'
        });
      }
    }

    return res.status(201).json({
      ok: true,
      message: `${resultados.filter(r => r.status === 'success').length} archivos subidos`,
      data: resultados
    });

  } catch (error: any) {
    // Limpiar todos los archivos en caso de error general
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        await fs.unlink(file.path).catch(() => {});
      }
    }

    console.error('Error en subirMultiplesArchivos:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Error interno del servidor'
    });
  }
};
