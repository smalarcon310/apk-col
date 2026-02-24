/**
 * SERMA - Utilidades de Validación
 * Funciones reutilizables para validar datos
 */

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar teléfono colombiano (10 dígitos)
 * @param {string} phone - Teléfono a validar
 * @returns {boolean}
 */
export const validatePhone = (phone) => {
  // Aceptar solo dígitos, permitir formato con guiones o espacios
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
};

/**
 * Validar documento de identidad colombiano
 * @param {string} document - Documento a validar
 * @returns {boolean}
 */
export const validateDocument = (document) => {
  // Solo números, entre 5 y 15 dígitos
  const cleaned = document.replace(/\D/g, '');
  return cleaned.length >= 5 && cleaned.length <= 15;
};

/**
 * Validar que una cadena no esté vacía
 * @param {string} value - Valor a validar
 * @returns {boolean}
 */
export const isNotEmpty = (value) => {
  return value && value.trim().length > 0;
};

/**
 * Sanitizar entrada de texto
 * Elimina caracteres especiales peligrosos
 * @param {string} text - Texto a sanitizar
 * @returns {string}
 */
export const sanitizeText = (text) => {
  if (!text) return '';
  return text
    .trim()
    .replace(/[<>]/g, '') // Eliminar caracteres peligrosos
    .substring(0, 255); // Limitar longitud
};

/**
 * Validar año académico
 * @param {number} year - Año a validar
 * @returns {boolean}
 */
export const validateAcademicYear = (year) => {
  const currentYear = new Date().getFullYear();
  return year >= 2020 && year <= currentYear + 10;
};

/**
 * Validar grado escolar
 * @param {string} grade - Grado a validar
 * @returns {boolean}
 */
export const validateGrade = (grade) => {
  return ['6', '7', '8', '9', '10', '11'].includes(grade.toString());
};

/**
 * Calcular edad desde fecha de nacimiento
 * @param {Date} birthDate - Fecha de nacimiento
 * @returns {number} Edad en años
 */
export const calculateAge = (birthDate) => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Validar edad para estudiante (10-20 años)
 * @param {number} age - Edad en años
 * @returns {boolean}
 */
export const validateStudentAge = (age) => {
  return age >= 10 && age <= 20;
};
