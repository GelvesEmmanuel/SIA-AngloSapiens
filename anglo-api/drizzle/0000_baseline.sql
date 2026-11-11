CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--> statement-breakpoint
CREATE TYPE "public"."accion_auditoria" AS ENUM('CREATE', 'UPDATE', 'DELETE');--> statement-breakpoint
CREATE TYPE "public"."categoria_archivo" AS ENUM('FOTO', 'CEDULA', 'FIRMA', 'CV', 'CERTIFICACION', 'DISCAPACIDAD');--> statement-breakpoint
CREATE TYPE "public"."dia_semana" AS ENUM('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO');--> statement-breakpoint
CREATE TYPE "public"."estado_archivo" AS ENUM('VIGENTE', 'HISTORICO');--> statement-breakpoint
CREATE TYPE "public"."estado_asistencia" AS ENUM('AUSENTE');--> statement-breakpoint
CREATE TYPE "public"."estado_curso" AS ENUM('ACTIVO', 'INACTIVO');--> statement-breakpoint
CREATE TYPE "public"."estado_docente" AS ENUM('REGISTRADO', 'ACTIVO', 'INACTIVO');--> statement-breakpoint
CREATE TYPE "public"."estado_estudiante" AS ENUM('PRE_REGISTRADO', 'REGISTRADO', 'MATRICULADO', 'INACTIVO');--> statement-breakpoint
CREATE TYPE "public"."estado_grupo" AS ENUM('PROGRAMADO', 'EN_CURSO', 'FINALIZADO', 'CANCELADO');--> statement-breakpoint
CREATE TYPE "public"."estado_matricula" AS ENUM('ACTIVA', 'CANCELADA', 'FINALIZADA');--> statement-breakpoint
CREATE TYPE "public"."estado_pago" AS ENUM('PAGO', 'NO_PAGO');--> statement-breakpoint
CREATE TYPE "public"."estado_periodo" AS ENUM('PROGRAMADO', 'ACTIVO', 'FINALIZADO', 'INACTIVO');--> statement-breakpoint
CREATE TYPE "public"."estado_usuario" AS ENUM('ACTIVO', 'INACTIVO');--> statement-breakpoint
CREATE TYPE "public"."habilidad" AS ENUM('SPEAKING', 'WRITING', 'LISTENING', 'READING', 'GRAMMAR', 'HOMEWORK', 'ASISTENCIA', 'PARTICIPATION', 'EXAMS');--> statement-breakpoint
CREATE TYPE "public"."habilidad_nota" AS ENUM('SPEAKING', 'WRITING', 'LISTENING', 'READING', 'GRAMMAR', 'HOMEWORK', 'ASISTENCIA', 'PARTICIPATION', 'EXAMS', 'EXAMEN_FINAL');--> statement-breakpoint
CREATE TYPE "public"."modo_pago" AS ENUM('CONTADO', 'CUOTAS');--> statement-breakpoint
CREATE TYPE "public"."nivel_mcer" AS ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2');--> statement-breakpoint
CREATE TYPE "public"."rol_usuario" AS ENUM('SUPER_ADMIN', 'COORD_ACADEMICO', 'COORD_ADMINISTRATIVO', 'DOCENTE', 'ESTUDIANTE');--> statement-breakpoint
CREATE TYPE "public"."tipo_contacto" AS ENUM('ACUDIENTE_LEGAL', 'EMERGENCIA');--> statement-breakpoint
CREATE TYPE "public"."tipo_entidad" AS ENUM('ESTUDIANTE', 'DOCENTE');--> statement-breakpoint
CREATE TYPE "public"."tipo_matricula" AS ENUM('REGULAR', 'EXTENSIVA');--> statement-breakpoint
CREATE TABLE "archivos" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"entidad_id" uuid NOT NULL,
	"tipo_entidad" "tipo_entidad" NOT NULL,
	"categoria" "categoria_archivo" NOT NULL,
	"url_archivo" varchar(500) NOT NULL,
	"estado" "estado_archivo" DEFAULT 'VIGENTE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asistencias" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"sesion_id" uuid NOT NULL,
	"estudiante_id" uuid NOT NULL,
	"estado" "estado_asistencia" DEFAULT 'AUSENTE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uk_asistencia_sesion" UNIQUE("sesion_id","estudiante_id")
);
--> statement-breakpoint
CREATE TABLE "auditoria_sistema" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tabla_afectada" varchar(50) NOT NULL,
	"registro_id" uuid NOT NULL,
	"accion" "accion_auditoria" NOT NULL,
	"datos_antiguos" jsonb,
	"datos_nuevos" jsonb,
	"motivo" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacto_estudiante" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"estudiante_id" uuid NOT NULL,
	"tipo" "tipo_contacto" NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"apellidos" varchar(100) NOT NULL,
	"tipo_documento" varchar(30),
	"numero_documento" varchar(20),
	"telefono" varchar(20) NOT NULL,
	"direccion" varchar(200),
	"ocupacion" varchar(100),
	"parentesco" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contacto_estudiante_numero_documento_unique" UNIQUE("numero_documento")
);
--> statement-breakpoint
CREATE TABLE "coordinadores" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"usuario_id" uuid,
	"primer_nombre" varchar(50) NOT NULL,
	"segundo_nombre" varchar(50),
	"primer_apellido" varchar(50) NOT NULL,
	"segundo_apellido" varchar(50),
	"documento_identidad" varchar(20) NOT NULL,
	"dia_cumpleanos" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coordinadores_usuario_id_unique" UNIQUE("usuario_id"),
	CONSTRAINT "coordinadores_documento_identidad_unique" UNIQUE("documento_identidad")
);
--> statement-breakpoint
CREATE TABLE "cursos" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"nivel" "nivel_mcer" NOT NULL,
	"descripcion" text,
	"duracion_semanas" integer NOT NULL,
	"intensidad_semanal" integer NOT NULL,
	"estado" "estado_curso" DEFAULT 'INACTIVO' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "cursos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "docentes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"usuario_id" uuid,
	"codigo" varchar(20) NOT NULL,
	"tipo_documento" varchar(30) NOT NULL,
	"numero_documento" varchar(20) NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"apellidos" varchar(100) NOT NULL,
	"fecha_nacimiento" date NOT NULL,
	"telefono" varchar(20),
	"correo" varchar(255),
	"formacion_academica" varchar(200),
	"experiencia_laboral" varchar(200),
	"reporta_discapacidad" boolean DEFAULT false NOT NULL,
	"estado" "estado_docente" DEFAULT 'REGISTRADO' NOT NULL,
	"motivo_inactivacion" text,
	"fecha_vinculacion" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "docentes_usuario_id_unique" UNIQUE("usuario_id"),
	CONSTRAINT "docentes_codigo_unique" UNIQUE("codigo"),
	CONSTRAINT "docentes_numero_documento_unique" UNIQUE("numero_documento")
);
--> statement-breakpoint
CREATE TABLE "estudiantes" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"usuario_id" uuid,
	"codigo" varchar(20) NOT NULL,
	"tipo_documento" varchar(30) NOT NULL,
	"numero_documento" varchar(20) NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"apellidos" varchar(100) NOT NULL,
	"fecha_nacimiento" date NOT NULL,
	"telefono" varchar(20),
	"grado_academico" varchar(100),
	"institucion_educativa" varchar(150),
	"reporta_discapacidad" boolean DEFAULT false NOT NULL,
	"estado" "estado_estudiante" DEFAULT 'PRE_REGISTRADO' NOT NULL,
	"motivo_inactivacion" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "estudiantes_usuario_id_unique" UNIQUE("usuario_id"),
	CONSTRAINT "estudiantes_codigo_unique" UNIQUE("codigo"),
	CONSTRAINT "estudiantes_numero_documento_unique" UNIQUE("numero_documento")
);
--> statement-breakpoint
CREATE TABLE "grupos" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"periodo_id" uuid NOT NULL,
	"curso_id" uuid NOT NULL,
	"docente_id" uuid,
	"codigo" varchar(20) NOT NULL,
	"cupo_maximo" integer NOT NULL,
	"cupos_disponibles" integer NOT NULL,
	"aula" varchar(50),
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"estado" "estado_grupo" DEFAULT 'PROGRAMADO' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "uk_grupo_periodo" UNIQUE("periodo_id","codigo"),
	CONSTRAINT "chk_cupos" CHECK ("grupos"."cupos_disponibles" >= 0 AND "grupos"."cupos_disponibles" <= "grupos"."cupo_maximo")
);
--> statement-breakpoint
CREATE TABLE "habilidades_curso" (
	"curso_id" uuid NOT NULL,
	"habilidad" "habilidad" NOT NULL,
	CONSTRAINT "habilidades_curso_curso_id_habilidad_pk" PRIMARY KEY("curso_id","habilidad")
);
--> statement-breakpoint
CREATE TABLE "horarios_grupos" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"grupo_id" uuid NOT NULL,
	"dia_semana" "dia_semana" NOT NULL,
	"hora_inicio" time NOT NULL,
	"hora_fin" time NOT NULL,
	CONSTRAINT "chk_horario" CHECK ("horarios_grupos"."hora_fin" > "horarios_grupos"."hora_inicio")
);
--> statement-breakpoint
CREATE TABLE "matriculas" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"estudiante_id" uuid NOT NULL,
	"grupo_id" uuid NOT NULL,
	"codigo" varchar(30) NOT NULL,
	"tipo_matricula" "tipo_matricula" DEFAULT 'REGULAR' NOT NULL,
	"valor_acordado" numeric(12, 2),
	"descuento_aplicado" numeric(12, 2) DEFAULT '0',
	"modo_pago" "modo_pago",
	"estado_pago" "estado_pago" DEFAULT 'NO_PAGO' NOT NULL,
	"estado_matricula" "estado_matricula" DEFAULT 'ACTIVA' NOT NULL,
	"fecha_matricula" date DEFAULT CURRENT_DATE NOT NULL,
	"fecha_cancelacion" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "matriculas_codigo_unique" UNIQUE("codigo"),
	CONSTRAINT "uk_estudiante_grupo" UNIQUE("estudiante_id","grupo_id")
);
--> statement-breakpoint
CREATE TABLE "niveles_autorizados_docente" (
	"docente_id" uuid NOT NULL,
	"nivel" "nivel_mcer" NOT NULL,
	CONSTRAINT "niveles_autorizados_docente_docente_id_nivel_pk" PRIMARY KEY("docente_id","nivel")
);
--> statement-breakpoint
CREATE TABLE "notas" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"matricula_id" uuid NOT NULL,
	"habilidad" "habilidad_nota" NOT NULL,
	"nota" numeric(3, 1) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uk_nota_habilidad" UNIQUE("matricula_id","habilidad"),
	CONSTRAINT "chk_nota_rango" CHECK ("notas"."nota" >= 0.0 AND "notas"."nota" <= 5.0)
);
--> statement-breakpoint
CREATE TABLE "periodos_academicos" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"estado" "estado_periodo" DEFAULT 'PROGRAMADO' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "periodos_academicos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "sesiones_clase" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"grupo_id" uuid NOT NULL,
	"fecha_clase" date NOT NULL,
	CONSTRAINT "uk_sesion_fecha" UNIQUE("grupo_id","fecha_clase")
);
--> statement-breakpoint
CREATE TABLE "usuario_roles" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"rol" "rol_usuario" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_usuario_rol" UNIQUE("usuario_id","rol")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"usuario_id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"username" varchar(50) NOT NULL,
	"contraseña_hash" varchar(255) NOT NULL,
	"estado" "estado_usuario" DEFAULT 'ACTIVO' NOT NULL,
	"requiere_cambio_contraseña" boolean DEFAULT true NOT NULL,
	"versión_token" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_sesion_id_sesiones_clase_id_fk" FOREIGN KEY ("sesion_id") REFERENCES "public"."sesiones_clase"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_estudiante_id_estudiantes_id_fk" FOREIGN KEY ("estudiante_id") REFERENCES "public"."estudiantes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditoria_sistema" ADD CONSTRAINT "auditoria_sistema_usuario_id_usuarios_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("usuario_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacto_estudiante" ADD CONSTRAINT "contacto_estudiante_estudiante_id_estudiantes_id_fk" FOREIGN KEY ("estudiante_id") REFERENCES "public"."estudiantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coordinadores" ADD CONSTRAINT "coordinadores_usuario_id_usuarios_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("usuario_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "docentes" ADD CONSTRAINT "docentes_usuario_id_usuarios_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("usuario_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_usuario_id_usuarios_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("usuario_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_periodo_id_periodos_academicos_id_fk" FOREIGN KEY ("periodo_id") REFERENCES "public"."periodos_academicos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_docente_id_docentes_id_fk" FOREIGN KEY ("docente_id") REFERENCES "public"."docentes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habilidades_curso" ADD CONSTRAINT "habilidades_curso_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horarios_grupos" ADD CONSTRAINT "horarios_grupos_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_estudiante_id_estudiantes_id_fk" FOREIGN KEY ("estudiante_id") REFERENCES "public"."estudiantes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "niveles_autorizados_docente" ADD CONSTRAINT "niveles_autorizados_docente_docente_id_docentes_id_fk" FOREIGN KEY ("docente_id") REFERENCES "public"."docentes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas" ADD CONSTRAINT "notas_matricula_id_matriculas_id_fk" FOREIGN KEY ("matricula_id") REFERENCES "public"."matriculas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesiones_clase" ADD CONSTRAINT "sesiones_clase_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuario_id_usuarios_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("usuario_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_archivos_entidad" ON "archivos" USING btree ("entidad_id","tipo_entidad");--> statement-breakpoint
CREATE INDEX "idx_auditoria_tabla" ON "auditoria_sistema" USING btree ("tabla_afectada","registro_id");--> statement-breakpoint
CREATE INDEX "idx_coordinadores_documento" ON "coordinadores" USING btree ("documento_identidad");--> statement-breakpoint
CREATE INDEX "idx_docentes_documento" ON "docentes" USING btree ("numero_documento");--> statement-breakpoint
CREATE INDEX "idx_docentes_estado" ON "docentes" USING btree ("estado") WHERE "docentes"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_estudiantes_documento" ON "estudiantes" USING btree ("numero_documento");--> statement-breakpoint
CREATE INDEX "idx_estudiantes_estado" ON "estudiantes" USING btree ("estado") WHERE "estudiantes"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_grupos_periodo" ON "grupos" USING btree ("periodo_id");--> statement-breakpoint
CREATE INDEX "idx_grupos_docente" ON "grupos" USING btree ("docente_id") WHERE "grupos"."docente_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_matriculas_estudiante" ON "matriculas" USING btree ("estudiante_id");--> statement-breakpoint
CREATE INDEX "idx_matriculas_grupo" ON "matriculas" USING btree ("grupo_id");--> statement-breakpoint
CREATE INDEX "idx_usuario_roles_usuario" ON "usuario_roles" USING btree ("usuario_id");