-- =============================================================================
-- MIGRACIÓN 036: Parámetros de costos para Digital
-- Fecha: 2026-10-29
-- Descripción:
--   Crea las tablas separadas para materiales, procesos/acabados,
--   costos operativos y configuración comercial del cotizador digital.
--   Mantiene un esquema independiente del offset porque sus costos y cálculos
--   no son equivalentes.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS materiales_digitales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    unidad VARCHAR(50) NOT NULL DEFAULT 'Metro',
    tipo_cobro VARCHAR(20) NOT NULL DEFAULT 'metro' CHECK (tipo_cobro IN ('metro', 'fijo', 'millar')),
    costo_unitario NUMERIC(10, 4) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    usuario_creacion_id INT REFERENCES usuarios(id),
    usuario_modificacion_id INT REFERENCES usuarios(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS procesos_digitales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    tipo_cobro VARCHAR(20) NOT NULL CHECK (tipo_cobro IN ('metro', 'fijo', 'millar')),
    precio NUMERIC(10, 4) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    usuario_creacion_id INT REFERENCES usuarios(id),
    usuario_modificacion_id INT REFERENCES usuarios(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS costos_operativos_digitales (
    id SERIAL PRIMARY KEY,
    concepto VARCHAR(150) NOT NULL,
    tipo_cobro VARCHAR(20) NOT NULL DEFAULT 'metro' CHECK (tipo_cobro IN ('metro', 'fijo', 'millar')),
    costo_fijo NUMERIC(10, 2) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    usuario_creacion_id INT REFERENCES usuarios(id),
    usuario_modificacion_id INT REFERENCES usuarios(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuracion_comercial (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL DEFAULT 'Configuración principal',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    usuario_modificacion_id INT REFERENCES usuarios(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuracion_comercial_margenes (
    id SERIAL PRIMARY KEY,
    configuracion_comercial_id INT NOT NULL REFERENCES configuracion_comercial(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    porcentaje NUMERIC(5, 2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT NOT NULL DEFAULT 1,
    usuario_modificacion_id INT REFERENCES usuarios(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuracion_comercial_plazos (
    id SERIAL PRIMARY KEY,
    configuracion_comercial_id INT NOT NULL REFERENCES configuracion_comercial(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL, -- Ej: 30 días, 60 días, 90 días
    dias INT NOT NULL,
    recargo_porcentaje NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INT NOT NULL DEFAULT 1,
    usuario_modificacion_id INT REFERENCES usuarios(id),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auditoria_parametros_digital (
    id SERIAL PRIMARY KEY,
    tabla VARCHAR(80) NOT NULL,
    registro_id INT NOT NULL,
    accion VARCHAR(20) NOT NULL CHECK (accion IN ('crear', 'editar', 'eliminar')),
    usuario_id INT REFERENCES usuarios(id),
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_materiales_digitales_estado
    ON materiales_digitales (estado);

CREATE INDEX IF NOT EXISTS idx_materiales_digitales_nombre
    ON materiales_digitales (nombre);

CREATE INDEX IF NOT EXISTS idx_materiales_digitales_tipo_cobro
    ON materiales_digitales (tipo_cobro);

CREATE INDEX IF NOT EXISTS idx_procesos_digitales_estado
    ON procesos_digitales (estado);

CREATE INDEX IF NOT EXISTS idx_procesos_digitales_tipo_cobro
    ON procesos_digitales (tipo_cobro);

CREATE INDEX IF NOT EXISTS idx_costos_operativos_digitales_estado
    ON costos_operativos_digitales (estado);

CREATE INDEX IF NOT EXISTS idx_costos_operativos_digitales_tipo_cobro
    ON costos_operativos_digitales (tipo_cobro);

CREATE INDEX IF NOT EXISTS idx_configuracion_comercial_activo
    ON configuracion_comercial (activo);

CREATE INDEX IF NOT EXISTS idx_configuracion_comercial_margenes_activo
    ON configuracion_comercial_margenes (activo);

CREATE INDEX IF NOT EXISTS idx_configuracion_comercial_plazos_activo
    ON configuracion_comercial_plazos (activo);

CREATE INDEX IF NOT EXISTS idx_auditoria_parametros_digital_tabla
    ON auditoria_parametros_digital (tabla);

CREATE INDEX IF NOT EXISTS idx_auditoria_parametros_digital_usuario_id
    ON auditoria_parametros_digital (usuario_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_parametros_digital_created_at
    ON auditoria_parametros_digital (created_at);

COMMIT;
