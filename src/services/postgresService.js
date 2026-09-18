/**
 * SERMA - Servicio PostgreSQL (Versión simplificada)
 * Usar como referencia o adaptarlo a tus necesidades
 */

import pg from 'pg';

const { Pool } = pg;

// Crear pool de conexiones
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'serma_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Error en conexión PostgreSQL:', err);
});

// ==================== STUDENTS ====================

export const createStudent = async (studentData) => {
  const { firstName, lastName, documentId, email, phone, grade, courseId } = studentData;
  
  const query = `
    INSERT INTO students 
    (first_name, last_name, document_id, email, phone, grade, course_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, first_name, last_name, document_id, email, phone, grade, course_id, created_at, updated_at
  `;

  try {
    const result = await pool.query(query, [firstName, lastName, documentId, email, phone, grade, courseId]);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new Error(`El documento ${documentId} ya existe`);
    }
    throw error;
  }
};

export const getAllStudents = async () => {
  const query = `
    SELECT s.id, s.first_name, s.last_name, s.document_id, s.email, s.phone, 
           s.grade, c.id as course_id, c.name as course_name, c.academic_year
    FROM students s
    LEFT JOIN courses c ON s.course_id = c.id
    ORDER BY s.first_name ASC
  `;

  const result = await pool.query(query);
  return result.rows.map(row => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    documentId: row.document_id,
    email: row.email,
    phone: row.phone,
    grade: row.grade,
    courseId: row.course_id,
    courseName: row.course_name,
    academicYear: row.academic_year,
  }));
};

export const getStudentById = async (studentId) => {
  const query = `
    SELECT s.id, s.first_name, s.last_name, s.document_id, s.email, s.phone, 
           s.grade, c.id as course_id, c.name as course_name
    FROM students s
    LEFT JOIN courses c ON s.course_id = c.id
    WHERE s.id = $1
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows[0];
};

export const updateStudent = async (studentId, studentData) => {
  const { firstName, lastName, email, phone, grade, courseId } = studentData;
  
  const query = `
    UPDATE students 
    SET first_name = $1, last_name = $2, email = $3, phone = $4, grade = $5, course_id = $6
    WHERE id = $7
    RETURNING *
  `;

  const result = await pool.query(query, [firstName, lastName, email, phone, grade, courseId, studentId]);
  return result.rows[0];
};

export const deleteStudent = async (studentId) => {
  const query = 'DELETE FROM students WHERE id = $1 RETURNING id';
  const result = await pool.query(query, [studentId]);
  return result.rowCount > 0;
};

export const getStudentByDocument = async (documentId) => {
  const query = 'SELECT * FROM students WHERE document_id = $1';
  const result = await pool.query(query, [documentId]);
  return result.rows[0];
};

// ==================== COURSES ====================

export const createCourse = async (courseData) => {
  const { name, grade, academicYear, description } = courseData;
  
  const query = `
    INSERT INTO courses (name, grade, academic_year, description)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const result = await pool.query(query, [name, grade, academicYear, description]);
  return result.rows[0];
};

export const getAllCourses = async () => {
  const query = 'SELECT * FROM courses ORDER BY academic_year DESC, grade ASC';
  const result = await pool.query(query);
  return result.rows;
};

export const getCourseById = async (courseId) => {
  const query = 'SELECT * FROM courses WHERE id = $1';
  const result = await pool.query(query, [courseId]);
  return result.rows[0];
};

export const updateCourse = async (courseId, courseData) => {
  const { name, grade, academicYear, description } = courseData;
  
  const query = `
    UPDATE courses 
    SET name = $1, grade = $2, academic_year = $3, description = $4
    WHERE id = $5
    RETURNING *
  `;

  const result = await pool.query(query, [name, grade, academicYear, description, courseId]);
  return result.rows[0];
};

export const deleteCourse = async (courseId) => {
  const query = 'DELETE FROM courses WHERE id = $1 RETURNING id';
  const result = await pool.query(query, [courseId]);
  return result.rowCount > 0;
};

// ==================== SUBJECTS ====================

export const createSubject = async (subjectData) => {
  const { name, courseId, teacherId, description } = subjectData;
  
  const query = `
    INSERT INTO subjects (name, course_id, teacher_id, description)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const result = await pool.query(query, [name, courseId, teacherId, description]);
  return result.rows[0];
};

export const getAllSubjects = async () => {
  const query = `
    SELECT s.id, s.name, s.course_id, s.teacher_id, s.description,
           c.name as course_name, t.first_name, t.last_name, t.email
    FROM subjects s
    LEFT JOIN courses c ON s.course_id = c.id
    LEFT JOIN teachers t ON s.teacher_id = t.id
    ORDER BY c.name, s.name
  `;

  const result = await pool.query(query);
  return result.rows;
};

export const getSubjectsByTeacher = async (teacherId) => {
  const query = `
    SELECT s.id, s.name, s.course_id, s.description,
           c.name as course_name
    FROM subjects s
    LEFT JOIN courses c ON s.course_id = c.id
    WHERE s.teacher_id = $1
    ORDER BY c.name, s.name
  `;

  const result = await pool.query(query, [teacherId]);
  return result.rows;
};

// ==================== TEACHERS ====================

export const createTeacher = async (teacherData) => {
  const { firstName, lastName, documentId, email, phone, specialization } = teacherData;
  
  const query = `
    INSERT INTO teachers (first_name, last_name, document_id, email, phone, specialization)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  try {
    const result = await pool.query(query, [firstName, lastName, documentId, email, phone, specialization]);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new Error(`El documento o email ya existe`);
    }
    throw error;
  }
};

export const getAllTeachers = async () => {
  const query = 'SELECT * FROM teachers ORDER BY first_name';
  const result = await pool.query(query);
  return result.rows;
};

export const getTeacherById = async (teacherId) => {
  const query = 'SELECT * FROM teachers WHERE id = $1';
  const result = await pool.query(query, [teacherId]);
  return result.rows[0];
};

// ==================== AVANCES ====================

export const createAvance = async (avanceData) => {
  const { studentId, subjectId, teacherId, courseId, progress, comments } = avanceData;
  
  const average = Math.round(parseFloat(progress || 0) * 100) / 100;
  
  const query = `
    INSERT INTO avances 
    (student_id, subject_id, teacher_id, course_id, progress, average, comments, date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)
    RETURNING *
  `;

  const result = await pool.query(query, [studentId, subjectId, teacherId, courseId, progress, average, comments]);
  return result.rows[0];
};

export const getAvancesByStudent = async (studentId) => {
  const query = `
    SELECT a.id, a.progress, a.average, a.comments, a.date,
           s.name as subject_name, t.first_name, t.last_name
    FROM avances a
    LEFT JOIN subjects s ON a.subject_id = s.id
    LEFT JOIN teachers t ON a.teacher_id = t.id
    WHERE a.student_id = $1
    ORDER BY a.date DESC
  `;

  const result = await pool.query(query, [studentId]);
  return result.rows;
};

export const getAvancesBySubject = async (subjectId) => {
  const query = `
    SELECT a.id, a.student_id, a.progress, a.average, a.comments, a.date,
           s.first_name, s.last_name
    FROM avances a
    LEFT JOIN students s ON a.student_id = s.id
    WHERE a.subject_id = $1
    ORDER BY s.last_name, s.first_name
  `;

  const result = await pool.query(query, [subjectId]);
  return result.rows;
};

// ==================== UTILIDADES ====================

export const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL exitosa:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return false;
  }
};

export const closeConnection = async () => {
  await pool.end();
  console.log('Pool de conexiones cerrado');
};

export default {
  // Students
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentByDocument,
  // Courses
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  // Subjects
  createSubject,
  getAllSubjects,
  getSubjectsByTeacher,
  // Teachers
  createTeacher,
  getAllTeachers,
  getTeacherById,
  // Avances
  createAvance,
  getAvancesByStudent,
  getAvancesBySubject,
  // Utils
  testConnection,
  closeConnection,
  pool,
};
