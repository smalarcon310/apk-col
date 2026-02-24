const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin SDK usando el archivo firebase-key.json del repo
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../firebase-key.json');

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath))
});

async function createRectorUser() {
  const email = 'sergioalarcon310@gmail.com';
  const password = 'RectorPass123!'; // Cambia esta contraseña después de crear el usuario

  try {
    // Comprobar si ya existe
    const existing = await admin.auth().getUserByEmail(email).catch(() => null);
    if (existing) {
      console.log('El usuario ya existe en Firebase Auth. UID:', existing.uid);
    } else {
      const user = await admin.auth().createUser({ email, password });
      console.log('Usuario rector creado con UID:', user.uid);
    }
  } catch (err) {
    console.error('Error creando/consultando usuario:', err);
  } finally {
    try { await admin.app().delete(); } catch (e) {}
  }
}

createRectorUser();
