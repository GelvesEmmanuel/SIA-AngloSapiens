import { db } from "../config/db/conexion.js";
import {  docentes } from "../config/db/schema.js";
import type { InsertDocente, Docente } from "../types/docentes.types.js";
import { eq } from "drizzle-orm"; // usado para el filtro WHERE
import { desc } from "drizzle-orm";
import { crearUsuarioBaseParaModulo } from "../utils/usuario.utils.js";
import { registrarAuditoria } from "./auditoriaSis.service.js";


export const obtnerDocentes = async (): Promise<Docente[]> => {
  const docentesResultado = await db.select().from(docentes);
  return docentesResultado;
};
export const registrarDocente = async (data: InsertDocente) => {
  console.log("entrando servicio - iniciando transacción atómica de docente y usuario");

  // Usamos una transacción para que si algo falla, no quede huérfano ni el usuario ni el docente
  const resultado = await db.transaction(async (tx) => {
    
    // 1. Extraer el día de cumpleaños de la fecha de nacimiento (viene en string ej: "1995-10-14")
    const fecha = new Date(data.fechaNacimiento);
    const diaCumpleanos = fecha.getDate(); // Extrae el número del día (ej: 14)

    // 2. Crear el usuario centralizado de seguridad llamando al helper reutilizable
    const nuevoUsuario = await crearUsuarioBaseParaModulo(tx, {
      nombre: data.nombre,
      apellidos: data.apellidos,
      numeroDocumento: data.numeroDocumento, // Se usa para la contraseña temporal (bcrypt)
      diaCumpleanos: diaCumpleanos,           // Se usa para el algoritmo del username
      rol: 'DOCENTE',                         // Automáticamente establece requiereCambioContrasena = true
    });

    // 3. Insertar el docente en la base de datos asignándole el usuarioId generado
    const [nuevoDocente] = await tx
      .insert(docentes)
      .values({
        ...data,
        usuarioId: nuevoUsuario.usuarioId, // Vinculamos la clave foránea de seguridad
      })
      .returning();
      // registrar auditoria del sistea de forma atomica
      await registrarAuditoria({
      usuarioId: nuevoUsuario.usuarioId, // O el ID del admin que está realizando la acción si lo tienes disponible en el req
      tablaAfectada: 'docentes',
      registroId: nuevoDocente.id, // Asegúrate de que sea el ID de la tabla docentes
      accion: 'CREATE',
      datosNuevos: {
        codigo: nuevoDocente.codigo,
        nombre: nuevoDocente.nombre,
        apellidos: nuevoDocente.apellidos,
        username: nuevoUsuario.username,
      },
      motivo: 'Creación inicial de docente con usuario de acceso al SIA',
    });
    return {
      ...nuevoDocente,
      usernameGenerado: nuevoUsuario.username, // Opcional: para que el controlador o la respuesta sepan el usuario
    };
  });

  return resultado;
};





export const generarCodigoDOcente = async (): Promise<string> => {
  // buscar en la base de datos el ultimo docente registrado
  const ultimoDocente = await db
    .select({ codigo: docentes.codigo })
    .from(docentes)
    .orderBy(desc(docentes.createdAt))
    .limit(1);

  let siguienteNumero = 1;

  if (ultimoDocente.length > 0  && ultimoDocente[0].codigo) {
    //formato DOC-000
    const partes = ultimoDocente[0].codigo.split("-");
    const numeroActual = parseInt(partes[1], 10);
    if (!isNaN(numeroActual)) {
      siguienteNumero = numeroActual + 1;
    }
  }

  const numeroFormateado = String(siguienteNumero).padStart(3, "0");

  return `DOC-${numeroFormateado}`;
};
/* export const obtenerDocentePorId = async (id:number): Promise<Docente | null> => {
    const[docente] = await db.select().from(docentes).where(eq(docentes.id, id));

   return docente || null;
} */

/*
export const actualizarDocente = async (id: number, data: Partial<InsertDocente>): Promise<Docente | null> => {

const [docenteActualizado] = await db.update(docentes).set(data).where(eq(docentes.id, id)).returning();

return docenteActualizado || null;
}
*/
