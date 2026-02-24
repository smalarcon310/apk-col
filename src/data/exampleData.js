/**
 * SERMA - Datos de Ejemplo
 * Para desarrollo y testing local
 * 
 * Uso: 
 * 1. Crear cursos primero
 * 2. Crear estudiantes (necesitan courseId válido)
 * 3. Crear materias (necesitan courseId válido)
 */

// === CURSOS DE EJEMPLO ===
export const EXAMPLE_COURSES = [
  {
    name: '6-A',
    grade: '6',
    academicYear: 2025,
    description: 'Curso sexto A - Jornada matutina'
  },
  {
    name: '6-B',
    grade: '6',
    academicYear: 2025,
    description: 'Curso sexto B - Jornada vespertina'
  },
  {
    name: '7-A',
    grade: '7',
    academicYear: 2025,
    description: 'Curso séptimo A'
  },
  {
    name: '8-A',
    grade: '8',
    academicYear: 2025,
    description: 'Curso octavo A'
  },
];

// === ESTUDIANTES DE EJEMPLO ===
export const EXAMPLE_STUDENTS = [
  {
    firstName: 'Juan',
    lastName: 'Pérez García',
    documentId: '1234567890',
    grade: '6',
    email: 'juan.perez@email.com',
    phone: '3001234567',
    courseId: 'SERÁ_REEMPLAZADO_CON_ID_REAL'
  },
  {
    firstName: 'María',
    lastName: 'González López',
    documentId: '1234567891',
    grade: '6',
    email: 'maria.gonzalez@email.com',
    phone: '3001234568',
    courseId: 'SERÁ_REEMPLAZADO_CON_ID_REAL'
  },
  {
    firstName: 'Carlos',
    lastName: 'Rodríguez Martínez',
    documentId: '1234567892',
    grade: '7',
    email: 'carlos.rodriguez@email.com',
    phone: '3001234569',
    courseId: 'SERÁ_REEMPLAZADO_CON_ID_REAL'
  },
  {
    firstName: 'Laura',
    lastName: 'Sánchez Díaz',
    documentId: '1234567893',
    grade: '6',
    email: 'laura.sanchez@email.com',
    phone: '3001234570',
    courseId: 'SERÁ_REEMPLAZADO_CON_ID_REAL'
  },
  {
    firstName: 'Diego',
    lastName: 'Hernández Ruiz',
    documentId: '1234567894',
    grade: '8',
    email: 'diego.hernandez@email.com',
    phone: '3001234571',
    courseId: 'SERÁ_REEMPLAZADO_CON_ID_REAL'
  },
];

// === MATERIAS DE EJEMPLO ===
export const EXAMPLE_SUBJECTS = [
  {
    name: 'Matemáticas',
    courseId: 'SERÁ_REEMPLAZADO_CON_ID_REAL',
    teacher: 'María González Espinoza',
    description: 'Curso de matemáticas básicas, álgebra y geometría'
  },
  {
    name: 'Español',
    courseId: 'SERÁ_REEMPLAZADO_CON_ID_REAL',
    teacher: 'Juan Carlos López',
    description: 'Lengua, literatura y gramática'
  },
  {
    name: 'Inglés',
    courseId: 'SERÁ_REEMPLAZADO_CON_ID_REAL',
    teacher: 'Sandra Miller',
    description: 'English language and communication'
  },
  {
    name: 'Ciencias Naturales',
    courseId: 'SERÁ_REEMPLAZADO_CON_ID_REAL',
    teacher: 'Dr. Roberto Acosta',
    description: 'Biología, química y física básica'
  },
  {
    name: 'Sociales',
    courseId: 'SERÁ_REEMPLAZADO_CON_ID_REAL',
    teacher: 'Patricia Ramírez',
    description: 'Historia, geografía y educación cívica'
  },
  {
    name: 'Educación Física',
    courseId: 'SERÁ_REEMPLAZADO_CON_ID_REAL',
    teacher: 'Carlos Mendoza',
    description: 'Deportes y actividad física'
  },
  {
    name: 'Informática',
    courseId: 'SERÁ_REEMPLAZADO_CON_ID_REAL',
    teacher: 'Javier Torres',
    description: 'Computación y tecnología'
  },
  {
    name: 'Artes',
    courseId: 'SERÁ_REEMPLAZADO_CON_ID_REAL',
    teacher: 'Claudia Vega',
    description: 'Pintura, escultura y expresión artística'
  },
];

/**
 * Función auxiliar para cargar datos de ejemplo
 * NOTA: SOLO USAR EN DESARROLLO/TESTING
 */
export async function loadExampleData() {
  console.warn('⚠️ Cargando datos de ejemplo. SOLO usar en desarrollo.');
  
  // Este proceso es manual por seguridad:
  // 1. Copiar EXAMPLE_COURSES
  // 2. Crear en interfaz
  // 3. Copiar IDs generados
  // 4. Reemplazar courseId en EXAMPLE_STUDENTS
  // 5. Crear estudiantes
  // 6. Crear materias
  
  console.log('Datos de ejemplo preparados. Seguir pasos manuales.');
}

/**
 * Validar datos de ejemplo
 */
export function validateExampleData() {
  console.log('✓ Validando datos de ejemplo...');
  
  // Validar cursos
  EXAMPLE_COURSES.forEach((course, i) => {
    if (!course.name || !course.grade || !course.academicYear) {
      console.warn(`⚠️ Curso ${i} incompleto`);
    }
  });
  
  // Validar estudiantes
  EXAMPLE_STUDENTS.forEach((student, i) => {
    if (!student.firstName || !student.documentId || !student.email) {
      console.warn(`⚠️ Estudiante ${i} incompleto`);
    }
  });
  
  // Validar materias
  EXAMPLE_SUBJECTS.forEach((subject, i) => {
    if (!subject.name || !subject.teacher) {
      console.warn(`⚠️ Materia ${i} incompleta`);
    }
  });
  
  console.log('✓ Validación completada');
}

export default {
  EXAMPLE_COURSES,
  EXAMPLE_STUDENTS,
  EXAMPLE_SUBJECTS,
  loadExampleData,
  validateExampleData,
};
