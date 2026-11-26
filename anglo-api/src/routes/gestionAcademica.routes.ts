import { Router } from "express";
import {
  guardarAsistenciaController,
  obtenerAsistenciaFechaController,
  obtenerConteoInasistenciasController,
  obtenerMisGruposController,
  obtenerHistorialInasistenciasController
} from "../controllers/gestionAcademica.controller.js";
import { autorizarRoles, verificarToken } from "../middlewares/auth.midleware.js";
import {
  buscarEstudianteHistorialController,
  obtenerHistorialAcademicoEstudianteController,
} from "../controllers/historialAcademico.controller.js"

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


// ruta para obtener el historial academico del estudiante

router.get(
  "/historial-academico/buscar",
  verificarToken,
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", "COORD_ADMINISTRATIVO"),
  buscarEstudianteHistorialController,
);

router.get(
  "/mi-historial-academico",
  verificarToken,
  autorizarRoles("ESTUDIANTE"),
  obtenerHistorialAcademicoEstudianteController,
);

router.get(
  "/estudiantes/:estudianteId/historial-academico",
  verificarToken,
  autorizarRoles(
    "SUPER_ADMIN",
    "COORD_ACADEMICO",
    "COORD_ADMINISTRATIVO",
    "ESTUDIANTE",
  ),
  obtenerHistorialAcademicoEstudianteController,
);

export default router;
