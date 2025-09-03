/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    -- Crear secuencia para números de orden automáticos
    CREATE SEQUENCE IF NOT EXISTS orden_trabajo_numero_seq START 1;
    
    -- Función para generar número de orden automático
    CREATE OR REPLACE FUNCTION generar_numero_orden()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.numero_orden := 'OT-' || LPAD(nextval('orden_trabajo_numero_seq')::text, 6, '0');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Función para actualizar timestamp
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Trigger para generar número de orden automáticamente
    DROP TRIGGER IF EXISTS trigger_generar_numero_orden ON orden_trabajo;
    CREATE TRIGGER trigger_generar_numero_orden
      BEFORE INSERT ON orden_trabajo
      FOR EACH ROW
      WHEN (NEW.numero_orden IS NULL OR NEW.numero_orden = '')
      EXECUTE FUNCTION generar_numero_orden();
    
    -- Trigger para actualizar timestamp en orden_trabajo
    DROP TRIGGER IF EXISTS trigger_update_orden_trabajo_updated_at ON orden_trabajo;
    CREATE TRIGGER trigger_update_orden_trabajo_updated_at
      BEFORE UPDATE ON orden_trabajo
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    
    -- Trigger para actualizar timestamp en detalle_orden_trabajo
    DROP TRIGGER IF EXISTS trigger_update_detalle_orden_trabajo_updated_at ON detalle_orden_trabajo;
    CREATE TRIGGER trigger_update_detalle_orden_trabajo_updated_at
      BEFORE UPDATE ON detalle_orden_trabajo
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    -- Eliminar triggers
    DROP TRIGGER IF EXISTS trigger_generar_numero_orden ON orden_trabajo;
    DROP TRIGGER IF EXISTS trigger_update_orden_trabajo_updated_at ON orden_trabajo;
    DROP TRIGGER IF EXISTS trigger_update_detalle_orden_trabajo_updated_at ON detalle_orden_trabajo;
    
    -- Eliminar funciones
    DROP FUNCTION IF EXISTS generar_numero_orden();
    DROP FUNCTION IF EXISTS update_updated_at_column();
    
    -- Eliminar secuencia
    DROP SEQUENCE IF EXISTS orden_trabajo_numero_seq;
  `);
};
