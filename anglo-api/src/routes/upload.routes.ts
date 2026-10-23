// src/routes/upload.routes.js
import { Router } from 'express';
import { upload } from '../libs/multer.libs.js';
import { validarArchivosPorCampos } from '../middlewares/validarArchivo.middlewat.js';
import {registrarUsuarioConArchivos } from '../controllers/upload.controller.js';

const router = Router();

// Tipos permitidos
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/jpg'];
const TIPOS_DOCUMENTO = ['application/pdf'];
const TIPOS_TODOS = [...TIPOS_IMAGEN, ...TIPOS_DOCUMENTO];

/**
 * POST /api/upload/foto-perfil
 * Sube foto de perfil de estudiante
 * Body: form-data con campo "fotoPerfil"
 

const uploadFieldsMiddleware = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'identityDocument', maxCount: 1 },
  { name: 'disabilityCertificate', maxCount: 1 },
  { name: 'cv', maxCount: 1 } // Docente
]);
const validacionReglas = validarArchivosPorCampos([
  { name: 'profilePicture', tiposPermitidos: ['image/jpeg', 'image/png'], required: true },
  { name: 'identityDocument', tiposPermitidos: ['image/jpeg', 'image/png', 'application/pdf'], required: true },
  { name: 'disabilityCertificate', tiposPermitidos: ['image/jpeg', 'image/png', 'application/pdf'], required: false },
  { name: 'cv', tiposPermitidos: ['application/pdf'], required: false } // Solo si es docente
]);


router.post('/registerArchivos', uploadFieldsMiddleware, validacionReglas, registrarUsuarioConArchivos);


*/
// Multer para Estudiante (No exige CV)
const uploadStudentFields = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'identityDocument', maxCount: 1 },
  { name: 'disabilityCertificate', maxCount: 1 }
]);

// Multer para Docente (Sí exige CV)
const uploadTeacherFields = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'identityDocument', maxCount: 1 },
  { name: 'disabilityCertificate', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]);



/*
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
 
router.post(
  '/DocumentoIdentidad',
  upload.single('DocumentoIdentidad'),
  validarTipoArchivo(TIPOS_DOCUMENTO),
  subirDocumentoIdentidad // Reutiliza el controlador, pero con carpeta diferente
);

/**
 * POST /api/upload/hoja-de-vida
 * Sube la hoja de vida del docente (PDF)
 * Body: form-data con campo "hojaDeVida"
 
router.post(
  '/documentos',
  upload.array('documentos', 5),
  validarMultiplesArchivos(TIPOS_TODOS, 5),
  subirMultiplesArchivos
);
*/
export default router;

