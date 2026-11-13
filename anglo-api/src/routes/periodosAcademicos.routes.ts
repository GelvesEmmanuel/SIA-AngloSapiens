import { Router } from "express";
import {
  actualizarPeriodoAcademicoController,
  cambiarEstadoPeriodoAcademicoController,
  crearPeriodoAcademicoController,
  listarPeriodosAcademicosController,
  obtenerPeriodoAcademicoPorIdController,
} from "../controllers/periodosAcademicos.controller.js";
import { autorizarRoles, verificarToken } from "../middlewares/auth.midleware.js";

const router = Router();
router.use(verificarToken, autorizarRoles("SUPER_ADMIN", "COORD_ACADEMICO"));
router.get("/listar", listarPeriodosAcademicosController);
router.get("/listar/:id", obtenerPeriodoAcademicoPorIdController);
router.post("/registrar", crearPeriodoAcademicoController);
router.patch("/actualizar/:id", actualizarPeriodoAcademicoController);
router.patch("/estado/:id", cambiarEstadoPeriodoAcademicoController);

export default router;
