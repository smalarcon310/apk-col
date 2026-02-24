import { signInWithEmailAndPassword, signOut as fbSignOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail as fbSendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

export async function signInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signUpWithEmail(email, password) {
  // create user with email and password
  const { createUserWithEmailAndPassword } = await import('firebase/auth');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOut() {
  await fbSignOut(auth);
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function sendPasswordReset(email) {
  await fbSendPasswordResetEmail(auth, email);
}

export default { signInWithEmail, signOut, signInWithGoogle, signUpWithEmail, sendPasswordReset };
