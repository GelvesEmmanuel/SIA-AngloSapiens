import {db} from '../config/db/conexion.js';
import {docentes} from '../config/db/schema.js';
import type { InsertDocente, Docente } from '../types/docentes.types.js';
import {eq} from 'drizzle-orm'; // usado para el filtro WHERE


export const obtnerDocentes = async (): Promise<Docente[]> => {

    const docentesResultado = await db.select().from(docentes);
    return docentesResultado;
}
export const registrarDocente = async (data: InsertDocente) => {
     console.log("entrando servicio")

    const [nuevoDocente] = await db.insert(docentes).values(data).returning();
    return nuevoDocente;
}

export const obtenerDocentePorId = async (id:number): Promise<Docente | null> => {
    const[docente] = await db.select().from(docentes).where(eq(docentes.id, id));

    return docente || null;
}




export const actualizarDocente = async (id: number, data: Partial<InsertDocente>): Promise<Docente | null> => {

const [docenteActualizado] = await db.update(docentes).set(data).where(eq(docentes.id, id)).returning();

return docenteActualizado || null;
}