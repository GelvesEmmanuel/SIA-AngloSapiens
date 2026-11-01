// indica las rutas qque pertenence a las funcionalidades especificas del superadministrador, 
// en este caso la creacion de usuarios administrativos, acmbiar estado, leer usuarios, restaurar contraseñas, cambiar roles, etc y ver auditorias de los usuarios del sistema.

import { Router } from "express";
import{crearUSuarioAdminController, obtenerUsuarioPorIdController, listarUsuariosController, cambiarEstadoUsuarioController, restablecerContrasenaUsuarioController} from '../controllers/admin.controller.js'
import { autorizarRoles, verificarToken } from "../middlewares/auth.midleware.js";

const router = Router();
const autorizado = autorizarRoles('SUPER_ADMIN')// indica que rol tiene permiso
router.post('/usuarios', verificarToken, autorizado, crearUSuarioAdminController)// para crear usuarios por el Super administrador 
router.get('/usuarios', verificarToken, autorizado, listarUsuariosController)// para listar los usuarios por rol y estado
router.get('/usuarios/:id', verificarToken, autorizado, obtenerUsuarioPorIdController)// para obtener un usuario por id
router.patch('/usuarios/:id/estado', verificarToken, autorizado, cambiarEstadoUsuarioController)// para cambiar el estado de un usuario
router.patch('/usuarios/:id/restablecer-contrasena', verificarToken, autorizado, restablecerContrasenaUsuarioController)
export default router;