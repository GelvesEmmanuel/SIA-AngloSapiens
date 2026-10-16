// src/app.ts
import express from 'express';
import morgan from 'morgan';
import docentesRoutes from './routes/docentes.routes.js'; // Asegúrate de importar tus rutas correctamente
const app = express();
app.use(morgan('dev'));

// Aquí puedes poner tus middlewares y rutas más adelante, ej:
// app.use(express.json());
app.use(express.json());

app.use('/api', docentesRoutes); // Asegúrate de importar docentesRoutes desde el archivo correspondiente
export default app; // Exportas la instancia de express