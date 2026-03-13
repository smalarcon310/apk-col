/**
 * SERMA - Servicio de Profesores
 * CRUD y validaciones ligeras para perfiles de profesores
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { storageService } from './storageService';
import { validateEmail, validatePhone, validateDocument } from '../utils/validations';

const TEACHERS_COLLECTION = 'teachers';

export const createTeacher = async (teacherData) => {
  try {
    const validation = validateTeacherData(teacherData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Verificar documento único
    const existing = await getTeacherByDocument(teacherData.documentId);
    if (existing) {
      throw new Error('Ya existe un profesor con este documento');
    }

    // We purposely do not persist the password in Firestore;
    // authentication is handled by Firebase Auth.  Make a copy of the
    // teacher data without the password field.
    const { password, confirmPassword, ...cleanData } = teacherData;
    const dataToSave = {
      ...cleanData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, TEACHERS_COLLECTION), dataToSave);

    const saved = { id: docRef.id, ...dataToSave };
    storageService.setItem(`teacher_${docRef.id}`, saved);

    // actualizar listado cache
    const all = (storageService.getItem('all_teachers') || []).concat(saved);
    storageService.setItem('all_teachers', all);

    return saved;
  } catch (error) {
    console.error('Error creando profesor:', error);
    throw error;
  }
};

export const getAllTeachers = async () => {
  try {
    const q = query(collection(db, TEACHERS_COLLECTION));
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
    storageService.setItem('all_teachers', list);
    return list;
  } catch (error) {
    console.error('Error obteniendo profesores:', error);
    return storageService.getItem('all_teachers') || [];
  }
};

export const getTeacherById = async (id) => {
  try {
    const snapshot = await getDocs(query(collection(db, TEACHERS_COLLECTION)));
    let found = null;
    snapshot.forEach((d) => {
      if (d.id === id) found = { id: d.id, ...d.data() };
    });
    if (found) storageService.setItem(`teacher_${id}`, found);
    return found;
  } catch (error) {
    console.error('Error obteniendo profesor por ID:', error);
    return storageService.getItem(`teacher_${id}`) || null;
  }
};

export const getTeacherByDocument = async (documentId) => {
  try {
    const q = query(collection(db, TEACHERS_COLLECTION), where('documentId', '==', documentId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() };
  } catch (error) {
    console.error('Error buscando profesor por documento:', error);
    return null;
  }
};

export const updateTeacher = async (id, updates) => {
  try {
    const validation = validateTeacherData(updates, true);
    if (!validation.isValid) throw new Error(validation.errors.join(', '));

    if (updates.documentId) {
      const existing = await getTeacherByDocument(updates.documentId);
      if (existing && existing.id !== id) throw new Error('Otro profesor ya usa ese documento');
    }

    const ref = doc(db, TEACHERS_COLLECTION, id);
    await updateDoc(ref, { ...updates, updatedAt: Timestamp.now() });

    // actualizar cache local (simple)
    const list = storageService.getItem('all_teachers') || [];
    const idx = list.findIndex((t) => t.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      storageService.setItem('all_teachers', list);
    }
  } catch (error) {
    console.error('Error actualizando profesor:', error);
    throw error;
  }
};

export const deleteTeacher = async (id) => {
  try {
    const ref = doc(db, TEACHERS_COLLECTION, id);
    await deleteDoc(ref);
    storageService.removeItem(`teacher_${id}`);
    const list = (storageService.getItem('all_teachers') || []).filter((t) => t.id !== id);
    storageService.setItem('all_teachers', list);
  } catch (error) {
    console.error('Error eliminando profesor:', error);
    throw error;
  }
};

function validateTeacherData(data, isPartial = false) {
  const errors = [];
  if (!isPartial) {
    if (!data.firstName || data.firstName.trim() === '') errors.push('Nombre es obligatorio');
    if (!data.lastName || data.lastName.trim() === '') errors.push('Apellido es obligatorio');
    if (!data.documentId || !validateDocument(data.documentId)) errors.push('Documento inválido');
    if (!data.email || !validateEmail(data.email)) errors.push('Email inválido');
    if (!data.phone || !validatePhone(data.phone)) errors.push('Teléfono inválido');
    // password is not validated here; authentication lives in Firebase Auth
  } else {
    if (data.documentId !== undefined && !validateDocument(data.documentId)) errors.push('Documento inválido');
    if (data.email !== undefined && !validateEmail(data.email)) errors.push('Email inválido');
    if (data.phone !== undefined && !validatePhone(data.phone)) errors.push('Teléfono inválido');
    // ignore password on partial updates
  }
  return { isValid: errors.length === 0, errors };
}

export default {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
};
