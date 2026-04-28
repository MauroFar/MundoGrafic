-- Agrega campo para guardar motivo de rechazo en cotizaciones
ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;
