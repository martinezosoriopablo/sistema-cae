-- =============================================
-- Agregar CHECK constraints para prevenir valores negativos
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Alumnos: horas no pueden ser negativas
ALTER TABLE alumnos
  ADD CONSTRAINT chk_alumnos_horas_contratadas CHECK (horas_contratadas >= 0),
  ADD CONSTRAINT chk_alumnos_horas_restantes CHECK (horas_restantes >= 0);

-- Horarios: duración debe ser positiva
ALTER TABLE horarios_alumnos
  ADD CONSTRAINT chk_horarios_duracion_positiva CHECK (duracion_minutos > 0),
  ADD CONSTRAINT chk_horarios_fin_despues_inicio CHECK (hora_fin > hora_inicio);

-- Clases: duración debe ser positiva
ALTER TABLE clases
  ADD CONSTRAINT chk_clases_duracion_positiva CHECK (duracion_minutos > 0),
  ADD CONSTRAINT chk_clases_fin_despues_inicio CHECK (hora_fin > hora_inicio);

-- Pagos: monto y horas deben ser positivos
ALTER TABLE pagos
  ADD CONSTRAINT chk_pagos_monto_positivo CHECK (monto > 0),
  ADD CONSTRAINT chk_pagos_horas_positivas CHECK (horas_compradas > 0);
