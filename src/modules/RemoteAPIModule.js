/**
 * Módulo de Integración con API Remota
 * Combina el listado de estudiantes y el formulario de avances
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Settings } from 'lucide-react';
import { auth } from '../services/sessionAuth';
import StudentsListRemote from '../components/StudentsListRemote';
import AdvancesFormRemote from '../components/AdvancesFormRemote';

const RemoteAPIModule = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(
    process.env.REACT_APP_API_BASE_URL || 'http://TU_IP_PUBLICA:3001'
  );
  const [tempUrl, setTempUrl] = useState(apiBaseUrl);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    // Scroll a la sección de formulario
    setTimeout(() => {
      const formElement = document.getElementById('advances-form-section');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSaveSettings = () => {
    setApiBaseUrl(tempUrl);
    setShowSettings(false);
    // En una aplicación real, guardarías esto en localStorage o en el servidor
    localStorage.setItem('API_BASE_URL', tempUrl);
  };

  const isUserAuthenticated = !!auth.currentUser;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Integración API REST</h1>
              <p className="text-gray-600 mt-2">
                Gestiona estudiantes y avances sincronizados con el servidor remoto
              </p>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              title="Configuración de API"
            >
              <Settings className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Información de autenticación */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-semibold text-blue-900">Estado de Autenticación</p>
                {isUserAuthenticated ? (
                  <p className="text-blue-700 text-sm mt-1">
                    ✓ Autenticado como: <strong>{auth.currentUser?.email}</strong>
                  </p>
                ) : (
                  <p className="text-blue-700 text-sm mt-1">
                    ✗ No autenticado. Debes iniciar sesión para usar la API.
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Panel de Configuración */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-lg shadow-md p-6 mb-8"
            >
              <h2 className="text-xl font-bold mb-4">Configuración de API</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Base de la API
                  </label>
                  <input
                    type="text"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="http://TU_IP_PUBLICA:3001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    URL actual: <code className="bg-gray-100 px-2 py-1 rounded">{apiBaseUrl}</code>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveSettings}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setTempUrl(apiBaseUrl);
                      setShowSettings(false);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contenido Principal */}
        {!isUserAuthenticated ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Autenticación Requerida</h3>
                <p className="text-yellow-700 mt-2">
                  Para usar la integración con la API remota, debes iniciar sesión primero.
                  Navega a la página de login y autentica con Firebase.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Listado de Estudiantes */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StudentsListRemote
                onSelectStudent={handleSelectStudent}
                showAdvances={true}
              />
            </motion.div>

            {/* Formulario de Avances */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              id="advances-form-section"
            >
              {selectedStudent ? (
                <div>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded mb-6">
                    <p className="text-sm text-blue-700">
                      Estudiante seleccionado: <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong>
                    </p>
                  </div>
                  <AdvancesFormRemote
                    studentId={selectedStudent.id}
                    onSuccess={() => {
                      // Opcionalmente, recargar la lista de estudiantes
                      console.log('Avance creado exitosamente');
                    }}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center min-h-96">
                  <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-center">
                    Selecciona un estudiante de la lista para crear un avance
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemoteAPIModule;
