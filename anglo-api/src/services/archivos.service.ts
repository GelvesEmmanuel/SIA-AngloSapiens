import { db } from "../config/db/conexion.js";
import { eq, and , ne} from "drizzle-orm";
import { archivos } from "../config/db/schema.js";

// este servicio guarda la url obetnida de storage y la guarda en la tabla archivos
// Mapeo de las llaves del formulario/Multer a los enums de la base de datos
const categoriaMap: Record<string, "FOTO" | "CEDULA" | "DISCAPACIDAD" | "CV" | "FIRMA"> =
  {
    profilePicture: "FOTO",
    identityDocument: "CEDULA",
    disabilityCertificate: "DISCAPACIDAD",
    cv: "CV",
    firmaDigital: "FIRMA",
  };

export const guardarOActualizarArchivosEnBD = async (
  entidadID: string,
  tipoEntidad: "DOCENTE" | "ESTUDIANTE",
  documentPaths: Record<string, string>,
  txClient: any = db,
) => {
  {
    const dbInstance = txClient || db;

    for (const [fieldname, storagePath] of Object.entries(documentPaths)) {
      const categoriaEnum = categoriaMap[fieldname];

      if (categoriaEnum) {
        // 👉 DEPURACIÓN / SOLUCIÓN:
        // En vez de exigir que el estado anterior sea estrictamente "VIGENTE",
        // marcamos como "HISTORICO" todos los que pertenezcan a esta categoría
        // y que todavía NO sean históricos.
        const updateResult = await dbInstance
          .update(archivos)
          .set({ estado: "HISTORICO" })
          .where(
            and(
              eq(archivos.entidadId, entidadID),
              eq(archivos.tipoEntidad, tipoEntidad),
              eq(archivos.categoria, categoriaEnum),
              ne(archivos.estado, "HISTORICO"), // Evita tocar los que ya son históricos
            ),
          );

        console.log(
          `Registros anteriores pasados a HISTORICO para ${categoriaEnum}:`,
          updateResult,
        );

        // 2. Insertar el nuevo documento como VIGENTE (o el estado inicial que uses)
        await dbInstance.insert(archivos).values({
          entidadId: entidadID,
          tipoEntidad: tipoEntidad,
          categoria: categoriaEnum,
          urlArchivo: storagePath,
          estado: "VIGENTE" as const, // O el estado que manejes para el actual
        });
      }
    }
  }
};
