// src/controllers/user.controller.ts (o en tu upload.controller.ts)
import { Request, Response } from 'express';
import fs from 'fs/promises';
import { subirArchivo, obtenerUrlFirmada } from '../services/storage.service.js';

export const registrarUsuarioConArchivos = async (req: Request, res: Response): Promise<Response | void> => {
  const uploadedFilesPaths: string[] = []; // Para limpieza si ocurre un error global

  try {
    // 1. Datos de texto del formulario (nombre, email, rol, etc.)
    const formData = req.body;

    // 2. Archivos agrupados por campo gracias a upload.fields()
    // req.files será un objeto: { profilePicture: [file], identityDocument: [file], ... }
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const storedDocuments: Record<string, any> = {};

    if (files) {
      // Iteramos sobre cada campo de archivo recibido
      for (const [fieldname, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
          const file = fileArray[0];
          uploadedFilesPaths.push(file.path); // Guardamos la ruta local para limpieza

          // Determinamos la carpeta de Supabase según el campo del formulario
          let carpetaSupabase = 'Otros';
          if (fieldname === 'profilePicture') carpetaSupabase = 'FotosPerfil';
          if (fieldname === 'identityDocument') carpetaSupabase = 'DocumentosIdentidad';
          if (fieldname === 'disabilityCertificate') carpetaSupabase = 'CertificadosDiscapacidad';
          if (fieldname === 'cv') carpetaSupabase = 'HojasDeVida';

          // Subimos usando tu servicio existente
          const storagePath = await subirArchivo(
            file.path,
            carpetaSupabase,
            file.mimetype
          );

          // Limpiamos el archivo temporal local de inmediato
          await fs.unlink(file.path).catch(() => {});

          // Opcional: Generar URL temporal de validación
          const urlTemporal = await obtenerUrlFirmada(storagePath, 600);

          // Guardamos los datos para estructurarlos en la BD
          storedDocuments[fieldname] = {
            storagePath,
            urlTemporal,
            fileName: file.originalname,
            size: file.size
          };
        }
      }
    }

    // 3. Aquí guardarías 'formData' y las rutas de 'storedDocuments' en tu Base de Datos (Prisma/Drizzle/etc.)
    // const nuevoUsuario = await UserService.crearEnBD({ ...formData, documentos: storedDocuments });

    return res.status(201).json({
      ok: true,
      message: 'Usuario y documentos registrados exitosamente',
      data: {
        user: formData,
        documents: storedDocuments
      }
    });

  } catch (error: any) {
    // Limpieza de emergencia de cualquier archivo local que haya quedado pendiente
    for (const filePath of uploadedFilesPaths) {
      await fs.unlink(filePath).catch(() => {});
    }

    console.error('Error en el registro unificado:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Error interno al procesar el registro'
    });
  }
};