import axios from 'axios';

// Crear instancia de axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  timeout: 10000,
});

// Interceptor: Agregar Authorization header
api.interceptors.request.use(
  (config) => {
    const sessionUser = JSON.parse(localStorage.getItem('sessionUser') || 'null');
    if (sessionUser?.id) {
      config.headers.Authorization = `Bearer ${sessionUser.id}`;
    }
    return config;
  },
  (error) => {
    console.error('Error en request:', error);
    return Promise.reject(error);
  }
);

// Interceptor: Manejar respuestas y errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }

    // Log de error
    console.error('Error API:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

export default api;
