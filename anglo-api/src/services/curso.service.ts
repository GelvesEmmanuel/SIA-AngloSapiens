import { and, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
import { db } from "../config/db.js";
import { cursos, habilidadesCurso } from "../config/db/schema.js";
import type {
  ActualizarCurso,
  CursoConHabilidades,
  EstadoCurso,
  FiltrosCurso,
  HabilidadCurso,
  InsertCurso,
} from "../types/cursos.types.js";
import { registrarAuditoria } from "./auditoriaSis.service.js";

export const generarCodigoCurso = async(): Promise<string> => {
    // buscamos en la base de datos el ultimo curso registrado
    const ultimoCurso= await db
    .select({codigo: cursos.codigo})
    .from(cursos)
    .orderBy(desc(cursos.createdAt))
    .limit(1)

    let siguienteNumero = 1;
    if(ultimoCurso.length > 0 && ultimoCurso[0].codigo){
          //formato EST-000
    const partes = ultimoCurso[0].codigo.split("-");
    const numeroActual = parseInt(partes[1], 10);
    if (!isNaN(numeroActual)) {
      siguienteNumero = numeroActual + 1;
    };
    }
    const numeroFormateado = String(siguienteNumero).padStart(3,"0");

    return `CUR-${numeroFormateado}`
};


export const registrarCurso = async(
    data: InsertCurso,
    habilidades: HabilidadCurso[],
    usuarioAdminId: string,
) =>{
  return db.transaction(async (tx) => {
    const [cursoExistente] = await tx
      .select({ id: cursos.id })
      .from(cursos)
      .where(eq(cursos.codigo, data.codigo))
      .limit(1);

    if (cursoExistente) {
      throw new Error("CODIGO_CURSO_DUPLICADO");
    }

    if (habilidades.length === 0) {
      throw new Error("HABILIDADES_CURSO_REQUERIDAS");
    }

    const [nuevoCurso] = await tx
      .insert(cursos)
      .values(data)
      .returning();

    const habilidadesRegistradas = await tx
      .insert(habilidadesCurso)
      .values(
        habilidades.map((habilidad) => ({
          cursoId: nuevoCurso.id,
          habilidad,
        })),
      )
      .returning();

    await registrarAuditoria({
      usuarioId: usuarioAdminId,
      tablaAfectada: "cursos",
      registroId: nuevoCurso.id,
      accion: "CREATE",
      datosNuevos: {
        codigo: nuevoCurso.codigo,
        nombre: nuevoCurso.nombre,
        nivel: nuevoCurso.nivel,
        habilidades: habilidadesRegistradas.map(({ habilidad }) => habilidad),
      },
      motivo: "Creación del curso de una oferta académica SIA",
    });

    return {
      ...nuevoCurso,
      habilidades: habilidadesRegistradas.map(({ habilidad }) => habilidad),
    };
  });
};

export const obtenerCursos = async (
  filtros?: FiltrosCurso,
): Promise<CursoConHabilidades[]> => {
  const condiciones = [isNull(cursos.deletedAt)];

  if (filtros?.estado) {
    condiciones.push(eq(cursos.estado, filtros.estado));
  }

  if (filtros?.busqueda?.trim()) {
    const termino = `%${filtros.busqueda.trim()}%`;
    const condicionBusqueda = or(
      ilike(cursos.nombre, termino),
      ilike(cursos.codigo, termino),
    );
    if (condicionBusqueda) {
      condiciones.push(condicionBusqueda);
    }
  }

  const cursosEncontrados = await db
    .select()
    .from(cursos)
    .where(and(...condiciones))
    .orderBy(desc(cursos.createdAt));

  if (cursosEncontrados.length === 0) {
    return [];
  }

  const habilidadesEncontradas = await db
    .select()
    .from(habilidadesCurso)
    .where(
      inArray(
        habilidadesCurso.cursoId,
        cursosEncontrados.map(({ id }) => id),
      ),
    );
  const habilidadesPorCurso = new Map<string, HabilidadCurso[]>();

  for (const { cursoId, habilidad } of habilidadesEncontradas) {
    const habilidades = habilidadesPorCurso.get(cursoId) ?? [];
    habilidades.push(habilidad);
    habilidadesPorCurso.set(cursoId, habilidades);
  }

  return cursosEncontrados.map((curso) => ({
    ...curso,
    habilidades: habilidadesPorCurso.get(curso.id) ?? [],
  }));
};

export const obtenerCursoPorId = async (
  cursoId: string,
): Promise<CursoConHabilidades> => {
  const [curso] = await db
    .select()
    .from(cursos)
    .where(and(eq(cursos.id, cursoId), isNull(cursos.deletedAt)))
    .limit(1);

  if (!curso) {
    throw new Error("CURSO_NO_ENCONTRADO");
  }

  const habilidades = await db
    .select({ habilidad: habilidadesCurso.habilidad })
    .from(habilidadesCurso)
    .where(eq(habilidadesCurso.cursoId, cursoId));

  return {
    ...curso,
    habilidades: habilidades.map(({ habilidad }) => habilidad),
  };
};

export const cambiarEstadoCurso = async (
  cursoId: string,
  nuevoEstado: EstadoCurso,
  usuarioAdminId: string,
) => {
  return db.transaction(async (tx) => {
    const [cursoActual] = await tx
      .select()
      .from(cursos)
      .where(and(eq(cursos.id, cursoId), isNull(cursos.deletedAt)))
      .limit(1);

    if (!cursoActual) {
      throw new Error("CURSO_NO_ENCONTRADO");
    }

    const [cursoActualizado] = await tx
      .update(cursos)
      .set({ estado: nuevoEstado, updatedAt: new Date() })
      .where(eq(cursos.id, cursoId))
      .returning();

    await registrarAuditoria({
      usuarioId: usuarioAdminId,
      tablaAfectada: "cursos",
      registroId: cursoId,
      accion: "UPDATE",
      datosAntiguos: { estado: cursoActual.estado },
      datosNuevos: { estado: cursoActualizado.estado },
      motivo: `Cambio de estado del curso a ${nuevoEstado}`,
    });

    return cursoActualizado;
  });
};

export const activarCurso = async (
  cursoId: string,
  usuarioAdminId: string,
) => cambiarEstadoCurso(cursoId, "ACTIVO", usuarioAdminId);

export const inactivarCurso = async (
  cursoId: string,
  usuarioAdminId: string,
) => cambiarEstadoCurso(cursoId, "INACTIVO", usuarioAdminId);

export const actualizarCurso = async (
  cursoId: string,
  data: ActualizarCurso,
  usuarioAdminId: string,
): Promise<CursoConHabilidades> => {
  const { habilidades, ...datosCurso } = data;
  if (Object.keys(datosCurso).length === 0 && habilidades === undefined) {
    throw new Error("DATOS_CURSO_REQUERIDOS");
  }
  if (habilidades !== undefined && habilidades.length === 0) {
    throw new Error("HABILIDADES_CURSO_REQUERIDAS");
  }
  if (
    habilidades !== undefined &&
    new Set(habilidades).size !== habilidades.length
  ) {
    throw new Error("HABILIDADES_CURSO_DUPLICADAS");
  }

  return db.transaction(async (tx) => {
    const [cursoActual] = await tx
      .select()
      .from(cursos)
      .where(and(eq(cursos.id, cursoId), isNull(cursos.deletedAt)))
      .limit(1);

    if (!cursoActual) {
      throw new Error("CURSO_NO_ENCONTRADO");
    }

    const habilidadesAnteriores = await tx
      .select({ habilidad: habilidadesCurso.habilidad })
      .from(habilidadesCurso)
      .where(eq(habilidadesCurso.cursoId, cursoId));

    const [cursoActualizado] = await tx
      .update(cursos)
      .set({ ...datosCurso, updatedAt: new Date() })
      .where(eq(cursos.id, cursoId))
      .returning();

    if (habilidades !== undefined) {
      await tx
        .delete(habilidadesCurso)
        .where(eq(habilidadesCurso.cursoId, cursoId));

      await tx.insert(habilidadesCurso).values(
        habilidades.map((habilidad) => ({
          cursoId,
          habilidad,
        })),
      );
    }

    const habilidadesActualizadas = await tx
      .select({ habilidad: habilidadesCurso.habilidad })
      .from(habilidadesCurso)
      .where(eq(habilidadesCurso.cursoId, cursoId));

    await registrarAuditoria({
      usuarioId: usuarioAdminId,
      tablaAfectada: "cursos",
      registroId: cursoId,
      accion: "UPDATE",
      datosAntiguos: {
        nombre: cursoActual.nombre,
        nivel: cursoActual.nivel,
        descripcion: cursoActual.descripcion,
        duracionSemanas: cursoActual.duracionSemanas,
        intensidadSemanal: cursoActual.intensidadSemanal,
        habilidades: habilidadesAnteriores.map(({ habilidad }) => habilidad),
      },
      datosNuevos: {
        nombre: cursoActualizado.nombre,
        nivel: cursoActualizado.nivel,
        descripcion: cursoActualizado.descripcion,
        duracionSemanas: cursoActualizado.duracionSemanas,
        intensidadSemanal: cursoActualizado.intensidadSemanal,
        habilidades: habilidadesActualizadas.map(({ habilidad }) => habilidad),
      },
      motivo: "Actualización de curso",
    });

    return {
      ...cursoActualizado,
      habilidades: habilidadesActualizadas.map(({ habilidad }) => habilidad),
    };
  });
};