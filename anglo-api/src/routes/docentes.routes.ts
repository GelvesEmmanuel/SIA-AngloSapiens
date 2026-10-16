import {Router} from 'express';
import {db} from '../config/db/conexion.js';
import { docentes } from '../config/db/schema.js';  
import {registrarDocenteController, obtenerDocentesController, obtenerDocentePorIdController, actualizarDocenteController} from '../controllers/docentes.controller.js';

const router = Router();

router.get('/docentes',obtenerDocentesController); 
router.get('/docentes/:id', obtenerDocentePorIdController);

router.post('/docentes' ,registrarDocenteController)
router.put('/docentes/:id', actualizarDocenteController)
    
export default router;