import { Router } from "express";
import { preRegistrarEstudiante } from "../services/estudiante.service.js";
import { upload } from "../libs/multer.libs.js";
import { autorizarRoles, verificarToken } from "../middlewares/auth.midleware.js";
import { preRegistrarEstudianteController } from "../controllers/estudiantes.controller.js";
import { crearEstudianteSchema } from "../validators/estudiante.validator.js";
import { validarSchema } from "../middlewares/validarDocente.middlewar.js";
const router = Router();

// Multer para Docente (Sí exige CV)
const uploadEstudentsFields = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'identityDocument', maxCount: 1 },
  { name: 'disabilityCertificate', maxCount: 1 },
]);
const autorizado = autorizarRoles("SUPER_ADMIN","COORD_ADMINISTRATIVO")
router.post("/preRegistrar", verificarToken,autorizado, uploadEstudentsFields,validarSchema(crearEstudianteSchema), preRegistrarEstudianteController)
export default router;