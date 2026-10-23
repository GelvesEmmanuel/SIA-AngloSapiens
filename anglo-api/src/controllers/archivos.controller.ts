
// controlador para las funciones de los archivos como poder verlos y actuaizarlos
import { Request, Response } from "express";
import { obtenerUrlFirmada } from "../services/storage.service.js";
// funcion para obtener url firmada y poder renderizar el archivo en el frontend
export const verArchivoController = async (req: Request, res: Response) => {
  try {
    const { path } = req.query;

    if (!path || typeof path !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'El parámetro "path" es requerido y debe ser una cadena de texto.'
      });
    }

    // Generamos la URL firmada con validez de 1 hora (3600 segundos)
    const signedUrl = await obtenerUrlFirmada(path, 3600);

    return res.status(200).json({
      success: true,
      url: signedUrl
    });
  } catch (error: any) {
    console.error('Error al obtener URL firmada:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener la URL del archivo'
    });
  }
}