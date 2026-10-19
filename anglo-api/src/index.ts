import app from './app.js';
import{db} from './config/db.js';
import { sql } from 'drizzle-orm';

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await db.execute(sql`SELECT 1`);
    console.log("🚀 Base de datos conectada correctamente");
  } catch (err) {
    console.error("💥 Error al conectar a la base de datos:", err);
  }
})();



app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  // Llamamos a la función para probar la conexión a la base de datos al iniciar el servidor
});