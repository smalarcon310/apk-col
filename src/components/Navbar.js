/**
 * SERMA - Navbar Component
 */

import React, { useEffect, useState } from 'react';
import { Users, BookOpen, BookMarked, LayoutDashboard } from 'lucide-react';
import { getAllTeachers } from '../services/teacherService';

/**
 * Navbar - Barra de navegación superior
 */
export const Navbar = ({ currentTab, onTabChange, currentProfile, onProfileChange, onOpenLogin, onLogout }) => {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const t = await getAllTeachers();
        setTeachers(t || []);
      } catch (err) {
        setTeachers([]);
      }
    };
    load();
  }, []);

  const allTabs = [
    { id: 'rector', label: 'Rector', icon: LayoutDashboard },
    { id: 'students', label: 'Estudiantes', icon: Users },
    { id: 'teacher', label: 'Docente', icon: Users },
    { id: 'teachers', label: 'Profesores', icon: Users },
    { id: 'courses', label: 'Cursos', icon: BookOpen },
    { id: 'subjects', label: 'Materias', icon: BookMarked },
  ];

  // Filtrar pestañas por rol (el rector ve todos los módulos)
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
    // Rector y otros roles ven todos los módulos
    return true;
  });

  const handleProfileChange = (e) => {
    const val = e.target.value;
    if (val === 'rector') {
      onProfileChange && onProfileChange({ role: 'rector' });
      onTabChange && onTabChange('rector');
    } else {
      const teacher = teachers.find((t) => t.id === val);
      if (teacher) {
        onProfileChange && onProfileChange({ role: 'teacher', teacherId: teacher.id, name: `${teacher.firstName} ${teacher.lastName}` });
        onTabChange && onTabChange('teacher');
      }
    }
  };

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

          {/* Perfil selector y acciones de sesión */}
          <div className="text-sm text-gray-600 flex items-center gap-3">
            {/* Selector de perfil: solo visible para Rector (para ver perfiles de docentes) */}
            {currentProfile?.role === 'rector' && (
              <select
                value={currentProfile?.role === 'teacher' ? currentProfile.teacherId || '' : 'rector'}
                onChange={handleProfileChange}
                className="border rounded px-3 py-1"
              >
                <option value="rector">Rector</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                ))}
              </select>
            )}

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
