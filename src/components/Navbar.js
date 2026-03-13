/**
 * SERMA - Navbar Component
 */

import React from 'react';
import { Users, BookOpen, BookMarked, LayoutDashboard } from 'lucide-react';

/**
 * Navbar - Barra de navegación superior
 */
export const Navbar = ({ currentTab, onTabChange, currentProfile, onProfileChange, onOpenLogin, onLogout }) => {

  const allTabs = [
    { id: 'rector', label: 'Rector', icon: LayoutDashboard },
    { id: 'students', label: 'Estudiantes', icon: Users },
    { id: 'teacher', label: 'Docente', icon: Users },
    { id: 'teachers', label: 'Profesores', icon: Users },
    { id: 'courses', label: 'Cursos', icon: BookOpen },
    { id: 'subjects', label: 'Materias', icon: BookMarked },
  ];

  // Filtrar pestañas por rol
  const tabs = allTabs.filter((t) => {
    if (!currentProfile) return true;
    if (currentProfile.role === 'teacher') {
      // Docente: ver su dashboard, materias y estudiantes
      return ['teacher', 'subjects', 'students'].includes(t.id);
    }
    if (currentProfile.role === 'student') {
      // Estudiante: ver solo su dashboard
      return t.id === 'students';
    }
    if (currentProfile.role === 'rector') {
      // Rector: no necesita acceder al panel docente, ese es para cada profesor
      // (puede administrar profesores desde el módulo correspondiente)
      return t.id !== 'teacher';
    }
    // Otros roles por defecto ven todas las pestañas excepto la docente
    return t.id !== 'teacher';
  });


  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo y Título */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SERMA</h1>
            <span className="text-xs text-gray-500 ml-2">Sistema de Gestión Académica</span>
          </div>

          {/* Acciones de sesión */}
          <div className="text-sm text-gray-600 flex items-center gap-3">
            {/* Botón Logout si hay sesión, sino botón para abrir login */}
            {currentProfile ? (
              <button onClick={() => onLogout && onLogout()} className="text-sm text-gray-600 px-3 py-1 border rounded">Cerrar sesión</button>
            ) : (
              <button onClick={() => onOpenLogin && onOpenLogin()} className="text-sm text-white bg-blue-600 px-3 py-1 rounded">Iniciar sesión</button>
            )}
          </div>
        </div>

        {/* Pestañas */}
        <div className="flex gap-0 border-t border-gray-200">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = currentTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm
                  transition-colors
                  ${
                    isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }
                `}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
