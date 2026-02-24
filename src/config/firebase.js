/**
 * SERMA - Configuración de Firebase
 * Inicializa Firestore y Firebase Authentication
 * Proporciona referencias a las colecciones principales
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Configuración de Firebase - Proyecto APK-COL
const firebaseConfig = {
  apiKey: "AIzaSyC3FHfBmku5phEYkFs6NFYoRvvOrxJQvuY",
  authDomain: "apk-col-3ea52.firebaseapp.com",
  databaseURL: "https://apk-col-3ea52-default-rtdb.firebaseio.com",
  projectId: "apk-col-3ea52",
  storageBucket: "apk-col-3ea52.firebasestorage.app",
  messagingSenderId: "49161508595",
  appId: "1:49161508595:web:a61f3abd063d094dcd4986",
  measurementId: "G-VSDT02WSWD"
};

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
