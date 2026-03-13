// Helpers for performing Firebase Auth operations without affecting current client session
// Used by privileged modules (like teacher creation) to register new users.

// Import the original configuration object so we can reliably read the
// API key.  The default export from config/firebase is the initialized app
// instance, which may not always expose the raw config in a consistent
// manner (especially after build/time‑of‑execution).  Previously we were
// falling back to `firebaseConfig?.options?.apiKey` which occasionally
// produced `undefined` resulting in invalid key errors.
import app, { firebaseConfigObject } from '../config/firebase';

// Prefer explicit environment variable (useful for CI / deploys), then
// try the static config export.  We avoid inspecting the `app` object
// directly to keep behaviour deterministic.
const API_KEY =
  process.env.REACT_APP_FIREBASE_API_KEY ||
  firebaseConfigObject?.apiKey;

if (!API_KEY) {
  console.warn(
    'No se pudo obtener la clave de API de Firebase; las operaciones de administración fallarán.'
  );
}

export async function createUserByEmail(email, password) {
  if (!email || !password) throw new Error('Email/password required');
  if (!API_KEY) throw new Error('Clave de API de Firebase desconocida');

  const key = API_KEY.toString().trim();
  // simple sanity check: Firebase API keys usually start with "AIza" and
  // are 39 characters long; if something else is present we fail early.
  if (!/^AIza[0-9A-Za-z\-_]{35}$/.test(key)) {
    console.error('API key inválida detectada en authAdminService:', key);
    throw new Error('Clave de API de Firebase inválida o mal configurada');
  }

  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: false }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    let msg = 'Error creando usuario';
    let code = data.error && data.error.message;
    // map Firebase error codes to Spanish messages
    switch (code) {
      case 'EMAIL_EXISTS':
        msg = 'El correo ya está registrado en el sistema.';
        break;
      case 'INVALID_API_KEY':
        msg = 'Clave de API inválida. Verifica tu configuración de Firebase.';
        break;
      case 'WEAK_PASSWORD : Password should be at least 6 characters':
        msg = 'La contraseña debe tener al menos 6 caracteres.';
        break;
      default:
        if (data.error && data.error.message) msg = data.error.message;
    }
    const err = new Error(msg);
    err.code = code;
    throw err;
  }
  // data.localId is the new UID
  return data;
}

export default { createUserByEmail };