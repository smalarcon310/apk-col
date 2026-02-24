/**
 * SERMA - Servicio de Estudiantes
 * CRUD completo y validaciones para estudiantes
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
import { validateEmail, validatePhone, validateDocument } from '../utils/validations';

const STUDENTS_COLLECTION = 'students';

/**
 * Crear un nuevo estudiante
 * @param {Object} studentData - Datos del estudiante
 * @returns {Promise<Object>} Documento creado con ID
 */
export const createStudent = async (studentData) => {
  try {
    // Validaciones
    const validation = validateStudentData(studentData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Verificar documento único
    const existingStudent = await getStudentByDocument(studentData.documentId);
    if (existingStudent) {
      throw new Error('Ya existe un estudiante con este documento de identidad');
    }

    const dataToSave = {
      ...studentData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), dataToSave);
    
    // Guardar en backup local
    storageService.setItem(`student_${docRef.id}`, {
      id: docRef.id,
      ...dataToSave,
    });

    return {
      id: docRef.id,
      ...dataToSave,
    };
  } catch (error) {
    console.error('Error creando estudiante:', error);
    throw error;
  }
};

/**
 * Obtener todos los estudiantes
 * @returns {Promise<Array>} Lista de estudiantes
 */
export const getAllStudents = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, STUDENTS_COLLECTION));
    const students = [];

    querySnapshot.forEach((doc) => {
      students.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Guardar en backup local
    storageService.setItem('all_students', students);

    return students;
  } catch (error) {
    console.error('Error obteniendo estudiantes:', error);
    // Intentar obtener del backup local
    return storageService.getItem('all_students') || [];
  }
};

/**
 * Obtener estudiante por ID
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Object>} Datos del estudiante
 */
export const getStudentById = async (studentId) => {
  try {
    const docRef = doc(db, STUDENTS_COLLECTION, studentId);
    const docSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
    
    let student = null;
    docSnap.forEach((doc) => {
      if (doc.id === studentId) {
        student = {
          id: doc.id,
          ...doc.data(),
        };
      }
    });

    if (student) {
      storageService.setItem(`student_${studentId}`, student);
    }

    return student;
  } catch (error) {
    console.error('Error obteniendo estudiante:', error);
    return storageService.getItem(`student_${studentId}`);
  }
};

/**
 * Obtener estudiante por número de documento
 * @param {string} documentId - Número de documento
 * @returns {Promise<Object|null>} Estudiante encontrado o null
 */
export const getStudentByDocument = async (documentId) => {
  try {
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where('documentId', '==', documentId)
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
    console.error('Error buscando estudiante por documento:', error);
    return null;
  }
};

/**
 * Obtener estudiantes por curso
 * @param {string} courseId - ID del curso
 * @returns {Promise<Array>} Estudiantes del curso
 */
export const getStudentsByCourse = async (courseId) => {
  try {
    const q = query(
      collection(db, STUDENTS_COLLECTION),
      where('courseId', '==', courseId)
    );

    const querySnapshot = await getDocs(q);
    const students = [];

    querySnapshot.forEach((doc) => {
      students.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    storageService.setItem(`students_course_${courseId}`, students);

    return students;
  } catch (error) {
    console.error('Error obteniendo estudiantes del curso:', error);
    return storageService.getItem(`students_course_${courseId}`) || [];
  }
};

/**
 * Actualizar estudiante
 * @param {string} studentId - ID del estudiante
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<void>}
 */
export const updateStudent = async (studentId, updates) => {
  try {
    const validation = validateStudentData(updates, true);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Si se actualiza documento, verificar que sea único
    if (updates.documentId) {
      const existingStudent = await getStudentByDocument(updates.documentId);
      if (existingStudent && existingStudent.id !== studentId) {
        throw new Error('Ya existe otro estudiante con este documento');
      }
    }

    const docRef = doc(db, STUDENTS_COLLECTION, studentId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    // Actualizar backup local
    const student = await getStudentById(studentId);
    storageService.setItem(`student_${studentId}`, student);
  } catch (error) {
    console.error('Error actualizando estudiante:', error);
    throw error;
  }
};

/**
 * Eliminar estudiante
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<void>}
 */
export const deleteStudent = async (studentId) => {
  try {
    const docRef = doc(db, STUDENTS_COLLECTION, studentId);
    await deleteDoc(docRef);

    // Limpiar backup local
    storageService.removeItem(`student_${studentId}`);
  } catch (error) {
    console.error('Error eliminando estudiante:', error);
    throw error;
  }
};

/**
 * Escuchar cambios en estudiantes en tiempo real
 * @param {Function} callback - Función a ejecutar cuando hay cambios
 * @returns {Function} Función para desuscribirse
 */
export const onStudentsChange = (callback) => {
  try {
    return onSnapshot(collection(db, STUDENTS_COLLECTION), (snapshot) => {
      const students = [];
      snapshot.forEach((doc) => {
        students.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(students);
    });
  } catch (error) {
    console.error('Error escuchando cambios de estudiantes:', error);
    return () => {};
  }
};

/**
 * Validar datos del estudiante
 * @param {Object} data - Datos a validar
 * @param {boolean} isPartial - Si es actualización parcial
 * @returns {Object} {isValid, errors}
 */
function validateStudentData(data, isPartial = false) {
  const errors = [];

  if (!isPartial) {
    // Validaciones obligatorias para crear
    if (!data.firstName || data.firstName.trim() === '') {
      errors.push('El nombre es obligatorio');
    }
    if (!data.lastName || data.lastName.trim() === '') {
      errors.push('El apellido es obligatorio');
    }
    if (!data.documentId || data.documentId.trim() === '') {
      errors.push('El documento es obligatorio');
    } else if (!validateDocument(data.documentId)) {
      errors.push('Formato de documento inválido');
    }
    if (!data.grade || !['6', '7', '8', '9', '10', '11'].includes(data.grade)) {
      errors.push('Grado inválido (debe ser 6-11)');
    }
    if (!data.email || !validateEmail(data.email)) {
      errors.push('Email inválido');
    }
    if (!data.phone || !validatePhone(data.phone)) {
      errors.push('Teléfono inválido (debe ser 10 dígitos)');
    }
    if (!data.courseId || data.courseId.trim() === '') {
      errors.push('Debe seleccionar un curso');
    }
  } else {
    // Validaciones parciales para actualizar
    if (data.firstName !== undefined && data.firstName.trim() === '') {
      errors.push('El nombre no puede estar vacío');
    }
    if (data.lastName !== undefined && data.lastName.trim() === '') {
      errors.push('El apellido no puede estar vacío');
    }
    if (data.documentId !== undefined && !validateDocument(data.documentId)) {
      errors.push('Formato de documento inválido');
    }
    if (data.grade !== undefined && !['6', '7', '8', '9', '10', '11'].includes(data.grade)) {
      errors.push('Grado inválido (debe ser 6-11)');
    }
    if (data.email !== undefined && !validateEmail(data.email)) {
      errors.push('Email inválido');
    }
    if (data.phone !== undefined && !validatePhone(data.phone)) {
      errors.push('Teléfono inválido (debe ser 10 dígitos)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
