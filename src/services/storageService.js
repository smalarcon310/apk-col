/**
 * SERMA - Servicio de almacenamiento local con window.storage
 * Persiste datos críticos como respaldo y sincronización
 */

const STORAGE_PREFIX = 'serma_';

/**
 * Interfaz de almacenamiento usando window.storage
 * Reemplaza localStorage/sessionStorage por especificación del proyecto
 */
class StorageService {
  constructor() {
    // Usar window.storage si está disponible, si no usar objeto en memoria
    this.storage = window.storage || {};
  }

  /**
   * Guardar datos en almacenamiento
   * @param {string} key - Clave de almacenamiento
   * @param {any} value - Valor a guardar (se convierte a JSON)
   */
  setItem(key, value) {
    try {
      const fullKey = `${STORAGE_PREFIX}${key}`;
      const jsonValue = JSON.stringify(value);
      
      if (window.storage) {
        window.storage[fullKey] = jsonValue;
      } else {
        this.storage[fullKey] = jsonValue;
      }
    } catch (error) {
      console.error(`Error guardando en storage [${key}]:`, error);
    }
  }

  /**
   * Obtener datos del almacenamiento
   * @param {string} key - Clave de almacenamiento
   * @returns {any} Valor recuperado o null
   */
  getItem(key) {
    try {
      const fullKey = `${STORAGE_PREFIX}${key}`;
      const storage = window.storage || this.storage;
      const value = storage[fullKey];
      
      if (value === undefined || value === null) {
        return null;
      }
      
      return JSON.parse(value);
    } catch (error) {
      console.error(`Error leyendo de storage [${key}]:`, error);
      return null;
    }
  }

  /**
   * Eliminar datos del almacenamiento
   * @param {string} key - Clave de almacenamiento
   */
  removeItem(key) {
    try {
      const fullKey = `${STORAGE_PREFIX}${key}`;
      const storage = window.storage || this.storage;
      
      if (storage[fullKey] !== undefined) {
        delete storage[fullKey];
      }
    } catch (error) {
      console.error(`Error eliminando de storage [${key}]:`, error);
    }
  }

  /**
   * Limpiar todos los datos de SERMA del almacenamiento
   */
  clear() {
    try {
      const storage = window.storage || this.storage;
      const keysToDelete = Object.keys(storage).filter(key => 
        key.startsWith(STORAGE_PREFIX)
      );
      
      keysToDelete.forEach(key => {
        delete storage[key];
      });
    } catch (error) {
      console.error('Error limpiando storage:', error);
    }
  }

  /**
   * Obtener todas las claves de SERMA
   * @returns {string[]} Array de claves
   */
  keys() {
    const storage = window.storage || this.storage;
    return Object.keys(storage)
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .map(key => key.replace(STORAGE_PREFIX, ''));
  }
}

export const storageService = new StorageService();
export default storageService;
