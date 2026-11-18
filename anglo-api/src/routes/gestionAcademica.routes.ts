import { Router } from "express";
import { obtenerMisGruposController } from "../controllers/gestionAcademica.controller.js";
import { autorizarRoles, verificarToken } from "../middlewares/auth.midleware.js";

const router = Router();

router.get(
  "/mis-grupos",
  verificarToken,
  autorizarRoles("ESTUDIANTE"),
  obtenerMisGruposController,
);

export default router;
