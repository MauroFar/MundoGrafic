-- Crear tabla para reportes de trabajo diario
CREATE TABLE IF NOT EXISTS reportes_trabajo_diario (
  id SERIAL PRIMARY KEY,
  area VARCHAR(100) NOT NULL,
  operador VARCHAR(150),
  proceso TEXT NOT NULL,
  inicio TIME NOT NULL,
  fin TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_reportes_area ON reportes_trabajo_diario(area);
CREATE INDEX IF NOT EXISTS idx_reportes_operador ON reportes_trabajo_diario(operador);
CREATE INDEX IF NOT EXISTS idx_reportes_created_at ON reportes_trabajo_diario(created_at);

