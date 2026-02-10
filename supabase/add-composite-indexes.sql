-- =============================================
-- Agregar índices compuestos para optimizar queries frecuentes
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Clases por alumno y fecha (usado al generar clases y verificar duplicados)
CREATE INDEX IF NOT EXISTS idx_clases_alumno_fecha ON clases(alumno_id, fecha);

-- Clases por fecha y estado (usado en cron de recordatorios)
CREATE INDEX IF NOT EXISTS idx_clases_fecha_estado ON clases(fecha, estado);

-- Alumnos activos por vendedor (usado en panel vendedor)
CREATE INDEX IF NOT EXISTS idx_alumnos_vendedor_bloqueado ON alumnos(vendedor_id, bloqueado);

-- Horarios activos por alumno (usado al generar clases)
CREATE INDEX IF NOT EXISTS idx_horarios_alumno_activo ON horarios_alumnos(alumno_id, activo);

-- Alertas no leídas por destinatario (usado en panel vendedor)
CREATE INDEX IF NOT EXISTS idx_alertas_destinatario_leida ON alertas(destinatario_id, leida);
