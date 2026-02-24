const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin SDK
// Asegúrate de que el archivo de claves esté en tu proyecto
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath))
});

const db = admin.firestore();

async function addRector() {
  try {
    const rectorData = {
      firstName: 'Sergio',
      lastName: 'Alarcon',
      documentId: '1003880282',
      email: 'sergioalarcon310@gmail.com',
      phone: '3001234567',
      role: 'rector',
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    // Actualizar el documento existente
    const docId = 'vIkGSRARBKrjroqX5N9a';
    await db.collection('rectors').doc(docId).set(rectorData);
    console.log('Rector actualizado exitosamente con ID:', docId);
    console.log('Datos:', rectorData);

  } catch (error) {
    console.error('Error actualizando rector:', error);
  } finally {
    admin.app().delete();
  }
}

addRector();
