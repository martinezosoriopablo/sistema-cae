-- Agregar campo super_admin a usuarios
ALTER TABLE usuarios ADD COLUMN super_admin BOOLEAN NOT NULL DEFAULT FALSE;
