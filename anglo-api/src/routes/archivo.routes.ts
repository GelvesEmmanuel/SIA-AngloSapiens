//para mostrar los archivos en el forntend
import { Router } from "express";
import {verArchivoController} from "../controllers/archivos.controller.js";
const router = Router();
// GET /api/archivos/ver?path=FotosPerfil/1792790946626-720614348.jpg
router.get('/archivos/ver', verArchivoController);
export default router;