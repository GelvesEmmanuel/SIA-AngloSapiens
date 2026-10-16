import app from './app.js';
import { pool } from './config/db.js';

const PORT = process.env.PORT || 3000;


const testDatabaseConnection = async () => {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT NOW()'); // Consulta simple para probar la hora de la BD
        console.log('✅ Conexión exitosa a PostgreSQL (Base de datos: anglosapiens)');
        console.log('🕒 Hora del servidor DB:', res.rows[0].now);
        client.release(); // Liberamos la conexión de vuelta al pool
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error);
    }
};


app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await testDatabaseConnection(); // Llamamos a la función para probar la conexión a la base de datos al iniciar el servidor
});