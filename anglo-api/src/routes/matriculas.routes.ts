import { Router } from "express";
import {
  actualizarMatriculaController,
  cambiarEstadoMatriculaController,
  crearMatriculaController,
  listarMatriculasController,
  obtenerMatriculaPorIdController,
} from "../controllers/matriculas.controller.js";
import { autorizarRoles, verificarToken } from "../middlewares/auth.midleware.js";

const router = Router();
router.use(
  verificarToken,
  autorizarRoles("SUPER_ADMIN",  "COORD_ADMINISTRATIVO"),
);
router.get("/listar", listarMatriculasController);
router.get("/listar/:id", obtenerMatriculaPorIdController);
router.post("/registrar", crearMatriculaController);
router.patch("/actualizar/:id", actualizarMatriculaController);
router.patch("/estado/:id", cambiarEstadoMatriculaController);

export default router;
