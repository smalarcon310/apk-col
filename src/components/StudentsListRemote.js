/**
 * Componente para listar estudiantes desde la API REST remota
 * Integra autenticación de Firebase con la API remota
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import { auth } from '../services/sessionAuth';
import { getStudents, getStudentAdvances } from '../services/apiClient';
import Alert from './Alert';

const StudentsListRemote = ({ onSelectStudent, showAdvances = false }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [studentAdvances, setStudentAdvances] = useState({});
  const [loadingAdvances, setLoadingAdvances] = useState({});

  // Verificar autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      if (user) {
        loadStudents();
      }
    });

    return unsubscribe;
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getStudents();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando estudiantes:', err);
      setError(
        err.message || 'Error al cargar los estudiantes. Verifica la conexión con el servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAdvancesForStudent = async (studentId) => {
    if (studentAdvances[studentId]) {
      return; // Ya cargados
    }

    setLoadingAdvances((prev) => ({ ...prev, [studentId]: true }));

    try {
      const data = await getStudentAdvances(studentId);
      setStudentAdvances((prev) => ({
        ...prev,
        [studentId]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      console.error(`Error cargando avances para ${studentId}:`, err);
      setStudentAdvances((prev) => ({
        ...prev,
        [studentId]: [],
      }));
    } finally {
      setLoadingAdvances((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  const toggleExpandStudent = (studentId) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
    } else {
      setExpandedStudent(studentId);
      if (showAdvances) {
        loadAdvancesForStudent(studentId);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-700">
            Debes iniciar sesión en Firebase para ver los estudiantes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Estudiantes</h2>
        </div>
        <button
          onClick={loadStudents}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <Alert
            key="error"
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}
      </AnimatePresence>

      {loading && !students.length ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : students.length > 0 ? (
        <div className="space-y-2">
          {students.map((student) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <div
                onClick={() => toggleExpandStudent(student.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    ID: {student.id} | Email: {student.email || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectStudent) {
                      onSelectStudent(student);
                    }
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Seleccionar
                </button>
              </div>

              {/* Expandir para mostrar avances */}
              {expandedStudent === student.id && showAdvances && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <h4 className="font-semibold text-gray-900 mb-3">Avances Recientes</h4>
                  {loadingAdvances[student.id] ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : studentAdvances[student.id] && studentAdvances[student.id].length > 0 ? (
                    <div className="space-y-2">
                      {studentAdvances[student.id].slice(0, 5).map((advance) => (
                        <div
                          key={advance.id}
                          className="bg-white p-2 rounded border border-gray-200 text-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">
                                {advance.subjectId}
                              </p>
                              <p className="text-gray-600 text-xs">
                                {advance.description}
                              </p>
                            </div>
                            <span className="bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded text-xs">
                              {advance.percentage}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(advance.date).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No hay avances registrados.</p>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay estudiantes disponibles en la API.</p>
        </div>
      )}
    </div>
  );
};

export default StudentsListRemote;
