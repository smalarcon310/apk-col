/**
 * SERMA - Utilidades generales
 */

/**
 * Formatear timestamp de Firestore a fecha legible
 * @param {Object} timestamp - Timestamp de Firestore
 * @returns {string} Fecha formateada
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return '';
  }
};

/**
 * Formatear timestamp con hora
 * @param {Object} timestamp - Timestamp de Firestore
 * @returns {string} Fecha y hora formateadas
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return '';
  }
};

/**
 * Generar ID único
 * @returns {string} ID único
 */
export const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Capitalizar primera letra
 * @param {string} text - Texto a capitalizar
 * @returns {string}
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Capitalizar nombre completo
 * @param {string} text - Nombre a capitalizar
 * @returns {string}
 */
export const capitalizeFullName = (text) => {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Truncar texto
 * @param {string} text - Texto a truncar
 * @param {number} length - Longitud máxima
 * @returns {string}
 */
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

/**
 * Comparar dos objetos para igualdad profunda (simple)
 * @param {Object} obj1 - Primer objeto
 * @param {Object} obj2 - Segundo objeto
 * @returns {boolean}
 */
export const isDeepEqual = (obj1, obj2) => {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
};

/**
 * Crear copia profunda de un objeto
 * @param {Object} obj - Objeto a copiar
 * @returns {Object}
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Obtener iniciales de un nombre completo
 * @param {string} firstName - Nombre
 * @param {string} lastName - Apellido
 * @returns {string} Iniciales
 */
export const getInitials = (firstName = '', lastName = '') => {
  return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
};

/**
 * Formatear nombre completo
 * @param {string} firstName - Nombre
 * @param {string} lastName - Apellido
 * @returns {string} Nombre completo formateado
 */
export const formatFullName = (firstName = '', lastName = '') => {
  return `${capitalizeFullName(firstName)} ${capitalizeFullName(lastName)}`.trim();
};

/**
 * Obtener color aleatorio para avatar
 * @returns {string} Color hexadecimal
 */
export const getRandomColor = () => {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#06B6D4', // cyan
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Retardo (promesa que se resuelve después de X ms)
 * Útil para testing y animaciones
 * @param {number} ms - Milisegundos
 * @returns {Promise<void>}
 */
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
