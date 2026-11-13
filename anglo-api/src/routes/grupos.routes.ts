import { Router } from "express";
import {
  actualizarGrupoController,
  cambiarDocenteGrupoController,
  cambiarEstadoGrupoController,
  cancelarGrupoController,
  crearGrupoController,
  listarGruposController,
  obtenerGrupoPorIdController,
} from "../controllers/grupos.controller.js";
import { autorizarRoles, verificarToken } from "../middlewares/auth.midleware.js";

const router = Router();
router.use(
  verificarToken,
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", ),
);
router.get("/listar", listarGruposController);
router.get("/listar/:id", obtenerGrupoPorIdController);
router.post("/registrar", crearGrupoController);
router.patch("/actualizar/:id", actualizarGrupoController);
router.patch("/estado/:id", cambiarEstadoGrupoController);
router.patch("/cancelar/:id", cancelarGrupoController);
router.patch("/cambiar-docente/:id", cambiarDocenteGrupoController);

export default router;