-- =============================================
-- FIX: Políticas RLS con recursión infinita
-- =============================================

-- Primero, crear una función SECURITY DEFINER que pueda consultar
-- el rol del usuario sin activar las políticas RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS rol_usuario
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT rol FROM usuarios WHERE id = user_id;
$$;

-- Función helper para verificar si es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND rol = 'admin'
  );
$$;

-- Función helper para verificar si es vendedor
CREATE OR REPLACE FUNCTION public.is_vendedor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND rol = 'vendedor'
  );
$$;

-- Función helper para verificar si es profesor
CREATE OR REPLACE FUNCTION public.is_profesor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM usuarios
    WHERE id = auth.uid() AND rol = 'profesor'
  );
$$;

-- =============================================
-- ELIMINAR POLÍTICAS ANTERIORES
-- =============================================

-- Usuarios
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON usuarios;
DROP POLICY IF EXISTS "Admin puede ver todos los usuarios" ON usuarios;

-- Profesores
DROP POLICY IF EXISTS "Cualquier autenticado puede ver profesores" ON profesores;
DROP POLICY IF EXISTS "Admin puede gestionar profesores" ON profesores;

-- Alumnos
DROP POLICY IF EXISTS "Vendedores ven sus alumnos" ON alumnos;
DROP POLICY IF EXISTS "Admin y vendedor pueden crear alumnos" ON alumnos;
DROP POLICY IF EXISTS "Admin puede actualizar alumnos" ON alumnos;

-- Horarios
DROP POLICY IF EXISTS "Ver horarios de alumnos relacionados" ON horarios_alumnos;

-- Clases
DROP POLICY IF EXISTS "Ver clases relacionadas" ON clases;
DROP POLICY IF EXISTS "Profesor puede actualizar sus clases" ON clases;

-- Alertas
DROP POLICY IF EXISTS "Ver alertas propias" ON alertas;
DROP POLICY IF EXISTS "Admin puede gestionar alertas" ON alertas;

-- Materiales
DROP POLICY IF EXISTS "Cualquier autenticado puede ver materiales" ON materiales;
DROP POLICY IF EXISTS "Admin puede gestionar materiales" ON materiales;

-- Pagos
DROP POLICY IF EXISTS "Ver pagos relacionados" ON pagos;

-- =============================================
-- NUEVAS POLÍTICAS CORREGIDAS
-- =============================================

-- USUARIOS
CREATE POLICY "usuarios_select_own" ON usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "usuarios_select_admin" ON usuarios
  FOR SELECT USING (public.is_admin());

CREATE POLICY "usuarios_insert_admin" ON usuarios
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "usuarios_update_admin" ON usuarios
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "usuarios_delete_admin" ON usuarios
  FOR DELETE USING (public.is_admin());

-- PROFESORES
CREATE POLICY "profesores_select_authenticated" ON profesores
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "profesores_insert_admin" ON profesores
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "profesores_update_admin" ON profesores
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "profesores_delete_admin" ON profesores
  FOR DELETE USING (public.is_admin());

-- ALUMNOS
CREATE POLICY "alumnos_select_vendedor" ON alumnos
  FOR SELECT USING (
    vendedor_id = auth.uid() OR
    public.is_admin() OR
    public.is_profesor()
  );

CREATE POLICY "alumnos_insert" ON alumnos
  FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_vendedor()
  );

CREATE POLICY "alumnos_update_admin" ON alumnos
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "alumnos_delete_admin" ON alumnos
  FOR DELETE USING (public.is_admin());

-- HORARIOS ALUMNOS
CREATE POLICY "horarios_select" ON horarios_alumnos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM alumnos a
      WHERE a.id = horarios_alumnos.alumno_id
      AND (a.vendedor_id = auth.uid() OR a.user_id = auth.uid())
    ) OR
    public.is_admin() OR
    public.is_profesor()
  );

CREATE POLICY "horarios_insert" ON horarios_alumnos
  FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_vendedor()
  );

CREATE POLICY "horarios_update_admin" ON horarios_alumnos
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "horarios_delete_admin" ON horarios_alumnos
  FOR DELETE USING (public.is_admin());

-- CAMBIOS TRANSITORIOS
CREATE POLICY "cambios_select" ON cambios_transitorios
  FOR SELECT USING (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM alumnos a
      WHERE a.id = cambios_transitorios.alumno_id
      AND (a.vendedor_id = auth.uid() OR a.user_id = auth.uid())
    )
  );

CREATE POLICY "cambios_insert" ON cambios_transitorios
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "cambios_update_admin" ON cambios_transitorios
  FOR UPDATE USING (public.is_admin());

-- CLASES
CREATE POLICY "clases_select" ON clases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM alumnos WHERE id = clases.alumno_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profesores WHERE id = clases.profesor_id AND user_id = auth.uid()) OR
    public.is_admin()
  );

CREATE POLICY "clases_insert" ON clases
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "clases_update" ON clases
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profesores WHERE id = clases.profesor_id AND user_id = auth.uid()) OR
    public.is_admin()
  );

CREATE POLICY "clases_delete_admin" ON clases
  FOR DELETE USING (public.is_admin());

-- ALERTAS
CREATE POLICY "alertas_select_own" ON alertas
  FOR SELECT USING (destinatario_id = auth.uid());

CREATE POLICY "alertas_select_admin" ON alertas
  FOR SELECT USING (public.is_admin());

CREATE POLICY "alertas_insert_admin" ON alertas
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "alertas_update" ON alertas
  FOR UPDATE USING (
    destinatario_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "alertas_delete_admin" ON alertas
  FOR DELETE USING (public.is_admin());

-- MATERIALES
CREATE POLICY "materiales_select_authenticated" ON materiales
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "materiales_insert_admin" ON materiales
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "materiales_update_admin" ON materiales
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "materiales_delete_admin" ON materiales
  FOR DELETE USING (public.is_admin());

-- PAGOS
CREATE POLICY "pagos_select" ON pagos
  FOR SELECT USING (
    vendedor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM alumnos WHERE id = pagos.alumno_id AND user_id = auth.uid()) OR
    public.is_admin()
  );

CREATE POLICY "pagos_insert" ON pagos
  FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_vendedor()
  );

CREATE POLICY "pagos_update_admin" ON pagos
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "pagos_delete_admin" ON pagos
  FOR DELETE USING (public.is_admin());

-- =============================================
-- GRANT EXECUTE en funciones helper
-- =============================================
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_vendedor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_profesor() TO authenticated;
