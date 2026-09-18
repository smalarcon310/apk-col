/**
 * SERMA - Guía de Configuración PostgreSQL
 * Instrucciones para setup y conexión de la base de datos
 */

# 📦 CONFIGURACIÓN DE PostgreSQL

## 🚀 Instalación Inicial

### 1. Crear Base de Datos
```sql
CREATE DATABASE serma_db;
```

### 2. Conectarse a la BD
```bash
psql -U postgres -d serma_db
```

### 3. Ejecutar el script de esquema
```bash
psql -U postgres -d serma_db -f DATABASE_SCHEMA.sql
```

---

## 🔧 Dependencias Node.js

Instalar el driver de PostgreSQL:
```bash
npm install pg
# o
pnpm add pg
```

Para migraciones (opcional):
```bash
npm install knex
# o
pnpm add knex
```

---

## 🌍 Variables de Entorno

Crear archivo `.env`:
```env
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_NAME=serma_db

# Puede ser "postgres" o "rest-api"
DB_MODE=postgres

# Firebase (mantener)
REACT_APP_FIREBASE_API_KEY=AIzaSyB4euOKx72vSDnWMhSuYXXGypi9LZXy76A
REACT_APP_FIREBASE_AUTH_DOMAIN=apk-col-3ea52.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=apk-col-3ea52

# API REST (opcional)
REACT_APP_API_BASE_URL=http://localhost:3001
```

---

## 📝 Servicios PostgreSQL

Crear archivo: `src/services/postgresService.js`

```javascript
/**
 * SERMA - Servicio de PostgreSQL
 * Cliente centralizado para todas las operaciones de BD
 */

import pg from 'pg';

const { Pool } = pg;

// Pool de conexiones
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'serma_db',
});

// Manejo de errores de conexión
pool.on('error', (err) => {
  console.error('Error en pool de PostgreSQL:', err);
});

/**
 * Ejecutar query
 * @param {string} query - Consulta SQL
 * @param {Array} values - Parámetros
 * @returns {Promise<Object>} Resultado
 */
export const executeQuery = async (query, values = []) => {
  try {
    const result = await pool.query(query, values);
    return {
      success: true,
      rows: result.rows,
      rowCount: result.rowCount,
    };
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
};

// ==================== STUDENTS ====================

export const createStudent = async (studentData) => {
  const query = `
    INSERT INTO students 
    (first_name, last_name, document_id, email, phone, grade, course_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const values = [
    studentData.firstName,
    studentData.lastName,
    studentData.documentId,
    studentData.email,
    studentData.phone,
    studentData.grade,
    studentData.courseId,
  ];

  const result = await executeQuery(query, values);
  return result.rows[0];
};

export const getAllStudents = async () => {
  const query = `
    SELECT * FROM students_with_courses 
    ORDER BY first_name ASC
  `;
  const result = await executeQuery(query);
  return result.rows;
};

export const getStudentById = async (studentId) => {
  const query = `
    SELECT * FROM students_with_courses 
    WHERE id = $1
  `;
  const result = await executeQuery(query, [studentId]);
  return result.rows[0];
};

export const getStudentsByCourse = async (courseId) => {
  const query = `
    SELECT * FROM students_with_courses 
    WHERE course_id = $1
    ORDER BY first_name ASC
  `;
  const result = await executeQuery(query, [courseId]);
  return result.rows;
};

export const updateStudent = async (studentId, studentData) => {
  const query = `
    UPDATE students 
    SET first_name = $1, last_name = $2, email = $3, 
        phone = $4, grade = $5, course_id = $6
    WHERE id = $7
    RETURNING *
  `;
  
  const values = [
    studentData.firstName,
    studentData.lastName,
    studentData.email,
    studentData.phone,
    studentData.grade,
    studentData.courseId,
    studentId,
  ];

  const result = await executeQuery(query, values);
  return result.rows[0];
};

export const deleteStudent = async (studentId) => {
  const query = 'DELETE FROM students WHERE id = $1 RETURNING id';
  const result = await executeQuery(query, [studentId]);
  return result.rowCount > 0;
};

export const getStudentByDocument = async (documentId) => {
  const query = 'SELECT * FROM students WHERE document_id = $1';
  const result = await executeQuery(query, [documentId]);
  return result.rows[0];
};

// ==================== COURSES ====================

export const createCourse = async (courseData) => {
  const query = `
    INSERT INTO courses (name, grade, academic_year, description)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  
  const values = [
    courseData.name,
    courseData.grade,
    courseData.academicYear,
    courseData.description,
  ];

  const result = await executeQuery(query, values);
  return result.rows[0];
};

export const getAllCourses = async () => {
  const query = `
    SELECT * FROM courses 
    ORDER BY academic_year DESC, grade ASC
  `;
  const result = await executeQuery(query);
  return result.rows;
};

export const getCourseById = async (courseId) => {
  const query = 'SELECT * FROM courses WHERE id = $1';
  const result = await executeQuery(query, [courseId]);
  return result.rows[0];
};

export const updateCourse = async (courseId, courseData) => {
  const query = `
    UPDATE courses 
    SET name = $1, grade = $2, academic_year = $3, description = $4
    WHERE id = $5
    RETURNING *
  `;
  
  const values = [
    courseData.name,
    courseData.grade,
    courseData.academicYear,
    courseData.description,
    courseId,
  ];

  const result = await executeQuery(query, values);
  return result.rows[0];
};

export const deleteCourse = async (courseId) => {
  // Verificar si tiene estudiantes o materias
  const checkQuery = `
    SELECT COUNT(*) as count FROM students WHERE course_id = $1
    UNION ALL
    SELECT COUNT(*) as count FROM subjects WHERE course_id = $1
  `;
  
  const checkResult = await executeQuery(checkQuery, [courseId]);
  if (checkResult.rows.some(row => row.count > 0)) {
    throw new Error('No se puede eliminar curso con estudiantes o materias');
  }

  const query = 'DELETE FROM courses WHERE id = $1 RETURNING id';
  const result = await executeQuery(query, [courseId]);
  return result.rowCount > 0;
};

// ==================== SUBJECTS ====================

export const createSubject = async (subjectData) => {
  const query = `
    INSERT INTO subjects (name, course_id, teacher_id, description)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  
  const values = [
    subjectData.name,
    subjectData.courseId,
    subjectData.teacherId,
    subjectData.description,
  ];

  const result = await executeQuery(query, values);
  return result.rows[0];
};

export const getAllSubjects = async () => {
  const query = `
    SELECT * FROM subjects_with_details 
    ORDER BY course_name, name
  `;
  const result = await executeQuery(query);
  return result.rows;
};

export const getSubjectById = async (subjectId) => {
  const query = `
    SELECT * FROM subjects_with_details 
    WHERE id = $1
  `;
  const result = await executeQuery(query, [subjectId]);
  return result.rows[0];
};

export const getSubjectsByCourse = async (courseId) => {
  const query = `
    SELECT * FROM subjects_with_details 
    WHERE course_id = $1
    ORDER BY name
  `;
  const result = await executeQuery(query, [courseId]);
  return result.rows;
};

export const updateSubject = async (subjectId, subjectData) => {
  const query = `
    UPDATE subjects 
    SET name = $1, course_id = $2, teacher_id = $3, description = $4
    WHERE id = $5
    RETURNING *
  `;
  
  const values = [
    subjectData.name,
    subjectData.courseId,
    subjectData.teacherId,
    subjectData.description,
    subjectId,
  ];

  const result = await executeQuery(query, values);
  return result.rows[0];
};

export const deleteSubject = async (subjectId) => {
  const query = 'DELETE FROM subjects WHERE id = $1 RETURNING id';
  const result = await executeQuery(query, [subjectId]);
  return result.rowCount > 0;
};

// ==================== TEACHERS ====================

export const createTeacher = async (teacherData) => {
  const query = `
    INSERT INTO teachers 
    (first_name, last_name, document_id, email, phone, specialization, firebase_uid)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const values = [
    teacherData.firstName,
    teacherData.lastName,
    teacherData.documentId,
    teacherData.email,
    teacherData.phone,
    teacherData.specialization,
    teacherData.firebaseUid,
  ];

  const result = await executeQuery(query, values);
  return result.rows[0];
};

export const getAllTeachers = async () => {
  const query = 'SELECT * FROM teachers ORDER BY first_name';
  const result = await executeQuery(query);
  return result.rows;
};

export const getTeacherById = async (teacherId) => {
  const query = 'SELECT * FROM teachers WHERE id = $1';
  const result = await executeQuery(query, [teacherId]);
  return result.rows[0];
};

export const updateTeacher = async (teacherId, teacherData) => {
  const query = `
    UPDATE teachers 
    SET first_name = $1, last_name = $2, email = $3, 
        phone = $4, specialization = $5, firebase_uid = $6
    WHERE id = $7
    RETURNING *
  `;
  
  const values = [
    teacherData.firstName,
    teacherData.lastName,
    teacherData.email,
    teacherData.phone,
    teacherData.specialization,
    teacherData.firebaseUid,
    teacherId,
  ];

  const result = await executeQuery(query, values);
  return result.rows[0];
};

export const deleteTeacher = async (teacherId) => {
  const query = 'DELETE FROM teachers WHERE id = $1 RETURNING id';
  const result = await executeQuery(query, [teacherId]);
  return result.rowCount > 0;
};

export const getTeacherByDocument = async (documentId) => {
  const query = 'SELECT * FROM teachers WHERE document_id = $1';
  const result = await executeQuery(query, [documentId]);
  return result.rows[0];
};

// ==================== AVANCES ====================

export const createAvance = async (avanceData) => {
  const query = `
    INSERT INTO avances 
    (student_id, subject_id, teacher_id, course_id, progress, average, comments, date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const values = [
    avanceData.studentId,
    avanceData.subjectId,
    avanceData.teacherId,
    avanceData.courseId,
    avanceData.progress || 0,
    avanceData.average || 0,
    avanceData.comments || '',
    avanceData.date || new Date().toISOString().split('T')[0],
  ];

  const result = await executeQuery(query, values);
  return result.rows[0];
};

export const getAvancesByStudent = async (studentId) => {
  const query = `
    SELECT * FROM student_avances_summary 
    WHERE student_id = $1
    ORDER BY date DESC
  `;
  const result = await executeQuery(query, [studentId]);
  return result.rows;
};

export const getAvancesBySubject = async (subjectId) => {
  const query = `
    SELECT * FROM student_avances_summary 
    WHERE subject_id = $1
    ORDER BY date DESC
  `;
  const result = await executeQuery(query, [subjectId]);
  return result.rows;
};

export const updateAvance = async (avanceId, avanceData) => {
  const query = `
    UPDATE avances 
    SET progress = $1, average = $2, comments = $3, date = $4
    WHERE id = $5
    RETURNING *
  `;
  
  const values = [
    avanceData.progress,
    avanceData.average,
    avanceData.comments,
    avanceData.date,
    avanceId,
  ];

  const result = await executeQuery(query, values);
  return result.rows[0];
};

export const deleteAvance = async (avanceId) => {
  const query = 'DELETE FROM avances WHERE id = $1 RETURNING id';
  const result = await executeQuery(query, [avanceId]);
  return result.rowCount > 0;
};

// ==================== GUARDIANS ====================

export const createGuardian = async (authUid, studentId) => {
  const query = `
    INSERT INTO guardians (auth_uid, student_id)
    VALUES ($1, $2)
    RETURNING *
  `;
  
  const result = await executeQuery(query, [authUid, studentId]);
  return result.rows[0];
};

export const getGuardianByUid = async (authUid) => {
  const query = 'SELECT * FROM guardians WHERE auth_uid = $1';
  const result = await executeQuery(query, [authUid]);
  return result.rows[0];
};

// ==================== USERS ====================

export const createUser = async (userData) => {
  const query = `
    INSERT INTO users (cedula, email, name, last_name, grade)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  const values = [
    userData.cedula,
    userData.email,
    userData.name,
    userData.lastName,
    userData.grade,
  ];

  const result = await executeQuery(query, values);
  return result.rows[0];
};

export const getUserByCedula = async (cedula) => {
  const query = 'SELECT * FROM users WHERE cedula = $1';
  const result = await executeQuery(query, [cedula]);
  return result.rows[0];
};

export const updateUserProgress = async (userId, subjectSlug, progress) => {
  const query = `
    UPDATE users 
    SET subject_progress = jsonb_set(
      COALESCE(subject_progress, '{}'::jsonb),
      ARRAY[$1],
      to_jsonb($2)
    )
    WHERE id = $3
    RETURNING *
  `;
  
  const result = await executeQuery(query, [subjectSlug, progress, userId]);
  return result.rows[0];
};

// Función helper para slugificar
const slugify = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
};

// Exportar pool para transacciones personalizadas
export { pool };

export default {
  executeQuery,
  // Students
  createStudent,
  getAllStudents,
  getStudentById,
  getStudentsByCourse,
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
  getSubjectById,
  getSubjectsByCourse,
  updateSubject,
  deleteSubject,
  // Teachers
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  getTeacherByDocument,
  // Avances
  createAvance,
  getAvancesByStudent,
  getAvancesBySubject,
  updateAvance,
  deleteAvance,
  // Guardians
  createGuardian,
  getGuardianByUid,
  // Users
  createUser,
  getUserByCedula,
  updateUserProgress,
};
```

---

## 🔄 Replicar datos de Firestore a PostgreSQL

Crear script: `scripts/migrate_firestore_to_postgres.js`

```javascript
/**
 * Script de migración: Firestore → PostgreSQL
 * Ejecutar: node scripts/migrate_firestore_to_postgres.js
 */

import { 
  collection, 
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../src/config/firebase.js';
import * as postgresService from '../src/services/postgresService.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function migrateFirestoreToPostgres() {
  try {
    console.log('🚀 Iniciando migración Firestore → PostgreSQL...\n');

    // 1. Migrar Cursos
    console.log('📚 Migrando cursos...');
    const coursesSnapshot = await getDocs(collection(db, 'courses'));
    const courseMap = {}; // Mapeo de IDs Firestore → PostgreSQL
    
    for (const doc of coursesSnapshot.docs) {
      const courseData = doc.data();
      const newCourse = await postgresService.createCourse({
        name: courseData.name,
        grade: courseData.grade,
        academicYear: courseData.academicYear,
        description: courseData.description,
      });
      courseMap[doc.id] = newCourse.id;
      console.log(`  ✓ ${courseData.name}`);
      await sleep(100);
    }

    // 2. Migrar Profesores
    console.log('\n👨‍🏫 Migrando profesores...');
    const teachersSnapshot = await getDocs(collection(db, 'teachers'));
    const teacherMap = {};
    
    for (const doc of teachersSnapshot.docs) {
      const teacherData = doc.data();
      const newTeacher = await postgresService.createTeacher({
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        documentId: teacherData.documentId,
        email: teacherData.email,
        phone: teacherData.phone,
        specialization: teacherData.specialization,
        firebaseUid: teacherData.firebaseUid,
      });
      teacherMap[doc.id] = newTeacher.id;
      console.log(`  ✓ ${teacherData.firstName} ${teacherData.lastName}`);
      await sleep(100);
    }

    // 3. Migrar Estudiantes
    console.log('\n🎓 Migrando estudiantes...');
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    const studentMap = {};
    
    for (const doc of studentsSnapshot.docs) {
      const studentData = doc.data();
      const courseId = courseMap[studentData.courseId];
      
      if (!courseId) {
        console.log(`  ⚠ Estudiante sin curso válido: ${studentData.firstName}`);
        continue;
      }

      const newStudent = await postgresService.createStudent({
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        documentId: studentData.documentId,
        email: studentData.email,
        phone: studentData.phone,
        grade: studentData.grade,
        courseId,
      });
      studentMap[doc.id] = newStudent.id;
      console.log(`  ✓ ${studentData.firstName} ${studentData.lastName}`);
      await sleep(100);
    }

    // 4. Migrar Materias
    console.log('\n📖 Migrando materias...');
    const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
    const subjectMap = {};
    
    for (const doc of subjectsSnapshot.docs) {
      const subjectData = doc.data();
      const courseId = courseMap[subjectData.courseId];
      const teacherId = teacherMap[subjectData.teacherId];
      
      if (!courseId || !teacherId) {
        console.log(`  ⚠ Materia sin referencias válidas: ${subjectData.name}`);
        continue;
      }

      const newSubject = await postgresService.createSubject({
        name: subjectData.name,
        courseId,
        teacherId,
        description: subjectData.description,
      });
      subjectMap[doc.id] = newSubject.id;
      console.log(`  ✓ ${subjectData.name}`);
      await sleep(100);
    }

    // 5. Migrar Avances
    console.log('\n📊 Migrando avances...');
    const avancesSnapshot = await getDocs(collection(db, 'avances'));
    
    for (const doc of avancesSnapshot.docs) {
      const avanceData = doc.data();
      const studentId = studentMap[avanceData.studentId];
      const subjectId = subjectMap[avanceData.subjectId];
      const teacherId = teacherMap[avanceData.teacherId];
      const courseId = courseMap[avanceData.courseId];
      
      if (!studentId || !subjectId || !teacherId || !courseId) {
        console.log(`  ⚠ Avance con referencias faltantes`);
        continue;
      }

      await postgresService.createAvance({
        studentId,
        subjectId,
        teacherId,
        courseId,
        progress: avanceData.progress,
        average: avanceData.average,
        comments: avanceData.comments,
        date: avanceData.date,
      });
      console.log(`  ✓ Avance migrado`);
      await sleep(100);
    }

    // 6. Migrar Guardians (si existen)
    console.log('\n👨‍👩‍👧 Migrando acudientes...');
    const guardiansSnapshot = await getDocs(collection(db, 'guardians'));
    
    for (const doc of guardiansSnapshot.docs) {
      const guardianData = doc.data();
      const studentId = studentMap[guardianData.studentId];
      
      if (!studentId) continue;

      await postgresService.createGuardian(
        guardianData.authUid,
        studentId
      );
      console.log(`  ✓ Acudiente vinculado`);
      await sleep(100);
    }

    console.log('\n✅ ¡Migración completada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

// Ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateFirestoreToPostgres();
}
```

---

## 🔐 Seguridad

### Validaciones en aplicación
```javascript
// Siempre usar prepared statements (parámetros $1, $2, etc.)
// para prevenir SQL injection

// ✅ CORRECTO
const result = await executeQuery(
  'SELECT * FROM students WHERE id = $1',
  [studentId]
);

// ❌ INCORRECTO (vulnerable)
const result = await executeQuery(
  `SELECT * FROM students WHERE id = '${studentId}'`
);
```

### Restricciones de BD
- Validación de email en constraint
- Restricción de valores grade (6-11)
- Progress entre 0-100
- Índices para performance

---

## 📊 Monitoreo y Mantenimiento

### Backup regular
```bash
# Full backup
pg_dump -U postgres serma_db > backup_$(date +%Y%m%d).sql

# Restaurar
psql -U postgres serma_db < backup_*.sql
```

### Vacío y optimización
```sql
VACUUM ANALYZE;
REINDEX DATABASE serma_db;
```

---

## ❓ FAQ

**P: ¿Qué pasa con las contraseñas?**  
R: Se mantienen en Firebase Auth. PostgreSQL NO almacena contraseñas.

**P: ¿Puedo usar Firestore y PostgreSQL al mismo tiempo?**  
R: Sí, configurando `DB_MODE` en .env puedes alternar entre ambos.

**P: ¿Cómo sincronizar cambios después de migración?**  
R: Implementar trigger en PostgreSQL que actualice Firestore o viceversa.

**P: ¿Qué pasa con las referencias UUID?**  
R: PostgreSQL usa UUID automáticamente. El mapeo se hace en la migración.

