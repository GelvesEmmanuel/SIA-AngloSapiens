import { Router } from "express";
import {
  actualizarNotaController,
  cambiarPublicacionNotasController,
  consultarMisNotasController,
  consultarNotasEstudianteController,
  consultarNotasMatriculaController,
  registrarExamenFinalController,
  registrarNotasController,
} from "../controllers/notas.controller.js";
import { autorizarRoles, verificarToken } from "../middlewares/auth.midleware.js";

const router = Router();

router.use(verificarToken);

router.put(
  "/matricula/:matriculaId",
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", "DOCENTE"),
  registrarNotasController,
);
router.patch(
  "/matricula/:matriculaId/examen-final",
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", "DOCENTE"),
  registrarExamenFinalController,
);
router.patch(
  "/matricula/:matriculaId/publicacion",
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", "DOCENTE"),
  cambiarPublicacionNotasController,
);
router.patch(
  "/:notaId",
  autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO", "DOCENTE"),
  actualizarNotaController,
);
router.get(
  "/matricula/:matriculaId",
  autorizarRoles(
    "SUPER_ADMIN",
    "COORD_ACADEMICO",
    "COORD_ADMINISTRATIVO",
    "DOCENTE",
    "ESTUDIANTE",
  ),
  consultarNotasMatriculaController,
);
router.get(
  "/estudiante/:estudianteId",
  autorizarRoles(
    "SUPER_ADMIN",
    "COORD_ACADEMICO",
    "COORD_ADMINISTRATIVO",
    "DOCENTE",
    "ESTUDIANTE",
  ),
  consultarNotasEstudianteController,
);
router.get(
  "/mis-notas",
  autorizarRoles("ESTUDIANTE"),
  consultarMisNotasController,
);

export default router;
