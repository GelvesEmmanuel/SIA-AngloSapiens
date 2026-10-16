-- ============================================================
-- SISTEMA DE INFORMACIÓN ACADÉMICA - ANGLOSAPIENS SAS
-- Script Final de Base de Datos para PostgreSQL
-- Filosofía: YAGNI (Solo lo necesario)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FASE 1: TIPOS ENUM
-- ============================================================
CREATE TYPE rol_usuario AS ENUM ('SUPER_ADMIN', 'COORD_ACADEMICO', 'COORD_ADMINISTRATIVO', 'DOCENTE', 'ESTUDIANTE');
CREATE TYPE estado_usuario AS ENUM ('ACTIVO', 'INACTIVO');
CREATE TYPE estado_estudiante AS ENUM ('PRE_REGISTRADO', 'REGISTRADO', 'MATRICULADO', 'INACTIVO');
CREATE TYPE estado_docente AS ENUM ('REGISTRADO', 'ACTIVO', 'INACTIVO');
CREATE TYPE tipo_contacto AS ENUM ('ACUDIENTE_LEGAL', 'EMERGENCIA');
CREATE TYPE tipo_entidad AS ENUM ('ESTUDIANTE', 'DOCENTE');
CREATE TYPE categoria_archivo AS ENUM ('FOTO', 'CEDULA', 'FIRMA', 'CV', 'CERTIFICACION', 'DISCAPACIDAD');
CREATE TYPE estado_archivo AS ENUM ('VIGENTE', 'HISTORICO');
CREATE TYPE accion_auditoria AS ENUM ('CREATE', 'UPDATE', 'DELETE');
CREATE TYPE nivel_mcer AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
CREATE TYPE estado_curso AS ENUM ('ACTIVO', 'INACTIVO');
CREATE TYPE habilidad AS ENUM ('SPEAKING', 'WRITING', 'LISTENING', 'READING', 'GRAMMAR', 'HOMEWORK', 'ASISTENCIA', 'PARTICIPATION', 'EXAMS');
CREATE TYPE estado_periodo AS ENUM ('PROGRAMADO', 'ACTIVO', 'FINALIZADO', 'INACTIVO');
CREATE TYPE estado_grupo AS ENUM ('PROGRAMADO', 'EN_CURSO', 'FINALIZADO', 'CANCELADO');
CREATE TYPE dia_semana AS ENUM ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO');
CREATE TYPE tipo_matricula AS ENUM ('REGULAR', 'EXTENSIVA');
CREATE TYPE modo_pago AS ENUM ('CONTADO', 'CUOTAS');
CREATE TYPE estado_pago AS ENUM ('PAGO', 'NO_PAGO');
CREATE TYPE estado_matricula AS ENUM ('ACTIVA', 'CANCELADA', 'FINALIZADA');
CREATE TYPE estado_asistencia AS ENUM ('AUSENTE');
CREATE TYPE habilidad_nota AS ENUM ('SPEAKING', 'WRITING', 'LISTENING', 'READING', 'GRAMMAR', 'HOMEWORK', 'ASISTENCIA', 'PARTICIPATION', 'EXAMS', 'EXAMEN_FINAL');

-- ============================================================
-- FASE 2: TABLAS NÚCLEO
-- ============================================================

-- 1. SEGURIDAD
CREATE TABLE usuarios (
    usuario_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    contraseña_hash VARCHAR(255) NOT NULL,
    rol rol_usuario NOT NULL,
    estado estado_usuario NOT NULL DEFAULT 'ACTIVO',
    requiere_cambio_contraseña BOOLEAN NOT NULL DEFAULT TRUE,
    versión_token INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auditoria_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(usuario_id) ON DELETE RESTRICT,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id UUID NOT NULL,
    accion accion_auditoria NOT NULL,
    datos_antiguos JSONB,
    datos_nuevos JSONB,
    motivo TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. ESTUDIANTES
CREATE TABLE estudiantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID UNIQUE REFERENCES usuarios(usuario_id) ON DELETE SET NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    tipo_documento VARCHAR(30) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    telefono VARCHAR(20),
    grado_academico VARCHAR(100),
    institucion_educativa VARCHAR(150),
    reporta_discapacidad BOOLEAN NOT NULL DEFAULT FALSE,
    estado estado_estudiante NOT NULL DEFAULT 'PRE_REGISTRADO',
    motivo_inactivacion TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE contacto_estudiante (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    tipo tipo_contacto NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    tipo_documento VARCHAR(30),
    numero_documento VARCHAR(20) UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    direccion VARCHAR(200),
    ocupacion VARCHAR(100),
    parentesco VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. DOCENTES
CREATE TABLE docentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID UNIQUE REFERENCES usuarios(usuario_id) ON DELETE SET NULL,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    tipo_documento VARCHAR(30) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    telefono VARCHAR(20),
    formacion_academica VARCHAR(200),
    reporta_discapacidad BOOLEAN NOT NULL DEFAULT FALSE,
    estado estado_docente NOT NULL DEFAULT 'REGISTRADO',
    motivo_inactivacion TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE niveles_autorizados_docente (
    docente_id UUID NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    nivel nivel_mcer NOT NULL,
    PRIMARY KEY (docente_id, nivel)
);

-- 4. ARCHIVOS (POLIMÓRFICO)
CREATE TABLE archivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entidad_id UUID NOT NULL,
    tipo_entidad tipo_entidad NOT NULL,
    categoria categoria_archivo NOT NULL,
    url_archivo VARCHAR(500) NOT NULL,
    estado estado_archivo NOT NULL DEFAULT 'VIGENTE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. CURSOS Y GRUPOS
CREATE TABLE periodos_academicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado estado_periodo NOT NULL DEFAULT 'PROGRAMADO',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cursos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    nivel nivel_mcer NOT NULL,
    descripcion TEXT,
    duracion_semanas INT NOT NULL,
    intensidad_semanal INT NOT NULL,
    estado estado_curso NOT NULL DEFAULT 'INACTIVO',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE habilidades_curso (
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    habilidad habilidad NOT NULL,
    PRIMARY KEY (curso_id, habilidad)
);

CREATE TABLE grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    periodo_id UUID NOT NULL REFERENCES periodos_academicos(id) ON DELETE RESTRICT,
    curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE RESTRICT,
    docente_id UUID REFERENCES docentes(id) ON DELETE SET NULL,
    codigo VARCHAR(20) NOT NULL,
    cupo_maximo INT NOT NULL,
    cupos_disponibles INT NOT NULL,
    aula VARCHAR(50),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado estado_grupo NOT NULL DEFAULT 'PROGRAMADO',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT uk_grupo_periodo UNIQUE (periodo_id, codigo),
    CONSTRAINT chk_cupos CHECK (cupos_disponibles >= 0 AND cupos_disponibles <= cupo_maximo)
);

CREATE TABLE horarios_grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    dia_semana dia_semana NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    CONSTRAINT chk_horario CHECK (hora_fin > hora_inicio)
);

-- 6. MATRÍCULAS
CREATE TABLE matriculas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE RESTRICT,
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE RESTRICT,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    tipo_matricula tipo_matricula NOT NULL DEFAULT 'REGULAR',
    valor_acordado DECIMAL(12, 2),
    descuento_aplicado DECIMAL(12, 2) DEFAULT 0,
    modo_pago modo_pago,
    estado_pago estado_pago NOT NULL DEFAULT 'NO_PAGO',
    estado_matricula estado_matricula NOT NULL DEFAULT 'ACTIVA',
    fecha_matricula DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_cancelacion DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_estudiante_grupo UNIQUE (estudiante_id, grupo_id)
);

-- 7. GESTIÓN ACADÉMICA
CREATE TABLE sesiones_clase (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    fecha_clase DATE NOT NULL,
    CONSTRAINT uk_sesion_fecha UNIQUE (grupo_id, fecha_clase)
);

CREATE TABLE asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sesion_id UUID NOT NULL REFERENCES sesiones_clase(id) ON DELETE CASCADE,
    estudiante_id UUID NOT NULL REFERENCES estudiantes(id) ON DELETE RESTRICT,
    estado estado_asistencia NOT NULL DEFAULT 'AUSENTE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_asistencia_sesion UNIQUE (sesion_id, estudiante_id)
);

CREATE TABLE notas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricula_id UUID NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
    habilidad habilidad_nota NOT NULL,
    nota DECIMAL(3, 1) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_nota_habilidad UNIQUE (matricula_id, habilidad),
    CONSTRAINT chk_nota_rango CHECK (nota >= 0.0 AND nota <= 5.0)
);

-- ============================================================
-- FASE 3: ÍNDICES ESTRATÉGICOS (Rendimiento)
-- ============================================================
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_estudiantes_documento ON estudiantes(numero_documento);
CREATE INDEX idx_estudiantes_estado ON estudiantes(estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_docentes_documento ON docentes(numero_documento);
CREATE INDEX idx_docentes_estado ON docentes(estado) WHERE deleted_at IS NULL;
CREATE INDEX idx_archivos_entidad ON archivos(entidad_id, tipo_entidad);
CREATE INDEX idx_grupos_periodo ON grupos(periodo_id);
CREATE INDEX idx_grupos_docente ON grupos(docente_id) WHERE docente_id IS NOT NULL;
CREATE INDEX idx_matriculas_estudiante ON matriculas(estudiante_id);
CREATE INDEX idx_matriculas_grupo ON matriculas(grupo_id);
CREATE INDEX idx_auditoria_tabla ON auditoria_sistema(tabla_afectada, registro_id);