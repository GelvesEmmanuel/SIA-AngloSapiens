import { Router } from "express";
import { db } from "../config/db/conexion.js";
import { docentes } from "../config/db/schema.js";
import {
  registrarDocenteController,
  listarDocentesController,
  obtenerDocenteConArchivosPorIdController,
  //actualizarDocenteController,
  cambiarEstadoDocenteController,
  actualizarDatosDocenteController,
  actualizarDocumentosDocenteController,
} from "../controllers/docentes.controller.js";
import { upload } from "../libs/multer.libs.js";
import { validarSchema } from "../middlewares/validarDocente.middlewar.js";
import { crearDocenteSchema } from "../validators/docente.validator.js";
import { autorizarRoles, verificarToken  } from "../middlewares/auth.midleware.js";


const router = Router();
const autorizado = autorizarRoles('SUPER_ADMIN', 'COORD_ADMINISTRATIVO', 'COORD_ACADEMICO'); // los roles que tiene permiso ala ruta
router.get("/listar",verificarToken, autorizado, listarDocentesController); // listar docentes con filtros de estado y busqueda
router.get("/listar/:id", verificarToken, autorizado, obtenerDocenteConArchivosPorIdController);
// actualizar datos del docente
router.patch("/actualizar/:id", verificarToken, autorizado, actualizarDatosDocenteController)
// Multer para Docente (Sí exige CV)
const uploadTeacherFields = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'identityDocument', maxCount: 1 },
  { name: 'disabilityCertificate', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]);

// actualizar documentos docente
router.patch("/actualizardocumento/:id", verificarToken, autorizado,uploadTeacherFields, actualizarDocumentosDocenteController)
router.post("/docentes", verificarToken, autorizado, uploadTeacherFields,validarSchema(crearDocenteSchema), registrarDocenteController);
//router.put("/docentes/:id", actualizarDocenteController);
router.patch("/estado/:id", verificarToken, autorizado, cambiarEstadoDocenteController)
export default router;
