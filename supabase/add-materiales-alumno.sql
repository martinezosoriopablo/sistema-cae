-- =============================================
-- MIGRACIÓN: Materiales por Alumno
-- Permite a profesores subir material específico para cada alumno
-- =============================================

-- Tabla de materiales por alumno
CREATE TABLE materiales_alumno (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  profesor_id UUID NOT NULL REFERENCES profesores(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo tipo_material NOT NULL DEFAULT 'documento',
  url TEXT NOT NULL,
  es_archivo BOOLEAN NOT NULL DEFAULT FALSE,
  archivo_nombre TEXT,
  archivo_tamano INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_materiales_alumno_alumno ON materiales_alumno(alumno_id);
CREATE INDEX idx_materiales_alumno_profesor ON materiales_alumno(profesor_id);

-- RLS
ALTER TABLE materiales_alumno ENABLE ROW LEVEL SECURITY;

-- Profesor puede gestionar sus propios materiales
CREATE POLICY "Profesor gestiona sus materiales" ON materiales_alumno
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profesores WHERE id = materiales_alumno.profesor_id AND user_id = auth.uid())
  );

-- Alumno puede ver sus materiales
CREATE POLICY "Alumno ve sus materiales" ON materiales_alumno
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM alumnos WHERE id = materiales_alumno.alumno_id AND user_id = auth.uid())
  );

-- Admin puede gestionar todo
CREATE POLICY "Admin gestiona todos los materiales de alumno" ON materiales_alumno
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- STORAGE: Bucket para materiales de alumnos
-- Nota: Crear el bucket 'materiales-alumnos' desde el Dashboard de Supabase
-- como bucket PRIVADO. Las políticas de storage se configuran ahí.
-- Path de archivos: {profesor_id}/{alumno_id}/{uuid}-{filename}
-- =============================================
