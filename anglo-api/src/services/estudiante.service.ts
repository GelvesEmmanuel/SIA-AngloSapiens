import { db } from "../config/db.js";

import { Estudiante,InsertEstudiante,FiltrosEstudiante, EstadoEstudiante,EstudianteConExpediente , ParamsCambioEstado} from "../types/estudiantes.types.js";
import type {
  Contactos,
  DatosActualizacionContacto,
  InsertContacto,
} from "../types/contactoEstudiante.types.js";

import {eq, ilike, and, isNull, sql, desc} from 'drizzle-orm'
import { crearUsuarioBaseParaModulo } from "../utils/usuario.utils.js"; // usado para enerar el usaurio 
import { registrarAuditoria } from "./auditoriaSis.service.js";
import { guardarOActualizarArchivosEnBD } from "./archivos.service.js";

import { obtenerUrlFirmada } from "./storage.service.js";
import { estudiantes, contactoEstudiante,archivos, matriculas } from "../config/db/schema.js";
import { AppError } from "../utils/appError.utils.js";




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

export const registrarEstudianteConFirma = async (datos: {
  numeroDocumento: string;
  terminosyCondiciones: boolean;
  consentimientoUsoImagen: boolean;
  firmaStoragePath: string;
  usuarioAdminId: string;
}) => {
  const estudianteRegistrado = await db.transaction(async (tx) => {
    const [estudiante] = await tx
      .select()
      .from(estudiantes)
      .where(eq(estudiantes.numeroDocumento, datos.numeroDocumento))
      .limit(1);

    if (!estudiante) {
      throw new AppError("No se encontró un estudiante con ese número de documento.", 404, "ESTUDIANTE_NO_ENCONTRADO");
    }

    if (estudiante.estado !== "PRE_REGISTRADO" || estudiante.usuarioId) {
      throw new AppError("El estudiante ya fue registrado o no está pre-registrado.", 409, "ESTUDIANTE_YA_REGISTRADO");
    }

    const diaCumpleanos = Number(estudiante.fechaNacimiento.split("-")[2]);
    const nuevoUsuario = await crearUsuarioBaseParaModulo(tx, {
      nombre: estudiante.nombre,
      apellidos: estudiante.apellidos,
      numeroDocumento: estudiante.numeroDocumento,
      diaCumpleanos,
      rol: "ESTUDIANTE",
    });

    const [estudianteActualizado] = await tx
      .update(estudiantes)
      .set({
        usuarioId: nuevoUsuario.usuarioId,
        terminosyCondiciones: datos.terminosyCondiciones,
        consentimientoUsoImagen: datos.consentimientoUsoImagen,
        estado: "REGISTRADO",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(estudiantes.id, estudiante.id),
          eq(estudiantes.estado, "PRE_REGISTRADO"),
          isNull(estudiantes.usuarioId),
        ),
      )
      .returning();

    if (!estudianteActualizado) {
      throw new AppError("El estudiante ya fue registrado por otra solicitud.", 409, "ESTUDIANTE_YA_REGISTRADO");
    }

    await guardarOActualizarArchivosEnBD(
      estudiante.id,
      "ESTUDIANTE",
      { firmaDigital: datos.firmaStoragePath },
      tx,
    );

    return {
      ...estudianteActualizado,
      usernameGenerado: nuevoUsuario.username,
    };
  });

  await registrarAuditoria({
    usuarioId: datos.usuarioAdminId,
    tablaAfectada: "estudiantes",
    registroId: estudianteRegistrado.id,
    accion: "UPDATE",
    datosAntiguos: { estado: "PRE_REGISTRADO" },
    datosNuevos: {
      estado: estudianteRegistrado.estado,
      usuarioId: estudianteRegistrado.usuarioId,
      terminosyCondiciones: estudianteRegistrado.terminosyCondiciones,
      consentimientoUsoImagen: estudianteRegistrado.consentimientoUsoImagen,
    },
    motivo: "Registro del estudiante con aceptación de términos, consentimiento y firma digital",
  });

  return estudianteRegistrado;
};




export const obtenerEstudiantes = async (
  filtros?: FiltrosEstudiante,
): Promise<Estudiante[]> => {
  const conditions = [];
  if (filtros?.estado) {
    conditions.push(eq(estudiantes.estado, filtros.estado as any));
  }
  if (filtros?.busqueda) {
    const termino = `%${filtros.busqueda}%`;
    conditions.push(
      ilike(
        sql`CONCAT(
      COALESCE(${estudiantes.nombre}, ''), ' ',
      COALESCE(${estudiantes.apellidos}, ''), ' ',
      COALESCE(${estudiantes.numeroDocumento}, '')
    )`,
        termino,
      ),
    );
  }

  const estudiantesResultado = await db
    .select()
    .from(estudiantes)
    .where(and(...conditions));

  // 1. Si quieres alertar que no hay registros en la base de datos (Ej: Tabla vacía)
  if (conditions.length === 0 && estudiantesResultado.length === 0) {
    throw new Error("SISTEMA_SIN_ESTUDIANTES"); // No hay ningún docente registrado en todo el sistema
  }

  // 2. Si se aplicaron filtros pero nadie coincidió
  if (conditions.length > 0 && estudiantesResultado .length === 0) {
    // RECOMENDACIÓN: En vez de un throw, puedes retornar el array vacío []
    // o un mensaje controlado para que el frontend pinte "0 coincidencias".
    console.log("La búsqueda no arrojó resultados para los filtros aplicados.");
  }

  return estudiantesResultado ;
};


// Función para obtener un estudiante por su ID obtener datos y documentos

export const obtenerEstudianteConArchivosPorId = async (
  estudianteId: string,
): Promise<EstudianteConExpediente> => {
  //1 buscamos el estudiante
  const [estudiante] = await db
    .select()
    .from(estudiantes)
    .where(eq(estudiantes.id, estudianteId));

  if (!estudiante) {
    throw new Error("ESTUDIANTE_NO_ENCONTRADO");
  }

  //2. buscamos los archivos vigentes asociados a este docente
  const documentosVigentes = await db
  .select()
  .from(archivos)
  .where(and(
    eq(archivos.entidadId, estudianteId),
    eq(archivos.tipoEntidad, "ESTUDIANTE"),
    eq(archivos.estado, "VIGENTE")
  ));

  //3, buscamos los contatcos de los estudiante
  const contactosEstudianteList = await db
    .select()
    .from(contactoEstudiante)
    .where(eq(contactoEstudiante.estudianteId, estudianteId));
  //4, se mapea y se genera la url firmada para cada Docuemtno vigente del docente de forma concurrente
  const documentosConUrlFirmada = await Promise.all(

    documentosVigentes.map(async (doc) =>{

      let urlFirmada = null;
      try {
        // genear url firmada validad por una hora = 3600 segundos
        urlFirmada = await obtenerUrlFirmada(doc.urlArchivo, 3600);
      } catch (error) {
        console.error(`Error generando URL firmada para el archivo ${doc.id}:`, error)
        
      }
      return {
        id: doc.id,
        categoria:doc.categoria as "FOTO" | "CEDULA" | "FIRMA" | "DISCAPACIDAD", // 'FOTO', 'CEDULA', 'DISCAPACIDAD', 'CV'
        pathOriginal: doc.urlArchivo, // Guardamos el path por si acaso
        url: urlFirmada, // 👈 ¡La URL firmada lista para usar en el frontend!
        estado: doc.estado,
      };
    })
  );
  return{
    ...estudiante,
    documentos: documentosConUrlFirmada,
    contactos:contactosEstudianteList,
  };
};



// cambiar estado del estudiante
export const cambiarEstadoEstudiante = async ({
  estudianteId,
  nuevoEstado,
  motivoInactivacion,
  usuarioAdminId,
}: ParamsCambioEstado) => {
  //1. veririficar si el estudiante existe
  const [estudiante] = await db
    .select({ id: estudiantes.id, estadoActual: estudiantes.estado })
    .from(estudiantes)
    .where(eq(estudiantes.id, estudianteId))
    .limit(1);

  if (!estudiante) {
    throw new Error("ESTUDIANTE_NO_ENCONTRADO");
  }
  //2. validacion de negocio : si pasa a inactivo, exigir motivo de inactivacion.
  if (
    nuevoEstado === EstadoEstudiante.INACTIVO &&
    (!motivoInactivacion || motivoInactivacion.trim() === "")
  ) {
    throw new Error("MOTIVO_INACTIVACION_REQUERIDO");
  }
  // 3. Validación de negocio: Si se intenta INACTIVAR, verificar que NO tenga matrículas activas
  if (nuevoEstado === EstadoEstudiante.INACTIVO) {
    const [matriculaActiva] = await db
      .select({ id: matriculas.id })
      .from(matriculas)
      .where(
        and(
          eq(matriculas.estudianteId, estudianteId),
          eq(matriculas.estadoMatricula, "ACTIVA") // O EstadoMatricula.ACTIVA dependiendo de tu enum
        )
      )
      .limit(1);

    if (matriculaActiva) {
      throw new AppError("No puedes inactivar al estudiante porque tiene matriculas activas",400,"ESTUDIANTE_TIENE_MATRICULAS_ACTIVAS");
    }
  }

  //3. Preparar los datos a aactualizar
  const datosActualizar: any = { estado: nuevoEstado };

  // si pasa a Activo, limpiamos cualquier motivo de inactivacion previo
  if (nuevoEstado === EstadoEstudiante.REGISTRADO) {
    datosActualizar.motivoInactivacion = null;
  } else if (nuevoEstado === EstadoEstudiante.INACTIVO) {
    datosActualizar.motivoInactivacion = motivoInactivacion;
  }else if(nuevoEstado === EstadoEstudiante.MATRICULADO){
/// queda pendiente logica de validar la inactivacion si ekl estudiante esta matriculado
  }
  

  //4. ejecutar actualiazcion en base de datos
  const [estudianteActualizado] = await db
    .update(estudiantes)
    .set(datosActualizar)
    .where(eq(estudiantes.id, estudianteId))
    .returning();

  // 3. Auditoría atómica de la modificación
    await registrarAuditoria({
      usuarioId: usuarioAdminId,
      tablaAfectada: "estudiantes",
      registroId: estudianteActualizado.id,
      accion: "UPDATE",
      datosAntiguos: {
        estado: estudianteActualizado.estado,
      },
      datosNuevos: {
        estado: estudianteActualizado.estado,
      },
      motivo: "Cambio de estado  del estudiante del SIA",
    });

};



export const actualizarDatosEstudiante = async (
  estudianteId: string,
  data: Partial<Omit<InsertEstudiante, 'numeroDocumento' | 'tipoDocumento' | 'codigo' | 'usuarioId'>>,
  usuarioAdminId: string,
) => {
  console.log("entrando servicio - actualizando datos personales del estudiante (campos mutables)");

  const resultado = await db.transaction(async (tx) => {
    // 1. Verificar existencia del docente
    const [estudianteActual] = await tx
      .select()
      .from(estudiantes)
      .where(eq(estudiantes.id, estudianteId))
      .limit(1);

    if (!estudianteActual) {
      throw new Error("ESTUDIANTE_NO_ENCONTRADO");
    }

    // 2. Actualizar únicamente campos mutables
    const [estudianteActualizado] = await tx
      .update(estudiantes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(estudiantes.id, estudianteId))
      .returning();

    // 3. Auditoría atómica de la modificación
    await registrarAuditoria({
      usuarioId: usuarioAdminId,
      tablaAfectada: "estudiantes",
      registroId: estudianteActualizado.id,
      accion: "UPDATE",
      datosAntiguos: {
        nombre: estudianteActualizado.nombre,
        apellidos: estudianteActualizado.apellidos,
        telefono: estudianteActualizado.telefono,
        gradoAcademico: estudianteActual.gradoAcademico,
        fechaNacimiento: estudianteActual.fechaNacimiento,
        institucionEducativa:estudianteActual.institucionEducativa,
        consentimientoUsoImagen:estudianteActualizado.institucionEducativa,
        reportaDiscapacidad: estudianteActualizado.reportaDiscapacidad,


      },
      datosNuevos: {
        ombre: estudianteActualizado.nombre,
        apellidos: estudianteActualizado.apellidos,
        telefono: estudianteActualizado.telefono,
        gradoAcademico: estudianteActual.gradoAcademico,
        fechaNacimiento: estudianteActual.fechaNacimiento,
        institucionEducativa:estudianteActual.institucionEducativa,
        consentimientoUsoImagen:estudianteActualizado.institucionEducativa,
        reportaDiscapacidad: estudianteActualizado.reportaDiscapacidad,
      },
      motivo: "Actualización de datos informativos del docente en el SIA",
    });

    return estudianteActualizado;
  });

  return resultado;
};



// Servicio principal de actualización de documentos del Estudiante
export const actualizarDocumentosEstudianteService = async (
  estudianteId: string,
  documentPaths: Record<string, string>,
  usuarioAdminId: string,
) => {
  console.log("entrando servicio - actualizando documentos y gestionando historial de docente");

  const resultado = await db.transaction(async (tx) => {
    // 1. Verificar existencia del docente
    const [estudianteActual] = await tx
      .select()
      .from(estudiantes)
      .where(eq(estudiantes.id, estudianteId))
      .limit(1);

    if (!estudianteActual) {
      throw new Error("ESTUDIANTE_NO_ENCONTRADO");
    }

    // 2. Ejecutar la inactivación de viejos y guardado de nuevos documentos dentro de la transacción
    await guardarOActualizarArchivosEnBD(estudianteId, "ESTUDIANTE", documentPaths, tx);

    // 3. Registrar auditoría del sistema
    await registrarAuditoria({
      usuarioId: usuarioAdminId,
      tablaAfectada: "archivos",
      registroId: estudianteId,
      accion: "UPDATE",
      datosNuevos: { categoriasActualizadas: Object.keys(documentPaths) },
      motivo: "Actualización de soportes documentales del estudiante (versión anterior marcada como historicas)",
    });

    return { success: true, documentosActualizados: Object.keys(documentPaths) };
  });

  return resultado;
};

export const actualizarDatosContacto = async (
  estudianteId: string,
  contactos: DatosActualizacionContacto[],
  usuarioAdminId: string,
): Promise<Contactos[]> => {
  if (contactos.length === 0) {
    throw new AppError(
      "Debe enviar al menos un contacto para actualizar.",
      400,
      "CONTACTOS_FALTANTES",
    );
  }

  const idsContacto = contactos.flatMap((contacto) =>
    contacto.id ? [contacto.id] : [],
  );
  if (new Set(idsContacto).size !== idsContacto.length) {
    throw new AppError(
      "No se puede actualizar el mismo contacto más de una vez.",
      400,
      "CONTACTO_DUPLICADO",
    );
  }

  return db.transaction(async (tx) => {
    const [estudiante] = await tx
      .select({ id: estudiantes.id })
      .from(estudiantes)
      .where(eq(estudiantes.id, estudianteId))
      .limit(1);

    if (!estudiante) {
      throw new AppError(
        "No se encontró el estudiante especificado.",
        404,
        "ESTUDIANTE_NO_ENCONTRADO",
      );
    }

    const contactosActuales = await tx
      .select()
      .from(contactoEstudiante)
      .where(eq(contactoEstudiante.estudianteId, estudianteId));
    const contactosActualizados: Contactos[] = [];

    for (const { id, ...datosContacto } of contactos) {
      if (id) {
        const [contactoActualizado] = await tx
          .update(contactoEstudiante)
          .set({ ...datosContacto, updatedAt: new Date() })
          .where(
            and(
              eq(contactoEstudiante.id, id),
              eq(contactoEstudiante.estudianteId, estudianteId),
            ),
          )
          .returning();

        if (!contactoActualizado) {
          throw new AppError(
            "No se encontró el contacto para este estudiante.",
            404,
            "CONTACTO_NO_ENCONTRADO",
          );
        }

        contactosActualizados.push(contactoActualizado);
      } else {
        const [contactoCreado] = await tx
          .insert(contactoEstudiante)
          .values({ ...datosContacto, estudianteId })
          .returning();

        contactosActualizados.push(contactoCreado);
      }
    }

    await registrarAuditoria({
      usuarioId: usuarioAdminId,
      tablaAfectada: "contacto_estudiante",
      registroId: estudianteId,
      accion: "UPDATE",
      datosAntiguos: contactosActuales.filter((contacto) =>
        idsContacto.includes(contacto.id),
      ),
      datosNuevos: contactosActualizados,
      motivo: "Actualización de datos de contacto del estudiante",
    });

    return contactosActualizados;
  });
};