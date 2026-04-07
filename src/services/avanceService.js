/**
 * SERMA - Servicio de Avances Académicos
 * Guarda y consulta registros de avance por estudiante/materia/docente
 */

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { storageService } from './storageService';

const AVANCES_COLLECTION = 'avances';

export const createAdvance = async (advanceData) => {
  try {
    // Use a single `progress` field (accept `avance` as alias).
    const progressVal = advanceData.progress !== undefined
      ? Number(advanceData.progress)
      : (advanceData.avance !== undefined ? Number(advanceData.avance) : 0);

    const dataToSave = {
      ...advanceData,
      progress: Number(isNaN(progressVal) ? 0 : progressVal),
      average: Math.round(Number(isNaN(progressVal) ? 0 : progressVal) * 100) / 100,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Remove legacy stage fields if present so they are not persisted
    delete dataToSave.stage1;
    delete dataToSave.stage2;
    delete dataToSave.stage3;
    delete dataToSave.stage4;

    const docRef = await addDoc(collection(db, AVANCES_COLLECTION), dataToSave);
    const saved = { id: docRef.id, ...dataToSave };

    // guardar backup local
    const all = storageService.getItem('all_avances') || [];
    storageService.setItem(`avance_${docRef.id}`, saved);
    storageService.setItem('all_avances', [saved, ...all]);

    // Also update the student's `users` document subjectProgress map (case-insensitive by slug)
    try {
      if (advanceData.studentId && advanceData.subjectId) {
        // get subject name
        const subjectRef = doc(db, 'subjects', advanceData.subjectId);
        const subjectSnap = await getDoc(subjectRef);
        let subjectName = subjectSnap.exists() ? subjectSnap.data().name : null;

        if (!subjectName && advanceData.subjectName) subjectName = advanceData.subjectName;

        if (subjectName) {
          const slug = slugify(subjectName);
          // get student to find matching user by cedula/documentId
          const studentRef = doc(db, 'students', advanceData.studentId);
          const studentSnap = await getDoc(studentRef);
          const studentData = studentSnap.exists() ? studentSnap.data() : null;

          if (studentData && studentData.documentId) {
            const usersQ = query(collection(db, 'users'), where('cedula', '==', studentData.documentId));
            const usersSnap = await getDocs(usersQ);
            if (usersSnap.empty) {
              // No user found: create new user document from student data
              if (studentData && studentData.documentId) {
                const newUser = {
                  cedula: studentData.documentId,
                  email: studentData.email || '',
                  grade: studentData.grade ? Number(studentData.grade) : 0,
                  lastName: studentData.lastName || '',
                  name: studentData.firstName || studentData.name || '',
                  subjectProgress: { [slug]: Number(dataToSave.progress) },
                  createdAt: Timestamp.now(),
                };
                try {
                  await addDoc(collection(db, 'users'), newUser);
                } catch (err) {
                  console.warn('No se pudo crear usuario automáticamente:', err);
                }
              }
            } else {
              usersSnap.forEach(async (u) => {
                const userRef = doc(db, 'users', u.id);
                const field = `subjectProgress.${slug}`;
                const updateObj = { [field]: Number(dataToSave.progress) };

                // fill user fields from student data when available
                if (studentData) {
                  if (studentData.documentId) updateObj.cedula = studentData.documentId;
                  if (studentData.email) updateObj.email = studentData.email;
                  if (studentData.grade !== undefined) updateObj.grade = Number(studentData.grade) || 0;
                  if (studentData.firstName) updateObj.name = studentData.firstName;
                  if (studentData.lastName) updateObj.lastName = studentData.lastName;
                }

                try {
                  await updateDoc(userRef, updateObj);
                } catch (err) {
                  console.warn('No se pudo actualizar user automáticamente:', err);
                }
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('No se actualizó subjectProgress en users:', e);
    }

    return saved;
  } catch (error) {
    console.error('Error creando avance:', error);
    throw error;
  }
};

export const getAdvancesBySubject = async (subjectId) => {
  try {
    const q = query(collection(db, AVANCES_COLLECTION), where('subjectId', '==', subjectId));
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
    storageService.setItem(`avances_subject_${subjectId}`, list);
    return list;
  } catch (error) {
    console.error('Error obteniendo avances por materia:', error);
    return storageService.getItem(`avances_subject_${subjectId}`) || [];
  }
};

export const getAdvancesByStudentAndSubject = async (studentId, subjectId) => {
  try {
    const q = query(
      collection(db, AVANCES_COLLECTION),
      where('studentId', '==', studentId),
      where('subjectId', '==', subjectId)
    );
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
    return list.sort((a, b) => (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0) - (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0));
  } catch (error) {
    console.error('Error obteniendo avances por estudiante y materia:', error);
    return [];
  }
};

export const getLatestAdvanceForStudentSubject = async (studentId, subjectId) => {
  const list = await getAdvancesByStudentAndSubject(studentId, subjectId);
  if (!list || list.length === 0) return null;
  return list[list.length - 1];
};

export const updateAdvance = async (advanceId, updates) => {
  try {
    // Normalize to a single `progress` value and recompute average
    const progressVal = updates.progress !== undefined
      ? Number(updates.progress)
      : (updates.avance !== undefined ? Number(updates.avance) : 0);

    const toSave = { ...updates, updatedAt: Timestamp.now() };
    toSave.progress = Number(isNaN(progressVal) ? 0 : progressVal);
    toSave.average = Math.round(Number(isNaN(progressVal) ? 0 : progressVal) * 100) / 100;

    // Remove legacy stage fields if present so they are not persisted
    delete toSave.stage1;
    delete toSave.stage2;
    delete toSave.stage3;
    delete toSave.stage4;

    const ref = doc(db, AVANCES_COLLECTION, advanceId);
    await updateDoc(ref, toSave);

    // actualizar backup local simple
    const saved = storageService.getItem(`avance_${advanceId}`) || {};
    const merged = { ...saved, ...toSave, updatedAt: new Date().toISOString() };
    storageService.setItem(`avance_${advanceId}`, merged);
    // Sync users.subjectProgress when advance updated (if subjectId and studentId present)
    try {
      if (merged.studentId && merged.subjectId) {
        const subjectRef = doc(db, 'subjects', merged.subjectId);
        const subjectSnap = await getDoc(subjectRef);
        let subjectName = subjectSnap.exists() ? subjectSnap.data().name : null;
        if (!subjectName && merged.subjectName) subjectName = merged.subjectName;

        if (subjectName) {
          const slug = slugify(subjectName);
          const studentRef = doc(db, 'students', merged.studentId);
          const studentSnap = await getDoc(studentRef);
          const studentData = studentSnap.exists() ? studentSnap.data() : null;
          if (studentData && studentData.documentId) {
            const usersQ = query(collection(db, 'users'), where('cedula', '==', studentData.documentId));
            const usersSnap = await getDocs(usersQ);
            if (usersSnap.empty) {
              // If no user exists, optionally create one from studentData
              if (studentData && studentData.documentId) {
                const newUser = {
                  cedula: studentData.documentId,
                  email: studentData.email || '',
                  grade: studentData.grade ? Number(studentData.grade) : 0,
                  lastName: studentData.lastName || '',
                  name: studentData.firstName || studentData.name || '',
                  subjectProgress: { [slug]: Number(toSave.progress) },
                  updatedAt: Timestamp.now(),
                };
                try {
                  await addDoc(collection(db, 'users'), newUser);
                } catch (err) {
                  console.warn('No se pudo crear usuario automáticamente al actualizar avance:', err);
                }
              }
            } else {
              usersSnap.forEach(async (u) => {
                const userRef = doc(db, 'users', u.id);
                const field = `subjectProgress.${slug}`;
                const updateObj = { [field]: Number(toSave.progress) };

                if (studentData) {
                  if (studentData.documentId) updateObj.cedula = studentData.documentId;
                  if (studentData.email) updateObj.email = studentData.email;
                  if (studentData.grade !== undefined) updateObj.grade = Number(studentData.grade) || 0;
                  if (studentData.firstName) updateObj.name = studentData.firstName;
                  if (studentData.lastName) updateObj.lastName = studentData.lastName;
                }

                try {
                  await updateDoc(userRef, updateObj);
                } catch (err) {
                  console.warn('No se pudo actualizar user automáticamente al actualizar avance:', err);
                }
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('No se sincronizó subjectProgress en users al actualizar avance:', e);
    }
    return merged;
  } catch (error) {
    console.error('Error actualizando avance:', error);
    throw error;
  }
};

export const getAdvancesByTeacher = async (teacherId) => {
  try {
    const q = query(collection(db, AVANCES_COLLECTION), where('teacherId', '==', teacherId));
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
    return list;
  } catch (error) {
    console.error('Error obteniendo avances por docente:', error);
    return [];
  }
};

function slugify(s) {
  if (!s) return '';
  return s
    .toString()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const avanceService = {
  createAdvance,
  getAdvancesBySubject,
  getAdvancesByStudentAndSubject,
  getLatestAdvanceForStudentSubject,
  updateAdvance,
  getAdvancesByTeacher,
};

export default avanceService;
