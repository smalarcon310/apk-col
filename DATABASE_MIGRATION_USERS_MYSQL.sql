USE serma_db;

ALTER TABLE users
  ADD COLUMN password_hash VARCHAR(255) NULL,
  ADD COLUMN role ENUM('student','guardian','teacher','rector') NOT NULL DEFAULT 'student';

-- Después de ejecutar este archivo, asigna el rector desde MySQL:
-- UPDATE users SET role = 'rector' WHERE email = 'correo-del-rector@dominio.com';
