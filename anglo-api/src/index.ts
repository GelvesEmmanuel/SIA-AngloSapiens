import app from './app.js';
import{db} from './config/db.js';
import { sql } from 'drizzle-orm';
import { finalizarPeriodosAcademicosVencidos } from './services/periodosAcademicos.service.js';

const PORT = process.env.PORT || 3000;
const INTERVALO_FINALIZACION_MS = 60 * 60 * 1000;

const finalizarPeriodosVencidos = async () => {
  try {
    const resultado = await finalizarPeriodosAcademicosVencidos();
    if (resultado.periodosFinalizados || resultado.gruposFinalizados) {
      console.log(
        `Finalización automática: ${resultado.periodosFinalizados} periodos y ${resultado.gruposFinalizados} grupos.`,
      );
    }
  } catch (error) {
    console.error("Error al finalizar periodos académicos vencidos:", error);
  }
};

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
  await finalizarPeriodosVencidos();
  setInterval(() => {
    void finalizarPeriodosVencidos();
  }, INTERVALO_FINALIZACION_MS);
});