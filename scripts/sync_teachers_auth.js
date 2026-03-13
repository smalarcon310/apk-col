const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin SDK usando el archivo firebase-key.json del repo
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath))
});

const db = admin.firestore();

async function syncTeachers() {
  try {
    const snap = await db.collection('teachers').where('createdBy', '==', 'rector').get();
    if (snap.empty) {
      console.log('No hay docentes creados por el rector.');
      return;
    }

    for (const doc of snap.docs) {
      const t = doc.data();
      const email = (t.email || '').toLowerCase();
      if (!email) {
        console.warn(`Registro sin correo, id=${doc.id}`);
        continue;
      }

      // Verificar si ya existe usuario Auth
      let exists = null;
      try {
        exists = await admin.auth().getUserByEmail(email);
      } catch (e) {
        // ignore if not found
      }
      if (exists) {
        console.log(`Ya existe usuario Auth para ${email} (uid=${exists.uid})`);
        continue;
      }

      // crear con contraseña por defecto
      const defaultPwd = 'Teacher123!';
      try {
        const user = await admin.auth().createUser({ email, password: defaultPwd });
        console.log(`Usuario creado para ${email} uid=${user.uid} contraseña='${defaultPwd}'`);
      } catch (e) {
        console.error(`Error creando usuario ${email}:`, e);
      }
    }
  } catch (err) {
    console.error('Error sincronizando docentes:', err);
  } finally {
    try { await admin.app().delete(); } catch (e) {}
  }
}

syncTeachers();
