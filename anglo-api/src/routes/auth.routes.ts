import {Router} from 'express'
import { cambiarContrasenaController, crearUSuarioAdminController, loginController } from '../controllers/auth.controller.js'
import { autorizarRoles, verificarToken } from '../middlewares/auth.midleware.js'

const router = Router();
router.post('/login', loginController); // para inciiar sesion

router.patch('/cambiar-contrasena', verificarToken, cambiarContrasenaController);

router.post('/usuarios', verificarToken, autorizarRoles('SUPER_ADMIN'), crearUSuarioAdminController)
export default router;

