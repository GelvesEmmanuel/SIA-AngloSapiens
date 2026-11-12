import { Router } from "express";
import { upload } from "../libs/multer.libs.js";
import { autorizarRoles, verificarToken } from "../middlewares/auth.midleware.js";
import {
  preRegistrarEstudianteController,
  registrarEstudianteConFirmaController,
  listarEstudiantesController,
  obtenerEstudianteConArchivosPorIdController,
  cambiarEstadoEstudianteController,
  actualizarDatosEstudianteController,
  actualizarDatosContactoEstudianteController,
  actualizarDocumentosEstudianteController
} from "../controllers/estudiantes.controller.js";
import { crearEstudianteSchema } from "../validators/estudiante.validator.js";
import { validarSchema } from "../middlewares/validarDocente.middlewar.js";
const router = Router();


// Multer para estudiante 
const uploadEstudentsFields = upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'identityDocument', maxCount: 1 },
  { name: 'disabilityCertificate', maxCount: 1 },
   { name: 'firmaDigital', maxCount: 1 },
]);
const uploadFirmaEstudiante = upload.fields([
  { name: 'firmaDigital', maxCount: 1 },
]);
const autorizado = autorizarRoles("SUPER_ADMIN","COORD_ADMINISTRATIVO")
router.get("/listar",verificarToken, autorizado, listarEstudiantesController); // listar docentes con filtros de estado y busqueda
router.get("/listar/:id", verificarToken, autorizado, obtenerEstudianteConArchivosPorIdController);
router.post("/preRegistrar", verificarToken,autorizado, uploadEstudentsFields,validarSchema(crearEstudianteSchema), preRegistrarEstudianteController)
router.post("/registrar", verificarToken, autorizado, uploadFirmaEstudiante, registrarEstudianteConFirmaController);
router.patch("/estado/:id", verificarToken, autorizado, cambiarEstadoEstudianteController)
router.patch("/actualizar/:id", verificarToken, autorizado, actualizarDatosEstudianteController)
router.patch("/contactos/:id", verificarToken, autorizado, actualizarDatosContactoEstudianteController)
router.patch("/actualizardocumento/:id", verificarToken, autorizado,uploadEstudentsFields,  actualizarDocumentosEstudianteController)
export default router;