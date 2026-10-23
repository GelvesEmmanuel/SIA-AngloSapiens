import {db} from "../config/db/conexion.js";
import {archivos} from "../config/db/schema.js";


// Mapeo de las llaves del formulario/Multer a los enums de la base de datos
const categoriaMap: Record<string, "FOTO"|"CEDULA"|"DISCAPACIDAD"|"CV"> = {

    profilePicture: "FOTO",
    identityDocument: "CEDULA",
    disabilityCertificate: "DISCAPACIDAD",
    cv: "CV"
};

export const guardarArchivosEnBD = async (entidadID: string, tipoEntidad: "DOCENTE" | "ESTUDIANTE", documentPaths: Record<string, string>) => {


    const registrosAInsertar = [];
    for (const [fieldname, storagePath] of Object.entries(documentPaths)) {

        const categoriaEnum = categoriaMap[fieldname];

        if(categoriaEnum){
            registrosAInsertar.push({
                entidadId: entidadID,
                tipoEntidad: tipoEntidad,
                categoria: categoriaEnum,
                urlArchivo: storagePath,
                estado: "VIGENTE" as const
        });
    }

}

if (registrosAInsertar.length > 0) {
    await db.insert(archivos).values(registrosAInsertar);}
}


