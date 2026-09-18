import { signUpWithEmail } from './authService';

export async function createUserByEmail(email, password, profile = {}) {
  return signUpWithEmail(email, password, profile);
}

export default { createUserByEmail };
