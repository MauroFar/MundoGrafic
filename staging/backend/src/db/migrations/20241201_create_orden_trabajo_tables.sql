-- Crear tabla principal de orden de trabajo
CREATE TABLE IF NOT EXISTS orden_trabajo (
  id SERIAL PRIMARY KEY,
  numero_orden VARCHAR(20) UNIQUE NOT NULL,
  nombre_cliente VARCHAR(255) NOT NULL,
  contacto TEXT,
  email VARCHAR(255),
  telefono VARCHAR(50),
  cantidad INTEGER,
  concepto TEXT,
  fecha_creacion DATE DEFAULT CURRENT_DATE,
  fecha_entrega DATE,
  estado VARCHAR(50) DEFAULT 'pendiente',
  notas_observaciones TEXT,
  vendedor VARCHAR(100),
  preprensa VARCHAR(100),
  prensa VARCHAR(100),
  terminados VARCHAR(100),
  facturado VARCHAR(10),
  id_cotizacion INTEGER,
  id_detalle_cotizacion INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de detalle técnico de orden de trabajo
CREATE TABLE IF NOT EXISTS detalle_orden_trabajo (
  id SERIAL PRIMARY KEY,
  orden_trabajo_id INTEGER NOT NULL,
  
  -- Tipo de Papel
  tipo_papel_proveedor VARCHAR(100),
  tipo_papel_prensa VARCHAR(100),
  tipo_papel_velocidad VARCHAR(50),
  tipo_papel_calibre VARCHAR(50),
  tipo_papel_referencia VARCHAR(100),
  tipo_papel_gramos VARCHAR(50),
  tipo_papel_tamano VARCHAR(100),
  tipo_papel_cant_colores VARCHAR(50),
  tipo_papel_cant_pliegos VARCHAR(50),
  tipo_papel_exceso VARCHAR(50),
  
  -- Guillotina
  guillotina_pliegos_cortar VARCHAR(50),
  guillotina_tamano_corte VARCHAR(100),
  guillotina_cabida_corte VARCHAR(50),
  
  -- Prensas
  prensas_pliegos_imprimir VARCHAR(50),
  prensas_cabida_impresion VARCHAR(50),
  prensas_total_impresion VARCHAR(50),
  
  -- Campos adicionales para información del trabajo
  tamano_abierto VARCHAR(100),
  paginas_portada VARCHAR(50),
  tamano_cerrado VARCHAR(100),
  paginas_interiores VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (orden_trabajo_id) REFERENCES orden_trabajo(id) ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_orden_trabajo_numero_orden ON orden_trabajo(numero_orden);
CREATE INDEX IF NOT EXISTS idx_orden_trabajo_cliente ON orden_trabajo(nombre_cliente);
CREATE INDEX IF NOT EXISTS idx_orden_trabajo_fecha_creacion ON orden_trabajo(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_orden_trabajo_estado ON orden_trabajo(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_orden_trabajo_id ON detalle_orden_trabajo(orden_trabajo_id);

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

-- Trigger para generar número de orden automáticamente
DROP TRIGGER IF EXISTS trigger_generar_numero_orden ON orden_trabajo;
CREATE TRIGGER trigger_generar_numero_orden
  BEFORE INSERT ON orden_trabajo
  FOR EACH ROW
  WHEN (NEW.numero_orden IS NULL OR NEW.numero_orden = '')
  EXECUTE FUNCTION generar_numero_orden();

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar timestamps
DROP TRIGGER IF EXISTS trigger_update_orden_trabajo_updated_at ON orden_trabajo;
CREATE TRIGGER trigger_update_orden_trabajo_updated_at
  BEFORE UPDATE ON orden_trabajo
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_detalle_orden_trabajo_updated_at ON detalle_orden_trabajo;
CREATE TRIGGER trigger_update_detalle_orden_trabajo_updated_at
  BEFORE UPDATE ON detalle_orden_trabajo
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
