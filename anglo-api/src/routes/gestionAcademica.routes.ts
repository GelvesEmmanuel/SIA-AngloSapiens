import { Router } from "express";
import {
  guardarAsistenciaController,
  obtenerAsistenciaFechaController,
  obtenerConteoInasistenciasController,
  obtenerMisGruposController,
  obtenerHistorialInasistenciasController
} from "../controllers/gestionAcademica.controller.js";
import { autorizarRoles, verificarToken } from "../middlewares/auth.midleware.js";

const router = Router();

router.get(
  "/mis-grupos",
  verificarToken,
  autorizarRoles("ESTUDIANTE", "DOCENTE"),
  obtenerMisGruposController,
);

router.use(verificarToken);

router.post(
  "/grupos/:grupoId/asistencias",
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", "DOCENTE"),
  guardarAsistenciaController,
);

router.patch(
  "/grupos/:grupoId/asistencias",
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", "DOCENTE"),
  guardarAsistenciaController,
);

router.get(
  "/grupos/:grupoId/asistencias",
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", "DOCENTE"),
  obtenerAsistenciaFechaController,
);

router.get(
  "/grupos/:grupoId/asistencias/historial",
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", "DOCENTE"),
  obtenerHistorialInasistenciasController,
);
router.get(
  "/grupos/:grupoId/asistencias/conteo",
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", "DOCENTE"),
  obtenerConteoInasistenciasController,
);

export default router;
