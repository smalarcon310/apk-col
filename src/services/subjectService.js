/**
 * SERMA - Servicio de Materias
 * CRUD completo y validaciones para materias
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
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { storageService } from './storageService';

const SUBJECTS_COLLECTION = 'subjects';

/**
 * Crear una nueva materia
 * @param {Object} subjectData - Datos de la materia
 * @returns {Promise<Object>} Materia creada con ID
 */
export const createSubject = async (subjectData) => {
  try {
    const validation = validateSubjectData(subjectData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Verificar nombre único por curso
    const existingSubject = await getSubjectByCriteria({
      name: subjectData.name,
      courseId: subjectData.courseId,
    });

    if (existingSubject) {
      throw new Error('Ya existe una materia con este nombre en este curso');
    }

    const dataToSave = {
      ...subjectData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, SUBJECTS_COLLECTION), dataToSave);

    // Guardar en backup local
    storageService.setItem(`subject_${docRef.id}`, {
      id: docRef.id,
      ...dataToSave,
    });

    return {
      id: docRef.id,
      ...dataToSave,
    };
  } catch (error) {
    console.error('Error creando materia:', error);
    throw error;
  }
};

/**
 * Obtener todas las materias
 * @returns {Promise<Array>} Lista de materias
 */
export const getAllSubjects = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, SUBJECTS_COLLECTION));
    const subjects = [];

    querySnapshot.forEach((doc) => {
      subjects.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    storageService.setItem('all_subjects', subjects);
    return subjects;
  } catch (error) {
    console.error('Error obteniendo materias:', error);
    return storageService.getItem('all_subjects') || [];
  }
};

/**
 * Obtener materia por ID
 * @param {string} subjectId - ID de la materia
 * @returns {Promise<Object>} Datos de la materia
 */
export const getSubjectById = async (subjectId) => {
  try {
    const querySnapshot = await getDocs(collection(db, SUBJECTS_COLLECTION));
    
    let subject = null;
    querySnapshot.forEach((doc) => {
      if (doc.id === subjectId) {
        subject = {
          id: doc.id,
          ...doc.data(),
        };
      }
    });

    if (subject) {
      storageService.setItem(`subject_${subjectId}`, subject);
    }

    return subject;
  } catch (error) {
    console.error('Error obteniendo materia:', error);
    return storageService.getItem(`subject_${subjectId}`);
  }
};

/**
 * Obtener materias por curso
 * @param {string} courseId - ID del curso
 * @returns {Promise<Array>} Materias del curso
 */
export const getSubjectsByCourse = async (courseId) => {
  try {
    const q = query(
      collection(db, SUBJECTS_COLLECTION),
      where('courseId', '==', courseId)
    );

    const querySnapshot = await getDocs(q);
    const subjects = [];

    querySnapshot.forEach((doc) => {
      subjects.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    storageService.setItem(`subjects_course_${courseId}`, subjects);
    return subjects;
  } catch (error) {
    console.error('Error obteniendo materias del curso:', error);
    return storageService.getItem(`subjects_course_${courseId}`) || [];
  }
};

/**
 * Obtener materias por docente
 * acepta `teacherId` (preferido) o `teacher` nombre (fallback)
 * @param {Object} options - { teacherId?, teacherName? }
 * @returns {Promise<Array>} Materias del docente
 */
export const getSubjectsByTeacher = async (options) => {
  try {
    let q;
    if (options && options.teacherId) {
      q = query(collection(db, SUBJECTS_COLLECTION), where('teacherId', '==', options.teacherId));
    } else if (options && options.teacherName) {
      q = query(collection(db, SUBJECTS_COLLECTION), where('teacher', '==', options.teacherName));
    } else {
      return [];
    }

    const querySnapshot = await getDocs(q);
    const subjects = [];

    querySnapshot.forEach((doc) => {
      subjects.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // cache key depends on what was requested
    const cacheKey = options.teacherId ? `subjects_teacherId_${options.teacherId}` : `subjects_teacher_${options.teacherName}`;
    storageService.setItem(cacheKey, subjects);
    return subjects;
  } catch (error) {
    console.error('Error obteniendo materias del docente:', error);
    const cacheKey = options && (options.teacherId ? `subjects_teacherId_${options.teacherId}` : `subjects_teacher_${options.teacherName}`);
    return storageService.getItem(cacheKey) || [];
  }
};

/**
 * Obtener materia por criterios
 * @param {Object} criteria - Criterios de búsqueda
 * @returns {Promise<Object|null>} Materia encontrada o null
 */
export const getSubjectByCriteria = async (criteria) => {
  try {
    const q = query(
      collection(db, SUBJECTS_COLLECTION),
      where('name', '==', criteria.name),
      where('courseId', '==', criteria.courseId)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data(),
    };
  } catch (error) {
    console.error('Error buscando materia:', error);
    return null;
  }
};

/**
 * Actualizar materia
 * @param {string} subjectId - ID de la materia
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<void>}
 */
export const updateSubject = async (subjectId, updates) => {
  try {
    const validation = validateSubjectData(updates, true);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const docRef = doc(db, SUBJECTS_COLLECTION, subjectId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    const subject = await getSubjectById(subjectId);
    storageService.setItem(`subject_${subjectId}`, subject);
  } catch (error) {
    console.error('Error actualizando materia:', error);
    throw error;
  }
};

/**
 * Eliminar materia
 * @param {string} subjectId - ID de la materia
 * @returns {Promise<void>}
 */
export const deleteSubject = async (subjectId) => {
  try {
    // En futuras fases: verificar que no tenga avances registrados
    // Por ahora, permitir eliminación directa

    const docRef = doc(db, SUBJECTS_COLLECTION, subjectId);
    await deleteDoc(docRef);

    storageService.removeItem(`subject_${subjectId}`);
  } catch (error) {
    console.error('Error eliminando materia:', error);
    throw error;
  }
};

/**
 * Escuchar cambios en materias en tiempo real
 * @param {Function} callback - Función a ejecutar cuando hay cambios
 * @returns {Function} Función para desuscribirse
 */
export const onSubjectsChange = (callback) => {
  try {
    return onSnapshot(collection(db, SUBJECTS_COLLECTION), (snapshot) => {
      const subjects = [];
      snapshot.forEach((doc) => {
        subjects.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(subjects);
    });
  } catch (error) {
    console.error('Error escuchando cambios de materias:', error);
    return () => {};
  }
};

/**
 * Escuchar cambios en materias de un curso específico
 * @param {string} courseId - ID del curso
 * @param {Function} callback - Función a ejecutar cuando hay cambios
 * @returns {Function} Función para desuscribirse
 */
export const onSubjectsCourseChange = (courseId, callback) => {
  try {
    const q = query(
      collection(db, SUBJECTS_COLLECTION),
      where('courseId', '==', courseId)
    );

    return onSnapshot(q, (snapshot) => {
      const subjects = [];
      snapshot.forEach((doc) => {
        subjects.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(subjects);
    });
  } catch (error) {
    console.error('Error escuchando cambios de materias del curso:', error);
    return () => {};
  }
};

/**
 * Validar datos de la materia
 * @param {Object} data - Datos a validar
 * @param {boolean} isPartial - Si es actualización parcial
 * @returns {Object} {isValid, errors}
 */
function validateSubjectData(data, isPartial = false) {
  const errors = [];

  if (!isPartial) {
    if (!data.name || data.name.trim() === '') {
      errors.push('El nombre de la materia es obligatorio');
    }
    if (!data.courseId || data.courseId.trim() === '') {
      errors.push('Debe seleccionar un curso');
    }
    // Accept either teacherId (preferred) or teacher name for backward compatibility
    if ((!data.teacherId || data.teacherId.trim() === '') && (!data.teacher || data.teacher.trim() === '')) {
      errors.push('El docente es obligatorio (proporcione teacherId o teacher)');
    }
  } else {
    if (data.name !== undefined && data.name.trim() === '') {
      errors.push('El nombre no puede estar vacío');
    }
    if (data.courseId !== undefined && data.courseId.trim() === '') {
      errors.push('Debe seleccionar un curso');
    }
    if (data.teacher !== undefined && data.teacher.trim() === '') {
      errors.push('El nombre del docente no puede estar vacío');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
