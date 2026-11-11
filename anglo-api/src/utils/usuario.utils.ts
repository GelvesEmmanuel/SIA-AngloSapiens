import {db} from '../config/db.js'
import { usuarioRoles, usuarios } from '../config/db/schema.js'
import {generarUsername, encriptarPassword} from '../utils/security.utils.js'

// aqui centralizo la creacion del obgeto usuario para que cualruiqe modulo docente o estudiante lo reutilize , solo pasandole datos basicos

interface DatosCreacionUsuariosBase {
nombre: string;         // Ej: "Carlos Andres"
  apellidos: string;      // Ej: "Gomez Perez"
  numeroDocumento: string; 
  diaCumpleanos: number;  
  rol: 'DOCENTE' | 'ESTUDIANTE';
}
// funcion auxuciliar reutilizable para crear usuario de forma transacional con reglas de RQF_SEG_03
export const crearUsuarioBaseParaModulo = async (
    tx: any,
    datos:DatosCreacionUsuariosBase
)=>{
   // 1. Dividir el nombre y los apellidos por espacios de forma segura
  const partesNombre = datos.nombre.trim().split(/\s+/);
  const partesApellido = datos.apellidos.trim().split(/\s+/);

  const primerNombre = partesNombre[0] || '';
  const segundoNombre = partesNombre[1] || undefined; // Opcional si no existe
  const primerApellido = partesApellido[0] || '';
  const segundoApellido = partesApellido[1] || undefined; // Opcional si no existe

  // 2. Llamar EXACTAMENTE a la función original que ya tienes en utils/security.util
  const username = generarUsername(
    primerNombre,
    primerApellido,
    datos.diaCumpleanos,
    segundoNombre,
    segundoApellido
  );

  // 3. Encriptar contraseña temporal (cédula)
  const contrasenaHash = await encriptarPassword(datos.numeroDocumento);

  // 4. Regla de negocio para el cambio obligatorio
  const requiereCambioContrasena = datos.rol === 'DOCENTE';

  // 5. Crear la cuenta sin rol en usuarios y guardar su rol inicial en la tabla intermedia.
  const [nuevoUsuario] = await tx
    .insert(usuarios)
    .values({
      username,
      contrasenaHash,
      estado: 'ACTIVO',
      requiereCambioContrasena,
      versionToken: 1,
    })
    .returning();

  // 6. Ambas escrituras usan la transacción del módulo para evitar cuentas sin rol.
  await tx.insert(usuarioRoles).values({
    usuarioId: nuevoUsuario.usuarioId,
    rol: datos.rol,
  });

  return nuevoUsuario;
};