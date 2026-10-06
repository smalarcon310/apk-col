USE serma_db;

-- Ejecutar una sola vez para guardar el teléfono del padre de familia.
ALTER TABLE users ADD COLUMN phone VARCHAR(15) NULL;
