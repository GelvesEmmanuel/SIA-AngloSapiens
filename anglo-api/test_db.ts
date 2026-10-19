import { db } from "./src/config/db"; // Ajusta la ruta a donde tengas tu exportación de Drizzle
import { sql } from "drizzle-orm";

async function testConnection() {
  try {
    const result = await db.execute(sql`SELECT NOW()`);
    console.log("✅ Conexión exitosa con Supabase!");
    console.log("Hora del servidor:", result[0]);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error de conexión:", error);
    process.exit(1);
  }
}

testConnection();