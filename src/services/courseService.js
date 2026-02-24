/**
 * SERMA - Servicio de Cursos
 * CRUD completo y validaciones para cursos
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
import { getStudentsByCourse } from './studentService';
import { getSubjectsByCourse } from './subjectService';

const COURSES_COLLECTION = 'courses';

/**
 * Crear un nuevo curso
 * @param {Object} courseData - Datos del curso
 * @returns {Promise<Object>} Curso creado con ID
 */
export const createCourse = async (courseData) => {
  try {
    const validation = validateCourseData(courseData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Verificar nombre único por año académico
    const existingCourse = await getCourseByCriteria({
      name: courseData.name,
      academicYear: courseData.academicYear,
    });

    if (existingCourse) {
      throw new Error('Ya existe un curso con este nombre en este año académico');
    }

    const dataToSave = {
      ...courseData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COURSES_COLLECTION), dataToSave);

    // Guardar en backup local
    storageService.setItem(`course_${docRef.id}`, {
      id: docRef.id,
      ...dataToSave,
    });

    return {
      id: docRef.id,
      ...dataToSave,
    };
  } catch (error) {
    console.error('Error creando curso:', error);
    throw error;
  }
};

/**
 * Obtener todos los cursos
 * @returns {Promise<Array>} Lista de cursos
 */
export const getAllCourses = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COURSES_COLLECTION));
    const courses = [];

    querySnapshot.forEach((doc) => {
      courses.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    storageService.setItem('all_courses', courses);
    return courses;
  } catch (error) {
    console.error('Error obteniendo cursos:', error);
    return storageService.getItem('all_courses') || [];
  }
};

/**
 * Obtener curso por ID
 * @param {string} courseId - ID del curso
 * @returns {Promise<Object>} Datos del curso
 */
export const getCourseById = async (courseId) => {
  try {
    const querySnapshot = await getDocs(collection(db, COURSES_COLLECTION));
    
    let course = null;
    querySnapshot.forEach((doc) => {
      if (doc.id === courseId) {
        course = {
          id: doc.id,
          ...doc.data(),
        };
      }
    });

    if (course) {
      storageService.setItem(`course_${courseId}`, course);
    }

    return course;
  } catch (error) {
    console.error('Error obteniendo curso:', error);
    return storageService.getItem(`course_${courseId}`);
  }
};

/**
 * Obtener cursos por criterios
 * @param {Object} criteria - Criterios de búsqueda
 * @returns {Promise<Array>} Cursos encontrados
 */
export const getCourseByCriteria = async (criteria) => {
  try {
    let q = query(collection(db, COURSES_COLLECTION));

    if (criteria.name) {
      q = query(collection(db, COURSES_COLLECTION), where('name', '==', criteria.name));
    }

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    // Si hay criterios adicionales, filtrar en memoria
    let result = {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data(),
    };

    if (criteria.academicYear && result.academicYear !== criteria.academicYear) {
      return null;
    }

    return result;
  } catch (error) {
    console.error('Error buscando curso:', error);
    return null;
  }
};

/**
 * Obtener cursos por grado
 * @param {string} grade - Grado
 * @returns {Promise<Array>} Cursos del grado
 */
export const getCoursesByGrade = async (grade) => {
  try {
    const q = query(
      collection(db, COURSES_COLLECTION),
      where('grade', '==', grade)
    );

    const querySnapshot = await getDocs(q);
    const courses = [];

    querySnapshot.forEach((doc) => {
      courses.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    storageService.setItem(`courses_grade_${grade}`, courses);
    return courses;
  } catch (error) {
    console.error('Error obteniendo cursos por grado:', error);
    return storageService.getItem(`courses_grade_${grade}`) || [];
  }
};

/**
 * Actualizar curso
 * @param {string} courseId - ID del curso
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<void>}
 */
export const updateCourse = async (courseId, updates) => {
  try {
    const validation = validateCourseData(updates, true);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    const docRef = doc(db, COURSES_COLLECTION, courseId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    const course = await getCourseById(courseId);
    storageService.setItem(`course_${courseId}`, course);
  } catch (error) {
    console.error('Error actualizando curso:', error);
    throw error;
  }
};

/**
 * Eliminar curso
 * @param {string} courseId - ID del curso
 * @returns {Promise<void>}
 */
export const deleteCourse = async (courseId) => {
  try {
    // Verificar que no tenga estudiantes ni materias
    const students = await getStudentsByCourse(courseId);
    const subjects = await getSubjectsByCourse(courseId);

    if (students.length > 0) {
      throw new Error(`No se puede eliminar: el curso tiene ${students.length} estudiante(s)`);
    }

    if (subjects.length > 0) {
      throw new Error(`No se puede eliminar: el curso tiene ${subjects.length} materia(s)`);
    }

    const docRef = doc(db, COURSES_COLLECTION, courseId);
    await deleteDoc(docRef);

    storageService.removeItem(`course_${courseId}`);
  } catch (error) {
    console.error('Error eliminando curso:', error);
    throw error;
  }
};

/**
 * Escuchar cambios en cursos en tiempo real
 * @param {Function} callback - Función a ejecutar cuando hay cambios
 * @returns {Function} Función para desuscribirse
 */
export const onCoursesChange = (callback) => {
  try {
    return onSnapshot(collection(db, COURSES_COLLECTION), (snapshot) => {
      const courses = [];
      snapshot.forEach((doc) => {
        courses.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      callback(courses);
    });
  } catch (error) {
    console.error('Error escuchando cambios de cursos:', error);
    return () => {};
  }
};

/**
 * Validar datos del curso
 * @param {Object} data - Datos a validar
 * @param {boolean} isPartial - Si es actualización parcial
 * @returns {Object} {isValid, errors}
 */
function validateCourseData(data, isPartial = false) {
  const errors = [];
  const validGrades = ['6', '7', '8', '9', '10', '11'];

  if (!isPartial) {
    if (!data.name || data.name.trim() === '') {
      errors.push('El nombre del curso es obligatorio');
    }
    if (!data.grade || !validGrades.includes(data.grade)) {
      errors.push('Grado inválido (debe ser 6-11)');
    }
    if (!data.academicYear || data.academicYear < 2020 || data.academicYear > 2100) {
      errors.push('Año académico inválido');
    }
  } else {
    if (data.name !== undefined && data.name.trim() === '') {
      errors.push('El nombre no puede estar vacío');
    }
    if (data.grade !== undefined && !validGrades.includes(data.grade)) {
      errors.push('Grado inválido');
    }
    if (data.academicYear !== undefined && (data.academicYear < 2020 || data.academicYear > 2100)) {
      errors.push('Año académico inválido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
