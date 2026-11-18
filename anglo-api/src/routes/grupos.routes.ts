import { Router } from "express";
import {
  actualizarGrupoController,
  cambiarDocenteGrupoController,
  cambiarEstadoGrupoController,
  cancelarGrupoController,
  crearGrupoController,
  listarEstudiantesPorGrupoController,
  listarGruposController,
  obtenerGrupoPorIdController,
} from "../controllers/grupos.controller.js";
import { autorizarRoles, verificarToken } from "../middlewares/auth.midleware.js";

const router = Router();
router.use(verificarToken);
router.get(
  "/listar/:id/estudiantes",
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", "DOCENTE"),
  listarEstudiantesPorGrupoController,
);
router.get(
  "/listar",
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", "DOCENTE"),
  listarGruposController,
);
router.get(
  "/listar/:id",
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", "DOCENTE"),
  obtenerGrupoPorIdController,
);
router.use(autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO"));
router.post("/registrar", crearGrupoController);
router.patch("/actualizar/:id", actualizarGrupoController);
router.patch("/estado/:id", cambiarEstadoGrupoController);
router.patch("/cancelar/:id", cancelarGrupoController);
router.patch("/cambiar-docente/:id", cambiarDocenteGrupoController);

export default router;