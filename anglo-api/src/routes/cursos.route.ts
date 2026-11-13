import { Router } from "express";
import {
  activarCursoController,
  actualizarCursoController,
  inactivarCursoController,
  listarCursosController,
  obtenerCursoPorIdController,
  registrarCursoController,
} from "../controllers/cursos.controller.js";
import { autorizarRoles, verificarToken } from "../middlewares/auth.midleware.js";

const router = Router();
const autorizado = autorizarRoles(
  "SUPER_ADMIN",
  "COORD_ACADEMICO",
);

router.use(verificarToken, autorizado);
router.get("/listar", listarCursosController);
router.get("/listar/:id", obtenerCursoPorIdController);
router.post("/registrar", registrarCursoController);
router.patch("/actualizar/:id", actualizarCursoController);
router.patch("/activar/:id", activarCursoController);
router.patch("/inactivar/:id", inactivarCursoController);

export default router;