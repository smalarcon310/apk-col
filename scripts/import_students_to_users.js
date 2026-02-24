/*
  Script: import_students_to_users.js
  Crea documentos en la colección `users` a partir de datos de ejemplo,
  inicializando `subjectProgress` para cada materia.

  Uso (PowerShell Windows):
    npm install firebase-admin
    $env:GOOGLE_APPLICATION_CREDENTIALS="C:\ruta\a\serviceAccountKey.json"
    node .\scripts\import_students_to_users.js

  WARNING: Este script escribe en Firestore. Probar en staging o con backup.
*/

const admin = require('firebase-admin');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('ERROR: configure la variable de entorno GOOGLE_APPLICATION_CREDENTIALS');
  process.exit(1);
}

admin.initializeApp();
const db = admin.firestore();

// Datos de ejemplo (extraídos y adaptados desde src/data/exampleData.js)
const STUDENTS = [
  {
    firstName: 'Juan',
    lastName: 'Pérez García',
    documentId: '1234567890',
    grade: '6',
    email: 'juan.perez@email.com',
  },
  {
    firstName: 'María',
    lastName: 'González López',
    documentId: '1234567891',
    grade: '6',
    email: 'maria.gonzalez@email.com',
  },
  {
    firstName: 'Carlos',
    lastName: 'Rodríguez Martínez',
    documentId: '1234567892',
    grade: '7',
    email: 'carlos.rodriguez@email.com',
  },
  {
    firstName: 'Laura',
    lastName: 'Sánchez Díaz',
    documentId: '1234567893',
    grade: '6',
    email: 'laura.sanchez@email.com',
  },
  {
    firstName: 'Diego',
    lastName: 'Hernández Ruiz',
    documentId: '1234567894',
    grade: '8',
    email: 'diego.hernandez@email.com',
  },
];

// Lista de materias (nombres legibles). El script creará claves "slug" en subjectProgress
const SUBJECTS = [
  'Ciencias Naturales',
  'Club',
  'Comunicación',
  'Educación Física',
  'Ética',
  'Informática',
  'Matemáticas',
  'Inglés',
  'Español',
  'Sociales',
  'Artes',
];

function slugify(s) {
  return s
    .toString()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function run() {
  console.log('Iniciando importación de estudiantes a la colección `users`...');

  // preparar subjectProgress template
  const subjectProgressTemplate = {};
  for (const name of SUBJECTS) {
    subjectProgressTemplate[slugify(name)] = 0;
  }

  const batch = db.batch();
  const usersCol = db.collection('users');

  for (const s of STUDENTS) {
    // construir objeto similar al de la captura: cedula, email, grade, lastName, name, subjectProgress
    const userObj = {
      cedula: s.documentId,
      email: s.email,
      grade: Number(s.grade) || 0,
      lastName: s.lastName.split(' ').slice(-1).join(' '),
      name: s.firstName,
      subjectProgress: { ...subjectProgressTemplate },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = usersCol.doc(); // id autogenerado como en la captura
    batch.set(docRef, userObj);
  }

  try {
    await batch.commit();
    console.log(`Importación completada. ${STUDENTS.length} documentos creados en 'users'.`);
  } catch (err) {
    console.error('Error al insertar documentos:', err);
  }
}

run().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
