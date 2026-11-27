import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const RUTA_CONFIG = path.resolve(process.cwd(), 'src/utils/configuracionLogin.json');
const MAX_URL_LENGTH = 500;

type ConfigJson = {
  urlSistemaExterno: string;
};

function validarYNormalizarUrl(rawUrl: unknown): { ok: true; url: string } | { ok: false; error: string } {
  if (rawUrl === undefined || rawUrl === null || rawUrl === '') {
    return { ok: true, url: '' };
  }

  if (typeof rawUrl !== 'string') {
    return { ok: false, error: 'La URL debe ser un texto.' };
  }

  const limpia = rawUrl.trim();
  if (limpia.length > MAX_URL_LENGTH) {
    return { ok: false, error: `La URL no puede superar los ${MAX_URL_LENGTH} caracteres.` };
  }

  // Evita saltos de línea o caracteres de control
  if (/[\r\n\t\0]/.test(limpia)) {
    return { ok: false, error: 'La URL contiene caracteres no permitidos.' };
  }

  try {
    const parsed = new URL(limpia);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { ok: false, error: 'Solo se permiten enlaces con http:// o https://.' };
    }
    return { ok: true, url: parsed.toString() };
  } catch {
    return { ok: false, error: 'El formato de la URL no es válido.' };
  }
}

async function leerConfigJson(): Promise<ConfigJson> {
  try {
    const contenido = await fs.readFile(RUTA_CONFIG, 'utf-8');
    const parsed = JSON.parse(contenido);
    const validacion = validarYNormalizarUrl(parsed?.urlSistemaExterno);
    return { urlSistemaExterno: validacion.ok ? validacion.url : '' };
  } catch {
    return { urlSistemaExterno: '' };
  }
}

async function escribirConfigJsonAtomico(datos: ConfigJson): Promise<void> {
  const dir = path.dirname(RUTA_CONFIG);
  const tempPath = `${RUTA_CONFIG}.${process.pid}.tmp`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tempPath, JSON.stringify(datos, null, 2), 'utf-8');
  await fs.rename(tempPath, RUTA_CONFIG);
}

export const obtenerUrlExternaLogin = async (_req: Request, res: Response) => {
  const datos = await leerConfigJson();
  return res.json({ exito: true, datos });
};

export const actualizarUrlExternaLogin = async (req: Request, res: Response) => {
  try {
    const validacion = validarYNormalizarUrl(req.body?.urlSistemaExterno);
    if (!validacion.ok) {
      return res.status(400).json({ exito: false, error: validacion.error });
    }

    const payload: ConfigJson = { urlSistemaExterno: validacion.url };
    await escribirConfigJsonAtomico(payload);

    return res.json({
      exito: true,
      mensaje: 'URL actualizada correctamente.',
      datos: payload,
    });
  } catch {
    return res.status(500).json({
      exito: false,
      error: 'No se pudo guardar la configuración.',
    });
  }
};