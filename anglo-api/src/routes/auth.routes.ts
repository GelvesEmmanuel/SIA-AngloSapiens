import {Router} from 'express'
import { cambiarContrasenaController, cerrarSesionUsuarioController, crearUSuarioAdminController, loginController } from '../controllers/auth.controller.js'
import { autorizarRoles, verificarToken } from '../middlewares/auth.midleware.js'

const router = Router();
const autorizado = autorizarRoles('SUPER_ADMIN')// indica que rol tiene permiso
router.post('/login', loginController); // para inciiar sesion

router.patch('/cambiar-contrasena', verificarToken, cambiarContrasenaController);
// autorizarROles()protege quien es el que tiene acceso a este ruta
router.post('/usuarios', verificarToken, autorizado, crearUSuarioAdminController)// para crear usuarios por el Super administrador 

router.post('/logout', verificarToken,  cerrarSesionUsuarioController);
export default router;

