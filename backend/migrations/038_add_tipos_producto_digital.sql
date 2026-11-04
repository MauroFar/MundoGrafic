-- =============================================================================
-- MIGRACIÓN 038: tipos de producto por área digital
-- Fecha: 2026-11-04
-- Descripción:
--   Crea un catálogo independiente para productos digitales y liga cada material,
--   proceso y costo operativo a los productos que aplica. Esto permite distinguir
--   etiqueta, caja, bolsa, etc. sin mezclar con offset ni otras áreas.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS tipos_producto_digital (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    usuario_creacion_id INT REFERENCES usuarios(id),
    usuario_modificacion_id INT REFERENCES usuarios(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (nombre)
);

CREATE TABLE IF NOT EXISTS materiales_digitales_tipos_productos (
    material_digital_id INT NOT NULL REFERENCES materiales_digitales(id) ON DELETE CASCADE,
    tipo_producto_id INT NOT NULL REFERENCES tipos_producto_digital(id) ON DELETE CASCADE,
    PRIMARY KEY (material_digital_id, tipo_producto_id)
);

CREATE TABLE IF NOT EXISTS procesos_digitales_tipos_productos (
    proceso_digital_id INT NOT NULL REFERENCES procesos_digitales(id) ON DELETE CASCADE,
    tipo_producto_id INT NOT NULL REFERENCES tipos_producto_digital(id) ON DELETE CASCADE,
    PRIMARY KEY (proceso_digital_id, tipo_producto_id)
);

CREATE TABLE IF NOT EXISTS costos_operativos_digitales_tipos_productos (
    costo_operativo_digital_id INT NOT NULL REFERENCES costos_operativos_digitales(id) ON DELETE CASCADE,
    tipo_producto_id INT NOT NULL REFERENCES tipos_producto_digital(id) ON DELETE CASCADE,
    PRIMARY KEY (costo_operativo_digital_id, tipo_producto_id)
);

CREATE INDEX IF NOT EXISTS idx_tipos_producto_digital_activo
    ON tipos_producto_digital (activo);

CREATE INDEX IF NOT EXISTS idx_tipos_producto_digital_nombre
    ON tipos_producto_digital (nombre);

COMMIT;
