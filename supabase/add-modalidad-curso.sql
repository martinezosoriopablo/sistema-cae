-- =============================================
-- Migración: Agregar modalidad de curso
-- =============================================

-- Crear enum para modalidad de curso
CREATE TYPE modalidad_curso AS ENUM ('privado', 'livemode', 'kids', 'presencial', 'espanol', 'nativo');

-- Agregar columna modalidad a la tabla alumnos
ALTER TABLE alumnos ADD COLUMN modalidad modalidad_curso NOT NULL DEFAULT 'privado';

-- Agregar columna tarifa_hora a la tabla pagos (tarifa usada en el momento del pago)
ALTER TABLE pagos ADD COLUMN tarifa_hora NUMERIC(10,2);

-- Índice para consultas por modalidad
CREATE INDEX idx_alumnos_modalidad ON alumnos(modalidad);
