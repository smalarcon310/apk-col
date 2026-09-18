/**
 * API Client - Integración con API REST remota
 * Maneja todas las peticiones HTTP con autenticación de Firebase
 * 
 * Características:
 * - Obtiene el token de Firebase del usuario autenticado
 * - Agrega el token en cada request (Authorization: Bearer {token})
 * - Maneja errores de autenticación y conexión
 * - Solo permite requests si el usuario está autenticado
 */

import { auth } from './sessionAuth';

// URL base de la API remota
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002';

/**
 * Obtiene el token de Firebase del usuario autenticado
 * @returns {Promise<string>} Token de Firebase
 * @throws {Error} Si el usuario no está autenticado
 */
export async function getAuthToken() {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    throw new Error('Usuario no autenticado. Por favor inicia sesión.');
  }

  try {
    return currentUser.uid;
  } catch (error) {
    console.error('Error al obtener el token de Firebase:', error);
    throw new Error('No se pudo obtener el token de autenticación');
  }
}

/**
 * Realiza una petición HTTP a la API remota con autenticación
 * 
 * @param {string} endpoint - Endpoint de la API (ej: '/api/estudiantes')
 * @param {Object} options - Opciones de la petición
 * @param {string} options.method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {Object} options.body - Cuerpo de la petición (para POST/PUT)
 * @param {boolean} options.requireAuth - Si requiere autenticación (default: true)
 * @returns {Promise<Object>} Respuesta de la API
 */
export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    requireAuth = true,
  } = options;

  try {
    // Validar autenticación si es requerida
    if (requireAuth && !auth.currentUser) {
      throw new Error('Usuario no autenticado. Por favor inicia sesión.');
    }

    // Obtener el token de Firebase
    let token = null;
    if (requireAuth) {
      token = await getAuthToken();
    }

    // Configurar headers
    const headers = {
      'Content-Type': 'application/json',
    };

    // Agregar token de autorización si existe
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Construir URL completa
    const url = `${API_BASE_URL}${endpoint}`;

    // Opciones de la petición
    const fetchOptions = {
      method,
      headers,
    };

    // Agregar cuerpo si es POST/PUT
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(body);
    }

    // Realizar petición
    const response = await fetch(url, fetchOptions);

    // Manejar errores de respuesta
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Si no se puede parsear JSON, usar el mensaje por defecto
      }

      // Manejar errores de autenticación específicos
      if (response.status === 401) {
        throw new Error('Token de autenticación inválido o expirado. Por favor inicia sesión nuevamente.');
      }

      if (response.status === 403) {
        throw new Error('No tienes permiso para acceder a este recurso.');
      }

      throw new Error(errorMessage);
    }

    // Parsear respuesta
    const data = await response.json();
    return data;

  } catch (error) {
    console.error(`Error en petición ${method} ${endpoint}:`, error);
    throw error;
  }
}

/**
 * ENDPOINTS - Estudiantes
 */

/**
 * Obtiene todos los estudiantes
 * @returns {Promise<Array>} Lista de estudiantes
 */
export async function getStudents() {
  return apiRequest('/api/estudiantes', { method: 'GET' });
}

/**
 * Obtiene información de un estudiante por ID
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Object>} Datos del estudiante
 */
export async function getStudent(studentId) {
  return apiRequest(`/api/estudiantes/${studentId}`, { method: 'GET' });
}

/**
 * ENDPOINTS - Avances
 */

/**
 * Obtiene los avances de un estudiante
 * @param {string} studentId - ID del estudiante
 * @returns {Promise<Array>} Lista de avances
 */
export async function getStudentAdvances(studentId) {
  return apiRequest(`/api/avances/estudiante/${studentId}`, { method: 'GET' });
}

/**
 * Crea un nuevo avance
 * @param {Object} advanceData - Datos del avance
 * @param {string} advanceData.studentId - ID del estudiante
 * @param {string} advanceData.subjectId - ID de la materia
 * @param {number} advanceData.percentage - Porcentaje de avance (0-100)
 * @param {string} advanceData.description - Descripción del avance
 * @param {string} advanceData.date - Fecha del avance (ISO string)
 * @returns {Promise<Object>} Avance creado
 */
export async function createAdvance(advanceData) {
  return apiRequest('/api/avances', {
    method: 'POST',
    body: advanceData,
  });
}

/**
 * Actualiza un avance
 * @param {string} advanceId - ID del avance
 * @param {Object} advanceData - Datos a actualizar
 * @returns {Promise<Object>} Avance actualizado
 */
export async function updateAdvance(advanceId, advanceData) {
  return apiRequest(`/api/avances/${advanceId}`, {
    method: 'PUT',
    body: advanceData,
  });
}

/**
 * Elimina un avance
 * @param {string} advanceId - ID del avance
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export async function deleteAdvance(advanceId) {
  return apiRequest(`/api/avances/${advanceId}`, { method: 'DELETE' });
}

/**
 * ENDPOINTS - Genéricos
 */

/**
 * Obtiene un recurso genérico
 * @param {string} endpoint - Endpoint a obtener
 * @returns {Promise<Object>} Datos del recurso
 */
export async function getResource(endpoint) {
  return apiRequest(endpoint, { method: 'GET' });
}

/**
 * Crea un recurso genérico
 * @param {string} endpoint - Endpoint donde crear
 * @param {Object} data - Datos del recurso
 * @returns {Promise<Object>} Recurso creado
 */
export async function createResource(endpoint, data) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: data,
  });
}

export default {
  getAuthToken,
  apiRequest,
  getStudents,
  getStudent,
  getStudentAdvances,
  createAdvance,
  updateAdvance,
  deleteAdvance,
  getResource,
  createResource,
};
