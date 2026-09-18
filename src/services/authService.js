import { mysqlRequest } from './mysqlApi';

export async function signInWithEmail(email, password) {
  const user = await mysqlRequest('/api/auth/login', { method: 'POST', body: { email, password } });
  localStorage.setItem('sessionUser', JSON.stringify(user));
  localStorage.setItem('userData', JSON.stringify(user));
  return { uid: user.id, email: user.email, displayName: user.name, ...user };
}

export async function signUpWithEmail(email, password, profile = {}) {
  const user = await mysqlRequest('/api/auth/register', { method: 'POST', body: { email, password, ...profile } });
  localStorage.setItem('sessionUser', JSON.stringify(user));
  localStorage.setItem('userData', JSON.stringify(user));
  return { uid: user.id, email: user.email, displayName: user.name, ...user };
}

export function signOut() {
  localStorage.removeItem('sessionUser');
  localStorage.removeItem('userData');
  localStorage.removeItem('firebaseUID');
  return Promise.resolve();
}

export function signInWithGoogle() {
  return Promise.reject(new Error('El acceso con Google fue retirado. Usa correo y contraseña.'));
}

export function sendPasswordReset() {
  return Promise.reject(new Error('La recuperación de contraseña debe configurarse en el servidor MySQL.'));
}

export default { signInWithEmail, signUpWithEmail, signOut, signInWithGoogle, sendPasswordReset };
