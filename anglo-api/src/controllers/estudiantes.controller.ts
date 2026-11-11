import { Request, Response, NextFunction} from 'express';
import { preRegistrarEstudiante,generarCodigoEstudiante } from '../services/estudiante.service.js';

import type { InsertEstudiante } from '../types/estudiantes.types.js';
import type { InsertContacto } from '../types/contactoEstudiante.types.js';
import { EstadoEstudiante } from '../types/estudiantes.types.js';
import { guardarOActualizarArchivosEnBD } from '../services/archivos.service.js';
import { AppError } from '../utils/appError.utils.js';
import { cleanupTemporaryFiles } from '../utils/uploadCleanup.utils.js';
import { subirArchivo } from '../services/storage.service.js';
import { NeonSession } from 'drizzle-orm/neon-serverless';

    export const preRegistrarEstudianteController = async (
    req: Request,
    res: Response,
    next: NextFunction
    ) => {
    const uploadFilesPaths: string[] = []; 
    let requestSucceeded = false;

    try {
        const usuarioAdminId = (req as any).user?.usuarioId;
        if (!usuarioAdminId) {
        throw new AppError("Falta información del usuario en el token.", 401, "NO_AUTORIZADO");
        }

        // ==========================================
        // PASO 1: VALIDAR DATOS Y CONTACTOS PRIMERO
        // ==========================================
        let contactos: InsertContacto[] = [];
        try {
        if (req.body.contactos) {
            contactos = typeof req.body.contactos === 'string' 
            ? JSON.parse(req.body.contactos) 
            : req.body.contactos;
        }
        } catch (e) {
        throw new AppError("El formato de los contactos/acudientes no es un JSON válido.", 400, "CONTACTOS_INVALIDOS");
        }

        if (!Array.isArray(contactos) || contactos.length === 0) {
        throw new AppError("Debe enviar los contactos o acudientes obligatorios.", 400, "CONTACTOS_FALTANTES");
        }

        // ==========================================
        // PASO 2: VALIDAR QUE LOS ARCHIVOS EXISTAN
        // ==========================================
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const camposObligatorios = ['profilePicture', 'identityDocument'];
        const archivosFaltantes: string[] = [];

        for (const campo of camposObligatorios) {
        if (!files || !files[campo] || files[campo].length === 0) {
            archivosFaltantes.push(campo);
        }
        }

        if (archivosFaltantes.length > 0) {
        throw new AppError(
            `Faltan archivos obligatorios: ${archivosFaltantes.join(", ")}`,
            400,
            "ARCHIVOS_FALTANTES"
        );
        }

        // ==========================================
        // PASO 3: PREPARAR DATOS DEL ESTUDIANTE
        // ==========================================
        const codigoGenerado = await generarCodigoEstudiante();
        const dataEstudiante = {
        codigo: codigoGenerado,
        usuarioId: null,
        tipoDocumento: req.body.tipoDocumento,
        numeroDocumento: req.body.numeroDocumento,
        nombre: req.body.nombre,
        apellidos: req.body.apellidos,
        fechaNacimiento: req.body.fechaNacimiento,
        telefono: req.body.telefono ?? null,
        gradoAcademico: req.body.gradoAcademico ?? null,
        institucionEducativa: req.body.institucionEducativa ?? null,
        reportaDiscapacidad: req.body.reportaDiscapacidad === 'true' || req.body.reportaDiscapacidad === true,
        estado: "PRE_REGISTRADO" as const,
        };

        // ==========================================
        // PASO 4: SUBIR A SUPABASE (AHORA SÍ, SEGUROS)
        // ==========================================
        const documentPaths: Record<string, string> = {};
        for (const [fieldname, fileArray] of Object.entries(files)) {
        if (fileArray && fileArray.length > 0) {
            const file = fileArray[0];
            uploadFilesPaths.push(file.path); // Guardamos la ruta local por si falla el servicio de BD

            let carpetaSupabase = 'Estudiantes/Otros';
            if (fieldname === 'profilePicture') carpetaSupabase = 'Estudiantes/FotosPerfil';
            if (fieldname === 'identityDocument') carpetaSupabase = 'Estudiantes/DocumentosIdentidad';
            if (fieldname === 'disabilityCertificate') carpetaSupabase = 'Estudiantes/CertificadosDiscapacidad';

            const storagePath = await subirArchivo(file.path, carpetaSupabase, file.mimetype);
            documentPaths[fieldname] = storagePath;
        }
        }

        // ==========================================
        // PASO 5: EJECUTAR TRANSACCIÓN EN BASE DE DATOS
        // ==========================================
        const nuevoEstudiante = await preRegistrarEstudiante(dataEstudiante, contactos, usuarioAdminId);

        if (Object.keys(documentPaths).length > 0) {
        await guardarOActualizarArchivosEnBD(nuevoEstudiante.id, "ESTUDIANTE", documentPaths);
        }

        requestSucceeded = true;
        return res.status(201).json({
        success: true,
        message: "Estudiante pre-registrado con éxito",
        data: nuevoEstudiante,
        documentPaths
        });

    } catch (error: unknown) {
        // Si ocurre cualquier error de validación o en la BD, entra aquí 
        // y el bloque 'finally' limpiará los archivos locales de Multer.
        return next(error);
    } finally {
        if (uploadFilesPaths.length > 0) {
        await cleanupTemporaryFiles(uploadFilesPaths);
        }
    }
    };