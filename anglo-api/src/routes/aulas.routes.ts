import { Router } from "express";
import {
  actualizarAulaController,
  cambiarEstadoAulaController,
  crearAulaController,
  listarAulasController,
  obtenerAulaPorIdController,
} from "../controllers/aulas.controller.js";
import { autorizarRoles, verificarToken } from "../middlewares/auth.midleware.js";

const router = Router();
router.use(
  verificarToken,
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", "COORD_ADMINISTRATIVO"),
);
router.get("/listar", listarAulasController);
router.get("/listar/:id", obtenerAulaPorIdController);
router.post("/registrar", crearAulaController);
router.patch("/actualizar/:id", actualizarAulaController);
router.patch("/estado/:id", cambiarEstadoAulaController);

export default router;
