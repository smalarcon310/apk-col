import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const GUARDIANS_COLLECTION = 'guardians';

/**
 * Crea un vínculo entre un usuario (authUid) y un estudiante (studentId).
 * @param {string} authUid - UID del usuario en Firebase Auth.
 * @param {string} studentId - ID del estudiante enlazado.
 * @returns {Promise<Object>} Documento guardado.
 */
export const createGuardian = async (authUid, studentId) => {
  try {
    const data = {
      authUid,
      studentId,
      createdAt: Timestamp.now(),
    };
    const ref = await addDoc(collection(db, GUARDIANS_COLLECTION), data);
    return { id: ref.id, ...data };
  } catch (error) {
    console.error('Error creando guardian:', error);
    throw error;
  }
};

/**
 * Busca un documento de guardian por UID de autenticación.
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
export const getGuardianByUid = async (uid) => {
  try {
    const q = query(
      collection(db, GUARDIANS_COLLECTION),
      where('authUid', '==', uid)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error obteniendo guardian por UID:', error);
    return null;
  }
};

const guardianService = {
  createGuardian,
  getGuardianByUid,
};

export default guardianService;
