/**
 * Componente para crear avances usando la API REST remota
 * Integra autenticación de Firebase con la API remota
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { auth } from '../services/sessionAuth';
import { createAdvance, getStudentAdvances } from '../services/apiClient';
import Alert from './Alert';

const AdvancesFormRemote = ({ onSuccess, studentId = null, subjectId = null }) => {
  const [formData, setFormData] = useState({
    studentId: studentId || '',
    subjectId: subjectId || '',
    percentage: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [advances, setAdvances] = useState([]);
  const [loadingAdvances, setLoadingAdvances] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });

    return unsubscribe;
  }, []);

  // Cargar avances del estudiante si está especificado
  useEffect(() => {
    if (studentId && isAuthenticated) {
      loadAdvances();
    }
  }, [studentId, isAuthenticated]);

  const loadAdvances = async () => {
    if (!studentId) return;

    setLoadingAdvances(true);
    try {
      const data = await getStudentAdvances(studentId);
      setAdvances(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando avances:', err);
      // No mostrar error crítico, solo silenciosamente fallar
    } finally {
      setLoadingAdvances(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.studentId.trim()) {
      setError('Por favor ingresa el ID del estudiante');
      return false;
    }
    if (!formData.subjectId.trim()) {
      setError('Por favor ingresa el ID de la materia');
      return false;
    }
    if (!formData.percentage || isNaN(formData.percentage) || formData.percentage < 0 || formData.percentage > 100) {
      setError('El porcentaje debe estar entre 0 y 100');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Por favor ingresa una descripción');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isAuthenticated) {
      setError('Debes iniciar sesión para crear avances');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      
      const advanceData = {
        studentId: formData.studentId,
        subjectId: formData.subjectId,
        percentage: Number(formData.percentage),
        description: formData.description.trim(),
        date: formData.date,
        userId: currentUser.uid, // ID del usuario autenticado en Firebase
        userEmail: currentUser.email,
      };

      const response = await createAdvance(advanceData);

      setMessage('Avance creado correctamente');
      setFormData({
        studentId: studentId || '',
        subjectId: subjectId || '',
        percentage: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });

      // Recargar la lista de avances
      if (studentId) {
        await loadAdvances();
      }

      // Callback de éxito
      if (onSuccess) {
        onSuccess(response);
      }

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error creando avance:', err);
      setError(err.message || 'Error al crear el avance. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-700">
            Debes iniciar sesión en Firebase para crear avances.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Crear Nuevo Avance</h2>

      <AnimatePresence>
        {message && (
          <Alert
            key="success"
            type="success"
            message={message}
            onClose={() => setMessage(null)}
          />
        )}
        {error && (
          <Alert
            key="error"
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ID del Estudiante */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID del Estudiante *
          </label>
          <input
            type="text"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            placeholder="Ingresa el ID del estudiante"
            disabled={!!studentId}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            required
          />
        </div>

        {/* ID de la Materia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID de la Materia *
          </label>
          <input
            type="text"
            name="subjectId"
            value={formData.subjectId}
            onChange={handleChange}
            placeholder="Ingresa el ID de la materia"
            disabled={!!subjectId}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            required
          />
        </div>

        {/* Porcentaje de Avance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Porcentaje de Avance (0-100) *
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="percentage"
              value={formData.percentage}
              onChange={handleChange}
              min="0"
              max="100"
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <span className="text-gray-500 font-medium">%</span>
          </div>
          {formData.percentage && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${formData.percentage}%` }}
              />
            </div>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción del Avance *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe el progreso, logros, áreas de mejora, etc."
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha del Avance
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Botón Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Creando avance...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Crear Avance
            </>
          )}
        </button>
      </form>

      {/* Lista de avances recientes */}
      {studentId && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-semibold mb-4">Avances Recientes</h3>
          {loadingAdvances ? (
            <div className="flex items-center justify-center py-4">
              <Loader className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : advances.length > 0 ? (
            <div className="space-y-2">
              {advances.slice(0, 5).map((advance) => (
                <motion.div
                  key={advance.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">
                        Materia: {advance.subjectId}
                      </p>
                      <p className="text-sm text-gray-600">{advance.description}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded">
                      {advance.percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(advance.date).toLocaleDateString('es-ES')}
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No hay avances registrados aún.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancesFormRemote;
