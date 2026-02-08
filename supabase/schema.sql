-- =============================================
-- SISTEMA CAE - TalkChile
-- Script de creación de base de datos
-- =============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos ENUM
CREATE TYPE rol_usuario AS ENUM ('admin', 'vendedor', 'profesor', 'alumno');
CREATE TYPE nivel_mcer AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
CREATE TYPE estado_clase AS ENUM ('programada', 'completada', 'cancelada', 'no_asistio');
CREATE TYPE dia_semana AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');
CREATE TYPE tipo_alerta AS ENUM ('pocas_horas', 'sin_profesor', 'clase_perdida');
CREATE TYPE tipo_material AS ENUM ('documento', 'video', 'audio', 'ejercicio');

-- Tabla de usuarios (extiende auth.users)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  rol rol_usuario NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de profesores
CREATE TABLE profesores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT,
  especialidades nivel_mcer[] DEFAULT '{}',
  zoom_link TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de alumnos
CREATE TABLE alumnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefono TEXT NOT NULL,
  rut TEXT,
  nivel_actual nivel_mcer NOT NULL DEFAULT 'A1',
  horas_contratadas NUMERIC(6,2) NOT NULL DEFAULT 0,
  horas_restantes NUMERIC(6,2) NOT NULL DEFAULT 0,
  profesor_id UUID REFERENCES profesores(id) ON DELETE SET NULL,
  vendedor_id UUID NOT NULL REFERENCES usuarios(id),
  bloqueado BOOLEAN DEFAULT FALSE,
  motivo_bloqueo TEXT,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin_estimada DATE,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de horarios de alumnos
CREATE TABLE horarios_alumnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  dia dia_semana NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion_minutos INTEGER NOT NULL DEFAULT 60,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de cambios transitorios de horario
CREATE TABLE cambios_transitorios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  fecha_original DATE NOT NULL,
  fecha_nueva DATE NOT NULL,
  hora_nueva TIME NOT NULL,
  motivo TEXT,
  aprobado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de clases
CREATE TABLE clases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  profesor_id UUID NOT NULL REFERENCES profesores(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion_minutos INTEGER NOT NULL DEFAULT 60,
  estado estado_clase NOT NULL DEFAULT 'programada',
  notas_profesor TEXT,
  zoom_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de alertas
CREATE TABLE alertas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  tipo tipo_alerta NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  destinatario_id UUID NOT NULL REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de materiales
CREATE TABLE materiales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  nivel nivel_mcer NOT NULL,
  tipo tipo_material NOT NULL DEFAULT 'documento',
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pagos
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  monto NUMERIC(10,2) NOT NULL,
  horas_compradas NUMERIC(6,2) NOT NULL,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  metodo_pago TEXT NOT NULL,
  comprobante_url TEXT,
  vendedor_id UUID NOT NULL REFERENCES usuarios(id),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_email ON usuarios(email);

CREATE INDEX idx_profesores_activo ON profesores(activo);
CREATE INDEX idx_profesores_user_id ON profesores(user_id);

CREATE INDEX idx_alumnos_vendedor ON alumnos(vendedor_id);
CREATE INDEX idx_alumnos_profesor ON alumnos(profesor_id);
CREATE INDEX idx_alumnos_bloqueado ON alumnos(bloqueado);
CREATE INDEX idx_alumnos_horas ON alumnos(horas_restantes);

CREATE INDEX idx_horarios_alumno ON horarios_alumnos(alumno_id);
CREATE INDEX idx_horarios_dia ON horarios_alumnos(dia);

CREATE INDEX idx_clases_alumno ON clases(alumno_id);
CREATE INDEX idx_clases_profesor ON clases(profesor_id);
CREATE INDEX idx_clases_fecha ON clases(fecha);
CREATE INDEX idx_clases_estado ON clases(estado);

CREATE INDEX idx_alertas_destinatario ON alertas(destinatario_id);
CREATE INDEX idx_alertas_leida ON alertas(leida);
CREATE INDEX idx_alertas_alumno ON alertas(alumno_id);

CREATE INDEX idx_materiales_nivel ON materiales(nivel);

CREATE INDEX idx_pagos_alumno ON pagos(alumno_id);
CREATE INDEX idx_pagos_vendedor ON pagos(vendedor_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cambios_transitorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clases ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE materiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Usuarios pueden ver su propio perfil" ON usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admin puede ver todos los usuarios" ON usuarios
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Políticas para profesores
CREATE POLICY "Cualquier autenticado puede ver profesores" ON profesores
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin puede gestionar profesores" ON profesores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Políticas para alumnos
CREATE POLICY "Vendedores ven sus alumnos" ON alumnos
  FOR SELECT USING (
    vendedor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'profesor'))
  );

CREATE POLICY "Admin y vendedor pueden crear alumnos" ON alumnos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'vendedor'))
  );

CREATE POLICY "Admin puede actualizar alumnos" ON alumnos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Políticas para horarios
CREATE POLICY "Ver horarios de alumnos relacionados" ON horarios_alumnos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM alumnos a
      WHERE a.id = horarios_alumnos.alumno_id
      AND (a.vendedor_id = auth.uid() OR a.user_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol IN ('admin', 'profesor'))
  );

-- Políticas para clases
CREATE POLICY "Ver clases relacionadas" ON clases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM alumnos WHERE id = clases.alumno_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profesores WHERE id = clases.profesor_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Profesor puede actualizar sus clases" ON clases
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profesores WHERE id = clases.profesor_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Políticas para alertas
CREATE POLICY "Ver alertas propias" ON alertas
  FOR SELECT USING (destinatario_id = auth.uid());

CREATE POLICY "Admin puede gestionar alertas" ON alertas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Políticas para materiales
CREATE POLICY "Cualquier autenticado puede ver materiales" ON materiales
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin puede gestionar materiales" ON materiales
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- Políticas para pagos
CREATE POLICY "Ver pagos relacionados" ON pagos
  FOR SELECT USING (
    vendedor_id = auth.uid() OR
    EXISTS (SELECT 1 FROM alumnos WHERE id = pagos.alumno_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profesores_updated_at
  BEFORE UPDATE ON profesores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alumnos_updated_at
  BEFORE UPDATE ON alumnos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clases_updated_at
  BEFORE UPDATE ON clases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATOS INICIALES (opcional)
-- =============================================

-- Insertar materiales de ejemplo
INSERT INTO materiales (titulo, descripcion, nivel, tipo, url) VALUES
('Vocabulario Básico A1', 'Lista de vocabulario esencial para nivel principiante', 'A1', 'documento', 'https://ejemplo.com/vocab-a1.pdf'),
('Pronunciación Básica', 'Video tutorial de pronunciación', 'A1', 'video', 'https://ejemplo.com/pronun-a1'),
('Ejercicios A1', 'Ejercicios de práctica nivel A1', 'A1', 'ejercicio', 'https://ejemplo.com/ejercicios-a1'),
('Gramática A2', 'Guía de gramática nivel elemental', 'A2', 'documento', 'https://ejemplo.com/gram-a2.pdf'),
('Listening B1', 'Ejercicios de comprensión auditiva', 'B1', 'audio', 'https://ejemplo.com/listening-b1'),
('Business English B2', 'Inglés para negocios', 'B2', 'documento', 'https://ejemplo.com/business-b2.pdf');
