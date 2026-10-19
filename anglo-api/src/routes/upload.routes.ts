// src/routes/upload.routes.js
import { Router } from 'express';
import { upload } from '../libs/multer.libs.js';
import { validarTipoArchivo, validarMultiplesArchivos } from '../middlewares/validarTypoArchivo.middlewar.js';
import {subirFotoPerfil, subirMultiplesArchivos  } from '../controllers/upload.controller.js';

const router = Router();

// Tipos permitidos
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/jpg'];
const TIPOS_DOCUMENTO = ['application/pdf'];
const TIPOS_TODOS = [...TIPOS_IMAGEN, ...TIPOS_DOCUMENTO];

/**
 * POST /api/upload/foto-perfil
 * Sube foto de perfil de estudiante
 * Body: form-data con campo "fotoPerfil"
 */
router.post(
  '/foto-perfil',
  upload.single('fotoPerfil'),
  validarTipoArchivo(TIPOS_IMAGEN),
  subirFotoPerfil
);

/**
 * POST /api/upload/cedula
 * Sube cédula del estudiante (PDF)
 * Body: form-data con campo "cedula"
 */
router.post(
  '/cedula',
  upload.single('cedula'),
  validarTipoArchivo(TIPOS_DOCUMENTO),
  subirFotoPerfil // Reutiliza el controlador, pero con carpeta diferente
);

/**
 * POST /api/upload/documentos
 * Sube múltiples documentos
 * Body: form-data con campo "documentos" (máximo 5 archivos)
 */
router.post(
  '/documentos',
  upload.array('documentos', 5),
  validarMultiplesArchivos(TIPOS_TODOS, 5),
  subirMultiplesArchivos
);

export default router;