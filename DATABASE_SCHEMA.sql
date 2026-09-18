/**
 * SERMA - Esquema de Base de Datos PostgreSQL
 * Define todas las tablas, índices y relaciones
 * Nota: La autenticación se mantiene en Firebase Auth
 */

-- =====================================================
-- 1. TABLA: COURSES (Cursos)
-- =====================================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  grade VARCHAR(2) NOT NULL CHECK (grade IN ('6', '7', '8', '9', '10', '11')),
  academic_year INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, academic_year)
);

-- Índices para courses
CREATE INDEX idx_courses_academic_year ON courses(academic_year);
CREATE INDEX idx_courses_grade ON courses(grade);
CREATE INDEX idx_courses_name_academic_year ON courses(name, academic_year);

-- =====================================================
-- 2. TABLA: STUDENTS (Estudiantes)
-- =====================================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(150) NOT NULL,
  document_id VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  grade VARCHAR(2) NOT NULL CHECK (grade IN ('6', '7', '8', '9', '10', '11')),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para students
CREATE INDEX idx_students_document_id ON students(document_id);
CREATE INDEX idx_students_course_id ON students(course_id);
CREATE INDEX idx_students_grade ON students(grade);
CREATE INDEX idx_students_email ON students(email);

-- =====================================================
-- 3. TABLA: TEACHERS (Profesores)
-- =====================================================
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(150) NOT NULL,
  document_id VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(15) NOT NULL,
  specialization VARCHAR(100),
  firebase_uid VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para teachers
CREATE INDEX idx_teachers_document_id ON teachers(document_id);
CREATE INDEX idx_teachers_email ON teachers(email);
CREATE INDEX idx_teachers_firebase_uid ON teachers(firebase_uid);

-- =====================================================
-- 4. TABLA: SUBJECTS (Materias)
-- =====================================================
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, course_id)
);

-- Índices para subjects
CREATE INDEX idx_subjects_course_id ON subjects(course_id);
CREATE INDEX idx_subjects_teacher_id ON subjects(teacher_id);
CREATE INDEX idx_subjects_name_course_id ON subjects(name, course_id);

-- =====================================================
-- 5. TABLA: AVANCES (Avances Académicos)
-- =====================================================
CREATE TABLE avances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  progress DECIMAL(5, 2) NOT NULL CHECK (progress >= 0 AND progress <= 100),
  average DECIMAL(5, 2) NOT NULL CHECK (average >= 0 AND average <= 100),
  comments TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para avances
CREATE INDEX idx_avances_student_id ON avances(student_id);
CREATE INDEX idx_avances_subject_id ON avances(subject_id);
CREATE INDEX idx_avances_teacher_id ON avances(teacher_id);
CREATE INDEX idx_avances_course_id ON avances(course_id);
CREATE INDEX idx_avances_student_subject ON avances(student_id, subject_id);
CREATE INDEX idx_avances_date ON avances(date);

-- =====================================================
-- 6. TABLA: GUARDIANS (Acudientes - Relación Usuario-Estudiante)
-- =====================================================
CREATE TABLE guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid VARCHAR(255) NOT NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relationship VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para guardians
CREATE INDEX idx_guardians_auth_uid ON guardians(auth_uid);
CREATE INDEX idx_guardians_student_id ON guardians(student_id);
CREATE UNIQUE INDEX idx_guardians_auth_student ON guardians(auth_uid, student_id);

-- =====================================================
-- 7. TABLA: USERS (Usuarios - Sincronización de Progreso)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cedula VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  last_name VARCHAR(150),
  grade VARCHAR(2) CHECK (grade IN ('6', '7', '8', '9', '10', '11')),
  subject_progress JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para users
CREATE INDEX idx_users_cedula ON users(cedula);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_grade ON users(grade);

-- =====================================================
-- 8. TABLA: AUDIT_LOG (Registro de Auditoría - Opcional)
-- =====================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL,
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  user_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para audit_log
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_operation ON audit_log(operation);

-- =====================================================
-- FUNCIONES DE ACTUALIZACIÓN AUTOMÁTICA (updated_at)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
CREATE TRIGGER courses_updated_at_trigger
BEFORE UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER students_updated_at_trigger
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER teachers_updated_at_trigger
BEFORE UPDATE ON teachers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER subjects_updated_at_trigger
BEFORE UPDATE ON subjects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER avances_updated_at_trigger
BEFORE UPDATE ON avances
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VALIDACIONES CON CONSTRAINTS
-- =====================================================

-- Validar que el email sea válido
ALTER TABLE students
ADD CONSTRAINT valid_student_email
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

ALTER TABLE teachers
ADD CONSTRAINT valid_teacher_email
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

ALTER TABLE users
ADD CONSTRAINT valid_user_email
CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista: Estudiantes con información de curso
CREATE VIEW students_with_courses AS
SELECT 
  s.id,
  s.first_name,
  s.last_name,
  s.document_id,
  s.email,
  s.phone,
  s.grade,
  c.id as course_id,
  c.name as course_name,
  c.academic_year
FROM students s
LEFT JOIN courses c ON s.course_id = c.id;

-- Vista: Materias con información de docente y curso
CREATE VIEW subjects_with_details AS
SELECT 
  s.id,
  s.name as subject_name,
  c.id as course_id,
  c.name as course_name,
  c.grade,
  t.id as teacher_id,
  CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
  t.email as teacher_email
FROM subjects s
LEFT JOIN courses c ON s.course_id = c.id
LEFT JOIN teachers t ON s.teacher_id = t.id;

-- Vista: Avances de estudiantes
CREATE VIEW student_avances_summary AS
SELECT 
  a.id,
  s.id as student_id,
  CONCAT(s.first_name, ' ', s.last_name) as student_name,
  sub.id as subject_id,
  sub.name as subject_name,
  t.id as teacher_id,
  CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
  a.progress,
  a.average,
  a.comments,
  a.date,
  a.created_at,
  a.updated_at
FROM avances a
LEFT JOIN students s ON a.student_id = s.id
LEFT JOIN subjects sub ON a.subject_id = sub.id
LEFT JOIN teachers t ON a.teacher_id = t.id
ORDER BY a.date DESC;

-- Vista: Promedio de estudiantes por materia
CREATE VIEW student_subject_average AS
SELECT 
  s.id as student_id,
  CONCAT(s.first_name, ' ', s.last_name) as student_name,
  sub.id as subject_id,
  sub.name as subject_name,
  ROUND(AVG(a.progress), 2) as average_progress,
  COUNT(a.id) as total_records
FROM students s
LEFT JOIN avances a ON s.id = a.student_id
LEFT JOIN subjects sub ON a.subject_id = sub.id
GROUP BY s.id, s.first_name, s.last_name, sub.id, sub.name;

-- =====================================================
-- DATOS DE PRUEBA (Opcional)
-- =====================================================
-- Descomentar para cargar datos de ejemplo

/*
-- Insertar cursos de prueba
INSERT INTO courses (name, grade, academic_year, description) VALUES
('6-A', '6', 2025, 'Curso sexto A - Jornada matutina'),
('6-B', '6', 2025, 'Curso sexto B - Jornada vespertina'),
('7-A', '7', 2025, 'Curso séptimo A'),
('8-A', '8', 2025, 'Curso octavo A');

-- Insertar profesores de prueba
INSERT INTO teachers (first_name, last_name, document_id, email, phone, specialization) VALUES
('Pedro', 'González', '9876543210', 'pedro@email.com', '3001234567', 'Matemáticas'),
('María', 'López', '9876543211', 'maria@email.com', '3001234568', 'Lenguaje'),
('Carlos', 'Rodríguez', '9876543212', 'carlos@email.com', '3001234569', 'Ciencias');

-- Insertar estudiantes de prueba (después de obtener los IDs de cursos)
INSERT INTO students (first_name, last_name, document_id, email, phone, grade, course_id) VALUES
('Juan', 'Pérez', '1234567890', 'juan@email.com', '3101234567', '6', (SELECT id FROM courses WHERE name = '6-A')),
('María', 'González', '1234567891', 'maria.g@email.com', '3101234568', '6', (SELECT id FROM courses WHERE name = '6-A'));
*/

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE courses IS 'Almacena información de los cursos/grados académicos';
COMMENT ON TABLE students IS 'Información personal y académica de los estudiantes';
COMMENT ON TABLE teachers IS 'Información de los docentes (vinculados con Firebase Auth)';
COMMENT ON TABLE subjects IS 'Materias/asignaturas ofrecidas en los cursos';
COMMENT ON TABLE avances IS 'Registros de progreso académico de estudiantes';
COMMENT ON TABLE guardians IS 'Relaciones entre usuarios autenticados y estudiantes';
COMMENT ON TABLE users IS 'Usuarios del sistema con progreso sincronizado';
COMMENT ON TABLE audit_log IS 'Registro de auditoría de cambios en la base de datos';
