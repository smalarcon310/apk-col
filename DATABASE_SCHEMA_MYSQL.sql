CREATE DATABASE IF NOT EXISTS serma_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE serma_db;

CREATE TABLE IF NOT EXISTS courses (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  grade ENUM('6','7','8','9','10','11') NOT NULL,
  academic_year YEAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_courses_name_year (name, academic_year), KEY idx_courses_grade (grade)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS teachers (
  id CHAR(36) PRIMARY KEY, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(150) NOT NULL,
  document_id VARCHAR(20) NOT NULL UNIQUE, email VARCHAR(255) NOT NULL UNIQUE, phone VARCHAR(15) NOT NULL,
  specialization VARCHAR(100), firebase_uid VARCHAR(255) UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  id CHAR(36) PRIMARY KEY, first_name VARCHAR(100) NOT NULL, last_name VARCHAR(150) NOT NULL,
  document_id VARCHAR(20) NOT NULL UNIQUE, email VARCHAR(255) NOT NULL, phone VARCHAR(15) NOT NULL,
  grade ENUM('6','7','8','9','10','11') NOT NULL, course_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_students_course FOREIGN KEY (course_id) REFERENCES courses(id), KEY idx_students_course (course_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subjects (
  id CHAR(36) PRIMARY KEY, name VARCHAR(150) NOT NULL, course_id CHAR(36) NOT NULL, teacher_id CHAR(36) NOT NULL,
  description TEXT, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_subject_course (name, course_id),
  CONSTRAINT fk_subject_course FOREIGN KEY (course_id) REFERENCES courses(id),
  CONSTRAINT fk_subject_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS avances (
  id CHAR(36) PRIMARY KEY, student_id CHAR(36) NOT NULL, subject_id CHAR(36) NOT NULL,
  teacher_id CHAR(36) NOT NULL, course_id CHAR(36) NOT NULL, progress DECIMAL(5,2) NOT NULL,
  average DECIMAL(5,2) NOT NULL, comments TEXT, date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_avances_progress CHECK (progress BETWEEN 0 AND 100),
  CONSTRAINT chk_avances_average CHECK (average BETWEEN 0 AND 100),
  CONSTRAINT fk_avances_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_avances_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_avances_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id),
  CONSTRAINT fk_avances_course FOREIGN KEY (course_id) REFERENCES courses(id),
  KEY idx_avances_student_date (student_id, date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS guardians (
  id CHAR(36) PRIMARY KEY, auth_uid VARCHAR(255) NOT NULL, student_id CHAR(36) NOT NULL,
  relationship VARCHAR(50), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_guardian_student (auth_uid, student_id),
  CONSTRAINT fk_guardian_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY, cedula VARCHAR(20) NOT NULL UNIQUE, email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL, last_name VARCHAR(150), password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','guardian','teacher','rector') NOT NULL DEFAULT 'student',
  grade ENUM('6','7','8','9','10','11'), subject_progress JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_log (
  id CHAR(36) PRIMARY KEY, table_name VARCHAR(100) NOT NULL,
  operation ENUM('INSERT','UPDATE','DELETE') NOT NULL, record_id CHAR(36), old_data JSON, new_data JSON,
  user_id VARCHAR(255), created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_table_date (table_name, created_at)
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW students_with_courses AS
SELECT s.id, s.first_name, s.last_name, s.document_id, s.email, s.phone, s.grade,
       c.id AS course_id, c.name AS course_name, c.academic_year
FROM students s LEFT JOIN courses c ON c.id = s.course_id;

CREATE OR REPLACE VIEW student_avances_summary AS
SELECT a.id, s.id AS student_id, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
       sub.id AS subject_id, sub.name AS subject_name, t.id AS teacher_id,
       CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
       a.progress, a.average, a.comments, a.date, a.created_at, a.updated_at
FROM avances a LEFT JOIN students s ON s.id = a.student_id
LEFT JOIN subjects sub ON sub.id = a.subject_id LEFT JOIN teachers t ON t.id = a.teacher_id;
