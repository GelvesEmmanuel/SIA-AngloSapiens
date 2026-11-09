import { db } from "../config/db.js";

import type { Estudiante,InsertEstudiante,FiltrosEstudiante, EstadoEstudiante,EstudianteConExpediente } from "../types/estudiantes.types.js";
import type { Contactos,InsertContacto } from "../types/contactoEstudiante.types.js";

import {eq, ilike, and , sql, desc} from 'drizzle-orm'
import { crearUsuarioBaseParaModulo } from "../utils/usuario.utils.js"; // usado para enerar el usaurio 
import { registrarAuditoria } from "./auditoriaSis.service.js";
import { guardarOActualizarArchivosEnBD } from "./archivos.service.js";

import { obtenerUrlFirmada } from "./storage.service.js";
import { estudiantes ,contactoEstudiante} from "../config/db/schema.js";




// el estudiante manejara dos estados de registro el primeor es PRE_REGISTRADO aqui se registran los datos del estudiante archivos y contacto

//EL segundo estado REGISTRADO se da cuando el estudiante acepta terminos y condiciones y realiza la firma digital, aqui es donde se registra el docente
export const preRegistrarEstudiante= async (
    dataEstudiante:InsertEstudiante,
    contactos: InsertContacto[],
    usuarioAdminId: string,
) =>{

console.log("ENtrando al servicio y creando transaccion atomica del crera estudiante y usaurio")
// usamos transaccion atomica por si alguna de las dos falla  no se complete la accion , se completa solo si las dos funcionan
//1. calcular edad del estudiante para validacion de contactos
const edad = calcularEdad(dataEstudiante.fechaNacimiento);
const esMenorDeEdad = edad < 18;
console.log("Estos son lso contactos de los estudiantes",contactos)

// 2. Validar la regla de negocio de contactos según la edad
  if (esMenorDeEdad && (!contactos || contactos.length < 2)) {
    throw new Error("MENOR_DE_EDAD_REQUIERE_DOS_CONTACTOS");
  } else if (!esMenorDeEdad && (!contactos || contactos.length < 1)) {
    throw new Error("MAYOR_DE_EDAD_REQUIERE_UN_CONTACTO");
  }

   
const resultado = await db.transaction(async(tx) => {
    //validacion: documentod  eidentidad
    const estudianteExiste = await tx
    .select()
    .from(estudiantes)
    .where(eq(estudiantes.numeroDocumento, dataEstudiante.numeroDocumento))
    .limit(1);

    if(estudianteExiste.length > 0){
        throw new Error("DOCUMENTO_DE_IDENTIDAD_DUPLICADO")
    }



    //3. Insertar el estudiante a la base de datos con etado PRE_REGISTRADO

    const[nuevoEstudiante] = await tx
    .insert(estudiantes)
    .values({
        ...dataEstudiante,
        estado: "PRE_REGISTRADO",
        usuarioId: null,
    })
    .returning();

    //4. insertar contacto  de estudiantes
    
    const contactosValues = contactos.map((contacto) => ({
      ...contacto,
      estudianteId: nuevoEstudiante.id,
    }));
    console.log("estos son los contatcos",contactosValues)
    const contactosInsertados = await tx
      .insert(contactoEstudiante )
      .values(contactosValues)
      .returning();
    // registra auditoria en el sistema de forma atomica
    // 6. Registrar auditoría del sistema
    await registrarAuditoria({
      usuarioId: usuarioAdminId,
      tablaAfectada: "estudiantes",
      registroId: nuevoEstudiante.id,
      accion: "CREATE",
      datosNuevos: {
        codigo: nuevoEstudiante.codigo,
        nombre: nuevoEstudiante.nombre,
        apellidos: nuevoEstudiante.apellidos,
        edadCalculada: edad,
        totalContactos: contactosInsertados.length,
      },
      motivo: `Pre-registro de estudiante (${esMenorDeEdad ? 'Menor de edad' : 'Mayor de edad'}) con sus respectivos contactos`,
    });
    return{
        ...nuevoEstudiante,
        edadCaculada: edad,
        contactos: contactosInsertados,
    };
});

return resultado;

}
// para calcular la edad del estudiante 
function calcularEdad(fechaNacimientoStr: string): number {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimientoStr);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}
export const generarCodigoEstudiante = async(): Promise<string> => {
    // buscamos en la base de datos el ultimo estduainte registrado
    const ultimoEstudiante = await db
    .select({codigo: estudiantes.codigo})
    .from(estudiantes)
    .orderBy(desc(estudiantes.createdAt))
    .limit(1)

    let siguienteNumero = 1;
    if(ultimoEstudiante.length > 0 && ultimoEstudiante[0].codigo){
          //formato EST-000
    const partes = ultimoEstudiante[0].codigo.split("-");
    const numeroActual = parseInt(partes[1], 10);
    if (!isNaN(numeroActual)) {
      siguienteNumero = numeroActual + 1;
    }
    }
    const numeroFormateado = String(siguienteNumero).padStart(3,"0");

    return `EST-${numeroFormateado}`
}


/**
 * export const RegistrarEstudiante{
      //extrar el dia de cumpleaños de la fecha de nacimiento que viene en el string
    const fecha = new Date(data.fechaNacimiento);
    const diaCumpleanos = fecha.getDate() // estrae el numeor dle dia

    //2. creo el usaurio centralizado de seguridad llamando a la funcion reutilizable gener usuario

    const nuevoUsuario = await crearUsuarioBaseParaModulo(tx,{
        nombre: data.nombre,
        apellidos: data.apellidos,
        numeroDocumento: data.numeroDocumento,// contraseñ atemporal
        diaCumpleanos: diaCumpleanos,// para generar el username
        rol: "ESTUDIANTE",// se establece el rol del usuario en este caso estudiante
    })
}
 * 
 */


