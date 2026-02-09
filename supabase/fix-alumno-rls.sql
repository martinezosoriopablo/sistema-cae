-- =============================================
-- FIX: Permitir que alumnos vean su propio registro
-- =============================================

-- Eliminar política anterior de alumnos select
DROP POLICY IF EXISTS "alumnos_select_vendedor" ON alumnos;

-- Crear nueva política que incluye al alumno mismo
CREATE POLICY "alumnos_select" ON alumnos
  FOR SELECT USING (
    user_id = auth.uid() OR           -- Alumno puede ver su propio registro
    vendedor_id = auth.uid() OR       -- Vendedor puede ver sus alumnos
    public.is_admin() OR              -- Admin puede ver todos
    public.is_profesor()              -- Profesor puede ver todos
  );

-- También actualizar la política de horarios para que el alumno pueda ver sus propios horarios
DROP POLICY IF EXISTS "horarios_select" ON horarios_alumnos;

CREATE POLICY "horarios_select" ON horarios_alumnos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM alumnos a
      WHERE a.id = horarios_alumnos.alumno_id
      AND (
        a.vendedor_id = auth.uid() OR
        a.user_id = auth.uid()        -- Alumno puede ver sus propios horarios
      )
    ) OR
    public.is_admin() OR
    public.is_profesor()
  );
