import { Router } from "express";
import { db } from "../config/db/conexion.js";
import { docentes } from "../config/db/schema.js";
import {
  registrarDocenteController,
  obtenerDocentesController,
  //obtenerDocentePorIdController,
  //actualizarDocenteController,
} from "../controllers/docentes.controller.js";
import { upload } from "../libs/multer.libs.js";
import { validarSchema } from "../middlewares/validarDocente.middlewar.js";
import { crearDocenteSchema } from "../validators/docente.validator.js";
import { autorizarRoles, verificarToken  } from "../middlewares/auth.midleware.js";

const router = Router();
const autorizado = autorizarRoles('SUPER_ADMIN', 'COORD_ADMINISTRATIVO', 'COORD_ACADEMICO'); // los roles que tiene permiso ala ruta
router.get("/docentes", obtenerDocentesController);
//router.get("/docentes/:id", obtenerDocentePorIdController);

// Multer para Docente (Sí exige CV)
const uploadTeacherFields = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'identityDocument', maxCount: 1 },
  { name: 'disabilityCertificate', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]);


router.post("/docentes", verificarToken, autorizado, uploadTeacherFields,validarSchema(crearDocenteSchema), registrarDocenteController);
//router.put("/docentes/:id", actualizarDocenteController);

export default router;
