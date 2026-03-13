/**
 * SERMA - Configuración de Firebase
 * Inicializa Firestore y Firebase Authentication
 * Proporciona referencias a las colecciones principales
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Configuración de Firebase - Proyecto APK-COL
// Se permite sobrescribir la clave de API mediante variable de
// entorno (`REACT_APP_FIREBASE_API_KEY`) para que los despliegues y
// pruebas puedan usar distintos proyectos sin modificar el código.
// La clave que se encuentra en `google-services.json` (anexado por el
// usuario) es "AIzaSyB4euOKx72vSDnWMhSuYXXGypi9LZXy76A".
const firebaseConfig = {
  apiKey:
    process.env.REACT_APP_FIREBASE_API_KEY ||
    "AIzaSyB4euOKx72vSDnWMhSuYXXGypi9LZXy76A",
  authDomain: "apk-col-3ea52.firebaseapp.com",
  databaseURL: "https://apk-col-3ea52-default-rtdb.firebaseio.com",
  projectId: "apk-col-3ea52",
  storageBucket: "apk-col-3ea52.firebasestorage.app",
  messagingSenderId: "49161508595",
  appId: "1:49161508595:web:a61f3abd063d094dcd4986",
  measurementId: "G-VSDT02WSWD"
};

// también exportamos el objeto de configuración original para que otros
// módulos (como authAdminService) puedan recuperarlo sin tener que
// inspeccionar la instancia de la app.
export const firebaseConfigObject = firebaseConfig;

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

// Inicializar Authentication
export const auth = getAuth(app);

// Conectar a emuladoras locales (solo desarrollo)
if (process.env.REACT_APP_USE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  } catch (error) {
    console.log("Auth Emulator ya está conectado");
  }
  
  try {
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch (error) {
    console.log("Firestore Emulator ya está conectado");
  }
}

export default app;

