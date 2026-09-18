require('dotenv').config();

const { randomUUID, scryptSync, timingSafeEqual } = require('crypto');
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const port = Number(process.env.API_PORT || 3002);

app.use(cors({
  origin: (origin, callback) => {
    const configuredOrigin = process.env.CLIENT_URL || 'http://localhost:3000';
    const isLocalDevelopmentOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    callback(null, !origin || origin === configuredOrigin || isLocalDevelopmentOrigin);
  },
}));
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'mysql' });
  } catch (error) {
    console.error('MySQL health check failed:', error.message);
    res.status(503).json({ status: 'error', database: 'mysql' });
  }
});

const hashPassword = (password, salt = randomUUID()) => `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
const validPassword = (password, stored) => {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  return timingSafeEqual(Buffer.from(hash, 'hex'), scryptSync(password, salt, 64));
};
const publicUser = (user) => ({ id: user.id, email: user.email, name: user.name, lastName: user.last_name, role: user.role });

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name = '', firstName = '', lastName = '', role = 'student', cedula = `TEMP-${randomUUID()}` } = req.body;
  if (!email || !password || (!name && !firstName)) return res.status(400).json({ error: 'Correo, nombre y contraseña son obligatorios' });
  try {
    const id = randomUUID();
    const [result] = await pool.query(
      'INSERT INTO users (id, cedula, email, name, last_name, password_hash, role, subject_progress) VALUES (?, ?, ?, ?, ?, ?, ?, JSON_OBJECT())',
      [id, cedula, email.toLowerCase(), name || firstName, lastName, hashPassword(password), role]
    );
    return res.status(201).json(publicUser({ id, email: email.toLowerCase(), name: name || firstName, last_name: lastName, role }));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El correo o documento ya está registrado' });
    console.error('Error registering user:', error.message);
    return res.status(500).json({ error: 'No se pudo registrar el usuario' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [[user]] = await pool.query('SELECT * FROM users WHERE email = ?', [String(email || '').toLowerCase()]);
    if (!user || !validPassword(password, user.password_hash)) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    return res.json(publicUser(user));
  } catch (error) {
    console.error('Error logging in:', error.message);
    return res.status(500).json({ error: 'No se pudo iniciar sesión' });
  }
});

app.get('/api/docentes', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, first_name AS firstName, last_name AS lastName,
             document_id AS documentId, email, phone, specialization,
             firebase_uid AS firebaseUid
      FROM teachers ORDER BY first_name, last_name
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error loading teachers:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar los profesores' });
  }
});

app.post('/api/docentes', async (req, res) => {
  const { firstName, lastName, documentId, email, phone, password, specialization = '' } = req.body;
  if (!firstName || !lastName || !documentId || !email || !phone || !password) {
    return res.status(400).json({ error: 'Nombre, apellido, documento, correo, teléfono y contraseña son obligatorios' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = randomUUID();
    const teacherId = randomUUID();
    await connection.query(
      'INSERT INTO users (id, cedula, email, name, last_name, password_hash, role, subject_progress) VALUES (?, ?, ?, ?, ?, ?, ?, JSON_OBJECT())',
      [userId, documentId, email.toLowerCase(), firstName, lastName, hashPassword(password), 'teacher']
    );
    await connection.query(
      'INSERT INTO teachers (id, first_name, last_name, document_id, email, phone, specialization, firebase_uid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [teacherId, firstName, lastName, documentId, email.toLowerCase(), phone, specialization, userId]
    );
    await connection.commit();
    res.status(201).json({ id: teacherId, firstName, lastName, documentId, email: email.toLowerCase(), phone, specialization });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El correo o documento ya está registrado' });
    console.error('Error creating teacher:', error.message);
    res.status(500).json({ error: 'No se pudo crear el profesor' });
  } finally {
    connection.release();
  }
});

app.delete('/api/docentes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM teachers WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting teacher:', error.message);
    res.status(500).json({ error: 'No se pudo eliminar el profesor' });
  }
});

app.get('/api/cursos', async (req, res) => {
  try {
    const params = [];
    let query = `
      SELECT id, name, grade, academic_year AS academicYear, description
      FROM courses
    `;
    if (req.query.grade) {
      query += ' WHERE grade = ?';
      params.push(req.query.grade);
    }
    query += ' ORDER BY academic_year DESC, grade ASC, name ASC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error loading courses:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar los cursos' });
  }
});

app.get('/api/cursos/:id', async (req, res) => {
  try {
    const [[course]] = await pool.query(`
      SELECT id, name, grade, academic_year AS academicYear, description
      FROM courses WHERE id = ?
    `, [req.params.id]);
    if (!course) return res.status(404).json({ error: 'El curso no existe' });
    res.json(course);
  } catch (error) {
    console.error('Error loading course:', error.message);
    res.status(500).json({ error: 'No se pudo cargar el curso' });
  }
});

app.post('/api/cursos', async (req, res) => {
  const { name, grade, academicYear, description = '' } = req.body;
  const year = Number(academicYear);
  if (!String(name || '').trim() || !['6', '7', '8', '9', '10', '11'].includes(String(grade)) || !Number.isInteger(year)) {
    return res.status(400).json({ error: 'Nombre, grado y año académico son obligatorios y válidos' });
  }

  try {
    const id = randomUUID();
    await pool.query(
      'INSERT INTO courses (id, name, grade, academic_year, description) VALUES (?, ?, ?, ?, ?)',
      [id, name.trim(), String(grade), year, String(description || '').trim()]
    );
    const [[course]] = await pool.query(`
      SELECT id, name, grade, academic_year AS academicYear, description
      FROM courses WHERE id = ?
    `, [id]);
    res.status(201).json(course);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un curso con ese nombre y año' });
    console.error('Error creating course:', error.message);
    res.status(500).json({ error: 'No se pudo crear el curso' });
  }
});

app.put('/api/cursos/:id', async (req, res) => {
  const { name, grade, academicYear, description = '' } = req.body;
  const year = Number(academicYear);
  if (!String(name || '').trim() || !['6', '7', '8', '9', '10', '11'].includes(String(grade)) || !Number.isInteger(year)) {
    return res.status(400).json({ error: 'Nombre, grado y año académico son obligatorios y válidos' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE courses SET name = ?, grade = ?, academic_year = ?, description = ? WHERE id = ?',
      [name.trim(), String(grade), year, String(description || '').trim(), req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'El curso no existe' });
    const [[course]] = await pool.query(`
      SELECT id, name, grade, academic_year AS academicYear, description
      FROM courses WHERE id = ?
    `, [req.params.id]);
    res.json(course);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe un curso con ese nombre y año' });
    console.error('Error updating course:', error.message);
    res.status(500).json({ error: 'No se pudo actualizar el curso' });
  }
});

app.delete('/api/cursos/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'El curso no existe' });
    res.json({ ok: true });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'No se puede eliminar un curso que tiene estudiantes o materias asociadas' });
    console.error('Error deleting course:', error.message);
    res.status(500).json({ error: 'No se pudo eliminar el curso' });
  }
});

app.get('/api/materias', async (req, res) => {
  try {
    const params = [];
    let query = `
      SELECT s.id, s.name, s.course_id AS courseId, s.teacher_id AS teacherId,
             s.description, c.name AS courseName,
             CONCAT(t.first_name, ' ', t.last_name) AS teacher
      FROM subjects s
      LEFT JOIN courses c ON c.id = s.course_id
      LEFT JOIN teachers t ON t.id = s.teacher_id
    `;
    const filters = [];
    if (req.query.courseId) {
      filters.push('s.course_id = ?');
      params.push(req.query.courseId);
    }
    if (req.query.teacherId) {
      filters.push('s.teacher_id = ?');
      params.push(req.query.teacherId);
    }
    if (filters.length) query += ` WHERE ${filters.join(' AND ')}`;
    query += ' ORDER BY s.name ASC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error loading subjects:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar las materias' });
  }
});

app.get('/api/materias/:id', async (req, res) => {
  try {
    const [[subject]] = await pool.query(`
      SELECT s.id, s.name, s.course_id AS courseId, s.teacher_id AS teacherId,
             s.description, c.name AS courseName,
             CONCAT(t.first_name, ' ', t.last_name) AS teacher
      FROM subjects s
      LEFT JOIN courses c ON c.id = s.course_id
      LEFT JOIN teachers t ON t.id = s.teacher_id
      WHERE s.id = ?
    `, [req.params.id]);
    if (!subject) return res.status(404).json({ error: 'La materia no existe' });
    res.json(subject);
  } catch (error) {
    console.error('Error loading subject:', error.message);
    res.status(500).json({ error: 'No se pudo cargar la materia' });
  }
});

app.post('/api/materias', async (req, res) => {
  const { name, courseId, teacherId, description = '' } = req.body;
  if (!String(name || '').trim() || !courseId || !teacherId) {
    return res.status(400).json({ error: 'Nombre, curso y docente son obligatorios' });
  }

  try {
    const id = randomUUID();
    await pool.query(
      'INSERT INTO subjects (id, name, course_id, teacher_id, description) VALUES (?, ?, ?, ?, ?)',
      [id, name.trim(), courseId, teacherId, String(description || '').trim()]
    );
    const [[subject]] = await pool.query(`
      SELECT s.id, s.name, s.course_id AS courseId, s.teacher_id AS teacherId,
             s.description, c.name AS courseName,
             CONCAT(t.first_name, ' ', t.last_name) AS teacher
      FROM subjects s
      LEFT JOIN courses c ON c.id = s.course_id
      LEFT JOIN teachers t ON t.id = s.teacher_id
      WHERE s.id = ?
    `, [id]);
    res.status(201).json(subject);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una materia con ese nombre en el curso' });
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'El curso o docente seleccionado no existe' });
    console.error('Error creating subject:', error.message);
    res.status(500).json({ error: 'No se pudo crear la materia' });
  }
});

app.put('/api/materias/:id', async (req, res) => {
  const { name, courseId, teacherId, description = '' } = req.body;
  if (!String(name || '').trim() || !courseId || !teacherId) {
    return res.status(400).json({ error: 'Nombre, curso y docente son obligatorios' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE subjects SET name = ?, course_id = ?, teacher_id = ?, description = ? WHERE id = ?',
      [name.trim(), courseId, teacherId, String(description || '').trim(), req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'La materia no existe' });
    const [[subject]] = await pool.query(`
      SELECT s.id, s.name, s.course_id AS courseId, s.teacher_id AS teacherId,
             s.description, c.name AS courseName,
             CONCAT(t.first_name, ' ', t.last_name) AS teacher
      FROM subjects s
      LEFT JOIN courses c ON c.id = s.course_id
      LEFT JOIN teachers t ON t.id = s.teacher_id
      WHERE s.id = ?
    `, [req.params.id]);
    res.json(subject);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una materia con ese nombre en el curso' });
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'El curso o docente seleccionado no existe' });
    console.error('Error updating subject:', error.message);
    res.status(500).json({ error: 'No se pudo actualizar la materia' });
  }
});

app.delete('/api/materias/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM subjects WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'La materia no existe' });
    res.json({ ok: true });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'No se puede eliminar una materia que tiene avances asociados' });
    console.error('Error deleting subject:', error.message);
    res.status(500).json({ error: 'No se pudo eliminar la materia' });
  }
});

app.get('/api/estudiantes', async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id, s.first_name AS firstName, s.last_name AS lastName,
             s.document_id AS documentId, s.email, s.phone, s.grade,
             c.id AS courseId, c.name AS courseName, c.academic_year AS academicYear
      FROM students s
      LEFT JOIN courses c ON c.id = s.course_id
      ORDER BY s.first_name, s.last_name
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error loading students:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar los estudiantes' });
  }
});

app.get('/api/estudiantes/:id', async (req, res) => {
  try {
    const [[student]] = await pool.query(`
      SELECT s.id, s.first_name AS firstName, s.last_name AS lastName,
             s.document_id AS documentId, s.email, s.phone, s.grade,
             c.id AS courseId, c.name AS courseName, c.academic_year AS academicYear
      FROM students s
      LEFT JOIN courses c ON c.id = s.course_id
      WHERE s.id = ?
    `, [req.params.id]);
    if (!student) return res.status(404).json({ error: 'El estudiante no existe' });
    res.json(student);
  } catch (error) {
    console.error('Error loading student:', error.message);
    res.status(500).json({ error: 'No se pudo cargar el estudiante' });
  }
});

app.get('/api/estudiantes/email/:email', async (req, res) => {
  try {
    const [[student]] = await pool.query(`
      SELECT s.id, s.first_name AS firstName, s.last_name AS lastName,
             s.document_id AS documentId, s.email, s.phone, s.grade,
             c.id AS courseId, c.name AS courseName, c.academic_year AS academicYear
      FROM students s
      LEFT JOIN courses c ON c.id = s.course_id
      WHERE LOWER(s.email) = LOWER(?)
      LIMIT 1
    `, [decodeURIComponent(req.params.email)]);
    res.json(student || null);
  } catch (error) {
    console.error('Error loading student by email:', error.message);
    res.status(500).json({ error: 'No se pudo consultar el estudiante' });
  }
});

app.post('/api/estudiantes', async (req, res) => {
  const { firstName, lastName, documentId, email = '', phone, grade = '6', courseId, authUid } = req.body;
  if (!firstName || !lastName || !documentId || !phone || !courseId) {
    return res.status(400).json({ error: 'Nombre, apellido, documento, teléfono y curso son obligatorios' });
  }

  try {
    let resolvedCourseId = courseId;
    if (courseId === 'default') {
      const [courses] = await pool.query('SELECT id FROM courses WHERE grade = ? ORDER BY academic_year DESC LIMIT 1', [grade]);
      if (courses.length) {
        resolvedCourseId = courses[0].id;
      } else {
        resolvedCourseId = randomUUID();
        await pool.query(
          'INSERT INTO courses (id, name, grade, academic_year, description) VALUES (?, ?, ?, ?, ?)',
          [resolvedCourseId, 'Curso general', grade, new Date().getFullYear(), 'Curso creado automáticamente durante el registro']
        );
      }
    }
    const id = randomUUID();
    await pool.query(
      'INSERT INTO students (id, first_name, last_name, document_id, email, phone, grade, course_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, firstName, lastName, documentId, email, phone, grade, resolvedCourseId]
    );
    res.status(201).json({ id, firstName, lastName, documentId, email, phone, grade, courseId: resolvedCourseId, authUid });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El documento ya está registrado' });
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'El curso seleccionado no existe' });
    console.error('Error creating student:', error.message);
    res.status(500).json({ error: 'No se pudo crear el estudiante' });
  }
});

app.get('/api/estudiantes/document/:documentId', async (req, res) => {
  try {
    const [[student]] = await pool.query(`
      SELECT id, first_name AS firstName, last_name AS lastName,
             document_id AS documentId, email, phone, grade, course_id AS courseId
      FROM students WHERE document_id = ?
    `, [req.params.documentId]);
    res.json(student || null);
  } catch (error) {
    console.error('Error loading student by document:', error.message);
    res.status(500).json({ error: 'No se pudo consultar el estudiante' });
  }
});

app.get('/api/avances/estudiante/:studentId', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.id, a.student_id AS studentId, a.subject_id AS subjectId,
             a.progress AS percentage, a.progress, a.comments AS description,
             a.comments, a.date, a.created_at AS createdAt,
             sub.name AS subjectName
      FROM avances a
      LEFT JOIN subjects sub ON sub.id = a.subject_id
      WHERE a.student_id = ?
      ORDER BY a.date DESC, a.created_at DESC
    `, [req.params.studentId]);
    res.json(rows);
  } catch (error) {
    console.error('Error loading advances:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar los avances' });
  }
});

app.post('/api/avances', async (req, res) => {
  const { studentId, subjectId, percentage, description, date } = req.body;
  const progress = Number(percentage);

  if (!studentId || !subjectId || !Number.isFinite(progress) || progress < 0 || progress > 100 || !description?.trim()) {
    return res.status(400).json({ error: 'Datos de avance incompletos o inválidos' });
  }

  try {
    const avanceId = randomUUID();
    const [[subject]] = await pool.query(
      'SELECT teacher_id AS teacherId, course_id AS courseId FROM subjects WHERE id = ?',
      [subjectId]
    );
    if (!subject) return res.status(404).json({ error: 'La materia no existe' });

    const [result] = await pool.query(`
      INSERT INTO avances (id, student_id, subject_id, teacher_id, course_id, progress, average, comments, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_DATE))
    `, [avanceId, studentId, subjectId, subject.teacherId, subject.courseId, progress, progress, description.trim(), date || null]);

    const [[created]] = await pool.query(
      'SELECT id, student_id AS studentId, subject_id AS subjectId, progress AS percentage, comments AS description, date FROM avances WHERE id = ?',
      [avanceId]
    );
    res.status(201).json(created || { id: avanceId, studentId, subjectId, percentage: progress, description, date });
  } catch (error) {
    console.error('Error creating advance:', error.message);
    res.status(500).json({ error: 'No se pudo crear el avance' });
  }
});

app.listen(port, () => {
  console.log(`MySQL API listening on http://localhost:${port}`);
});
