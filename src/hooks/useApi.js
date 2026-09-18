import { useState, useCallback } from 'react';
import api from '../services/api';

export const useApi = (endpoint, initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // GET - Obtener datos
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(endpoint);
      const result = response.data.data || response.data;
      setData(result);
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  // POST - Crear
  const create = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post(endpoint, payload);
        const newItem = response.data.data;
        
        if (Array.isArray(data)) {
          setData([...data, newItem]);
        }
        
        return newItem;
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.message;
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, data]
  );

  // PUT - Actualizar
  const update = useCallback(
    async (id, payload) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.put(`${endpoint}/${id}`, payload);
        const updatedItem = response.data.data;
        
        if (Array.isArray(data)) {
          setData(data.map((item) => (item.id === id ? updatedItem : item)));
        } else {
          setData(updatedItem);
        }
        
        return updatedItem;
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.message;
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, data]
  );

  // DELETE - Eliminar
  const remove = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      try {
        await api.delete(`${endpoint}/${id}`);
        
        if (Array.isArray(data)) {
          setData(data.filter((item) => item.id !== id));
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.message;
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, data]
  );

  return {
    data,
    loading,
    error,
    fetchData,
    create,
    update,
    remove,
  };
};
