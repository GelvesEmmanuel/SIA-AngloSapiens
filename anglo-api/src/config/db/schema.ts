import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  date,
  time,
  numeric,
  jsonb,
  index,
  unique,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";

/**
 * Esquema Drizzle ORM convertido desde BD_ANGLO.sql.
 * Mantiene los enums, tablas, claves, restricciones, índices y valores por defecto.
 *
 * Nota: la base original usa uuid_generate_v4(), por lo que PostgreSQL debe tener
 * habilitada la extensión uuid-ossp. El archivo drizzle.config.ts/migración debe
 * ejecutar: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
 */

// -----------------------------------------------------------------------------
// ENUMS
// -----------------------------------------------------------------------------
export const rolUsuarioEnum = pgEnum("rol_usuario", [
  "SUPER_ADMIN",
  "COORD_ACADEMICO",
  "COORD_ADMINISTRATIVO",
  "DOCENTE",
  "ESTUDIANTE",
]);

export const estadoUsuarioEnum = pgEnum("estado_usuario", ["ACTIVO", "INACTIVO"]);

export const estadoEstudianteEnum = pgEnum("estado_estudiante", [
  "PRE_REGISTRADO",
  "REGISTRADO",
  "MATRICULADO",
  "INACTIVO",
]);

export const estadoDocenteEnum = pgEnum("estado_docente", [
  "REGISTRADO",
  "ACTIVO",
  "INACTIVO",
]);

export const tipoContactoEnum = pgEnum("tipo_contacto", [
  "ACUDIENTE_LEGAL",
  "EMERGENCIA",
]);

export const tipoEntidadEnum = pgEnum("tipo_entidad", ["ESTUDIANTE", "DOCENTE"]);

export const categoriaArchivoEnum = pgEnum("categoria_archivo", [
  "FOTO",
  "CEDULA",
  "FIRMA",
  "CV",
  "CERTIFICACION",
  "DISCAPACIDAD",
]);

export const estadoArchivoEnum = pgEnum("estado_archivo", ["VIGENTE", "HISTORICO"]);

export const accionAuditoriaEnum = pgEnum("accion_auditoria", [
  "CREATE",
  "UPDATE",
  "DELETE",
]);

export const nivelMcerEnum = pgEnum("nivel_mcer", ["A1", "A2", "B1", "B2", "C1", "C2"]);

export const estadoCursoEnum = pgEnum("estado_curso", ["ACTIVO", "INACTIVO"]);

export const habilidadEnum = pgEnum("habilidad", [
  "SPEAKING",
  "WRITING",
  "LISTENING",
  "READING",
  "GRAMMAR",
  "HOMEWORK",
  "ASISTENCIA",
  "PARTICIPATION",
  "EXAMS",
]);

export const estadoPeriodoEnum = pgEnum("estado_periodo", [
  "PROGRAMADO",
  "ACTIVO",
  "FINALIZADO",
  "INACTIVO",
]);

export const estadoGrupoEnum = pgEnum("estado_grupo", [
  "PROGRAMADO",
  "EN_CURSO",
  "FINALIZADO",
  "CANCELADO",
]);

export const diaSemanaEnum = pgEnum("dia_semana", [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
]);

export const tipoMatriculaEnum = pgEnum("tipo_matricula", ["REGULAR", "EXTENSIVA"]);

export const modoPagoEnum = pgEnum("modo_pago", ["CONTADO", "CUOTAS"]);

export const estadoPagoEnum = pgEnum("estado_pago", ["PAGO", "NO_PAGO"]);

export const estadoMatriculaEnum = pgEnum("estado_matricula", [
  "ACTIVA",
  "CANCELADA",
  "FINALIZADA",
]);

export const estadoAsistenciaEnum = pgEnum("estado_asistencia", ["AUSENTE"]);

export const habilidadNotaEnum = pgEnum("habilidad_nota", [
  "SPEAKING",
  "WRITING",
  "LISTENING",
  "READING",
  "GRAMMAR",
  "HOMEWORK",
  "ASISTENCIA",
  "PARTICIPATION",
  "EXAMS",
  "EXAMEN_FINAL",
]);

// -----------------------------------------------------------------------------
// 1. SEGURIDAD
// -----------------------------------------------------------------------------
export const usuarios = pgTable(
  "usuarios",
  {
    usuarioId: uuid("usuario_id")
      .primaryKey()
      .default(sql`uuid_generate_v4()`),
    username: varchar("username", { length: 50 }).notNull().unique(),
    contrasenaHash: varchar("contraseña_hash", { length: 255 }).notNull(),
    rol: rolUsuarioEnum("rol").notNull(),
    estado: estadoUsuarioEnum("estado").notNull().default("ACTIVO"),
    requiereCambioContrasena: boolean("requiere_cambio_contraseña")
      .notNull()
      .default(true),
    versionToken: integer("versión_token").notNull().default(1),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("idx_usuarios_rol").on(table.rol)],
);

export const auditoriaSistema = pgTable(
  "auditoria_sistema",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.usuarioId, { onDelete: "restrict" }),
    tablaAfectada: varchar("tabla_afectada", { length: 50 }).notNull(),
    registroId: uuid("registro_id").notNull(),
    accion: accionAuditoriaEnum("accion").notNull(),
    datosAntiguos: jsonb("datos_antiguos"),
    datosNuevos: jsonb("datos_nuevos"),
    motivo: text("motivo"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("idx_auditoria_tabla").on(table.tablaAfectada, table.registroId)],
);

// -----------------------------------------------------------------------------
// 2. ESTUDIANTES
// -----------------------------------------------------------------------------
export const estudiantes = pgTable(
  "estudiantes",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    usuarioId: uuid("usuario_id").unique().references(() => usuarios.usuarioId, {
      onDelete: "set null",
    }),
    codigo: varchar("codigo", { length: 20 }).notNull().unique(),
    tipoDocumento: varchar("tipo_documento", { length: 30 }).notNull(),
    numeroDocumento: varchar("numero_documento", { length: 20 }).notNull().unique(),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    apellidos: varchar("apellidos", { length: 100 }).notNull(),
    fechaNacimiento: date("fecha_nacimiento", { mode: "string" }).notNull(),
    telefono: varchar("telefono", { length: 20 }),
    gradoAcademico: varchar("grado_academico", { length: 100 }),
    institucionEducativa: varchar("institucion_educativa", { length: 150 }),
    reportaDiscapacidad: boolean("reporta_discapacidad").notNull().default(false),
    estado: estadoEstudianteEnum("estado").notNull().default("PRE_REGISTRADO"),
    motivoInactivacion: text("motivo_inactivacion"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
  },
  (table) => [
    index("idx_estudiantes_documento").on(table.numeroDocumento),
    index("idx_estudiantes_estado")
      .on(table.estado)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const contactoEstudiante = pgTable("contacto_estudiante", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  estudianteId: uuid("estudiante_id")
    .notNull()
    .references(() => estudiantes.id, { onDelete: "cascade" }),
  tipo: tipoContactoEnum("tipo").notNull(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  apellidos: varchar("apellidos", { length: 100 }).notNull(),
  tipoDocumento: varchar("tipo_documento", { length: 30 }),
  numeroDocumento: varchar("numero_documento", { length: 20 }).unique(),
  telefono: varchar("telefono", { length: 20 }).notNull(),
  direccion: varchar("direccion", { length: 200 }),
  ocupacion: varchar("ocupacion", { length: 100 }),
  parentesco: varchar("parentesco", { length: 50 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// -----------------------------------------------------------------------------
// 3. DOCENTES
// -----------------------------------------------------------------------------
export const docentes = pgTable(
  "docentes",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    usuarioId: uuid("usuario_id").unique().references(() => usuarios.usuarioId, {
      onDelete: "set null",
    }),
    codigo: varchar("codigo", { length: 20 }).notNull().unique(),
    tipoDocumento: varchar("tipo_documento", { length: 30 }).notNull(),
    numeroDocumento: varchar("numero_documento", { length: 20 }).notNull().unique(),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    apellidos: varchar("apellidos", { length: 100 }).notNull(),
    fechaNacimiento: date("fecha_nacimiento", { mode: "string" }).notNull(),
    telefono: varchar("telefono", { length: 20 }),
    formacionAcademica: varchar("formacion_academica", { length: 200 }),
    reportaDiscapacidad: boolean("reporta_discapacidad").notNull().default(false),
    estado: estadoDocenteEnum("estado").notNull().default("REGISTRADO"),
    motivoInactivacion: text("motivo_inactivacion"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
  },
  (table) => [
    index("idx_docentes_documento").on(table.numeroDocumento),
    index("idx_docentes_estado")
      .on(table.estado)
      .where(sql`${table.deletedAt} IS NULL`),
  ],
);

export const nivelesAutorizadosDocente = pgTable(
  "niveles_autorizados_docente",
  {
    docenteId: uuid("docente_id")
      .notNull()
      .references(() => docentes.id, { onDelete: "cascade" }),
    nivel: nivelMcerEnum("nivel").notNull(),
  },
  (table) => [primaryKey({ columns: [table.docenteId, table.nivel] })],
);

// -----------------------------------------------------------------------------
// 4. ARCHIVOS (relación polimórfica; entidad_id no tiene FK en el SQL original)
// -----------------------------------------------------------------------------
export const archivos = pgTable(
  "archivos",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    entidadId: uuid("entidad_id").notNull(),
    tipoEntidad: tipoEntidadEnum("tipo_entidad").notNull(),
    categoria: categoriaArchivoEnum("categoria").notNull(),
    urlArchivo: varchar("url_archivo", { length: 500 }).notNull(),
    estado: estadoArchivoEnum("estado").notNull().default("VIGENTE"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("idx_archivos_entidad").on(table.entidadId, table.tipoEntidad)],
);

// -----------------------------------------------------------------------------
// 5. CURSOS Y GRUPOS
// -----------------------------------------------------------------------------
export const periodosAcademicos = pgTable("periodos_academicos", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  codigo: varchar("codigo", { length: 20 }).notNull().unique(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  fechaInicio: date("fecha_inicio", { mode: "string" }).notNull(),
  fechaFin: date("fecha_fin", { mode: "string" }).notNull(),
  estado: estadoPeriodoEnum("estado").notNull().default("PROGRAMADO"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const cursos = pgTable("cursos", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  codigo: varchar("codigo", { length: 20 }).notNull().unique(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  nivel: nivelMcerEnum("nivel").notNull(),
  descripcion: text("descripcion"),
  duracionSemanas: integer("duracion_semanas").notNull(),
  intensidadSemanal: integer("intensidad_semanal").notNull(),
  estado: estadoCursoEnum("estado").notNull().default("INACTIVO"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { mode: "date" }),
});

export const habilidadesCurso = pgTable(
  "habilidades_curso",
  {
    cursoId: uuid("curso_id")
      .notNull()
      .references(() => cursos.id, { onDelete: "cascade" }),
    habilidad: habilidadEnum("habilidad").notNull(),
  },
  (table) => [primaryKey({ columns: [table.cursoId, table.habilidad] })],
);

export const grupos = pgTable(
  "grupos",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    periodoId: uuid("periodo_id")
      .notNull()
      .references(() => periodosAcademicos.id, { onDelete: "restrict" }),
    cursoId: uuid("curso_id")
      .notNull()
      .references(() => cursos.id, { onDelete: "restrict" }),
    docenteId: uuid("docente_id").references(() => docentes.id, { onDelete: "set null" }),
    codigo: varchar("codigo", { length: 20 }).notNull(),
    cupoMaximo: integer("cupo_maximo").notNull(),
    cuposDisponibles: integer("cupos_disponibles").notNull(),
    aula: varchar("aula", { length: 50 }),
    fechaInicio: date("fecha_inicio", { mode: "string" }).notNull(),
    fechaFin: date("fecha_fin", { mode: "string" }).notNull(),
    estado: estadoGrupoEnum("estado").notNull().default("PROGRAMADO"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
  },
  (table) => [
    unique("uk_grupo_periodo").on(table.periodoId, table.codigo),
    check(
      "chk_cupos",
      sql`${table.cuposDisponibles} >= 0 AND ${table.cuposDisponibles} <= ${table.cupoMaximo}`,
    ),
    index("idx_grupos_periodo").on(table.periodoId),
    index("idx_grupos_docente")
      .on(table.docenteId)
      .where(sql`${table.docenteId} IS NOT NULL`),
  ],
);

export const horariosGrupos = pgTable(
  "horarios_grupos",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    grupoId: uuid("grupo_id")
      .notNull()
      .references(() => grupos.id, { onDelete: "cascade" }),
    diaSemana: diaSemanaEnum("dia_semana").notNull(),
    horaInicio: time("hora_inicio").notNull(),
    horaFin: time("hora_fin").notNull(),
  },
  (table) => [
    check("chk_horario", sql`${table.horaFin} > ${table.horaInicio}`),
  ],
);

// -----------------------------------------------------------------------------
// 6. MATRÍCULAS
// -----------------------------------------------------------------------------
export const matriculas = pgTable(
  "matriculas",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    estudianteId: uuid("estudiante_id")
      .notNull()
      .references(() => estudiantes.id, { onDelete: "restrict" }),
    grupoId: uuid("grupo_id")
      .notNull()
      .references(() => grupos.id, { onDelete: "restrict" }),
    codigo: varchar("codigo", { length: 30 }).notNull().unique(),
    tipoMatricula: tipoMatriculaEnum("tipo_matricula").notNull().default("REGULAR"),
    valorAcordado: numeric("valor_acordado", { precision: 12, scale: 2 }),
    descuentoAplicado: numeric("descuento_aplicado", { precision: 12, scale: 2 }).default("0"),
    modoPago: modoPagoEnum("modo_pago"),
    estadoPago: estadoPagoEnum("estado_pago").notNull().default("NO_PAGO"),
    estadoMatricula: estadoMatriculaEnum("estado_matricula").notNull().default("ACTIVA"),
    fechaMatricula: date("fecha_matricula", { mode: "string" }).notNull().default(sql`CURRENT_DATE`),
    fechaCancelacion: date("fecha_cancelacion", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique("uk_estudiante_grupo").on(table.estudianteId, table.grupoId),
    index("idx_matriculas_estudiante").on(table.estudianteId),
    index("idx_matriculas_grupo").on(table.grupoId),
  ],
);

// -----------------------------------------------------------------------------
// 7. GESTIÓN ACADÉMICA
// -----------------------------------------------------------------------------
export const sesionesClase = pgTable(
  "sesiones_clase",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    grupoId: uuid("grupo_id")
      .notNull()
      .references(() => grupos.id, { onDelete: "cascade" }),
    fechaClase: date("fecha_clase", { mode: "string" }).notNull(),
  },
  (table) => [unique("uk_sesion_fecha").on(table.grupoId, table.fechaClase)],
);

export const asistencias = pgTable(
  "asistencias",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    sesionId: uuid("sesion_id")
      .notNull()
      .references(() => sesionesClase.id, { onDelete: "cascade" }),
    estudianteId: uuid("estudiante_id")
      .notNull()
      .references(() => estudiantes.id, { onDelete: "restrict" }),
    estado: estadoAsistenciaEnum("estado").notNull().default("AUSENTE"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [unique("uk_asistencia_sesion").on(table.sesionId, table.estudianteId)],
);

export const notas = pgTable(
  "notas",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
    matriculaId: uuid("matricula_id")
      .notNull()
      .references(() => matriculas.id, { onDelete: "cascade" }),
    habilidad: habilidadNotaEnum("habilidad").notNull(),
    nota: numeric("nota", { precision: 3, scale: 1 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique("uk_nota_habilidad").on(table.matriculaId, table.habilidad),
    check("chk_nota_rango", sql`${table.nota} >= 0.0 AND ${table.nota} <= 5.0`),
  ],
);
