import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LoadingScreen } from './components/LoadingScreen';
import { CoursesModule } from './modules/CoursesModule';
import { SubjectsModule } from './modules/SubjectsModule';
import RectorDashboard from './modules/RectorDashboard';
import TeachersModule from './modules/TeachersModule';
import TeacherDashboard from './modules/TeacherDashboard';
import { StudentsModule } from './modules/StudentsModule';
import StudentDashboard from './components/StudentDashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import { signOut as authSignOut } from './services/authService';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getAllTeachers } from './services/teacherService';
import { getAllStudents } from './services/studentService';
import { db } from './config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './App.css';

/**
 * App - Componente raíz de la aplicación
 * SERMA - Sistema de Gestión Académica
 */
function App() {
  // Estado de autenticación y perfil
  const [currentTab, setCurrentTab] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [, setShowLogin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthSuccess = async (user, forcedRole = null, extra = {}) => {
    // Si viene un rol forzado (registro), mapearlo inmediatamente.
    if (forcedRole) {
      let profile = null;
      if (forcedRole === 'teacher') profile = { role: 'teacher', teacherId: extra.teacherId || user.uid, studentId: extra.studentId || null, name: `${extra.firstName || ''} ${extra.lastName || ''}`, documentId: extra.documentId || null, phone: extra.phone || null };
      else if (forcedRole === 'student') profile = { role: 'student', studentId: extra.studentId || user.uid, name: `${extra.firstName || ''} ${extra.lastName || ''}`, documentId: extra.documentId || null, phone: extra.phone || null };
      else if (forcedRole === 'rector') profile = { role: 'rector', studentId: extra.studentId || null, name: `${extra.firstName || ''} ${extra.lastName || ''}`, documentId: extra.documentId || null, phone: extra.phone || null };
      else if (forcedRole === 'guardian' || forcedRole === 'acudiente') profile = { role: 'guardian', name: `${extra.firstName || ''} ${extra.lastName || ''}`, guardianDocumentId: extra.guardianDocumentId || extra.documentId || null, studentDocumentId: extra.studentDocumentId || null, studentId: extra.studentId || null, phone: extra.phone || null, relationship: extra.relationship || null };
      else profile = { role: forcedRole, name: user.email };

      setCurrentProfile(profile);
      // Determinar tab inicial
      if (profile?.role === 'rector') setCurrentTab('rector');
      else if (profile?.role === 'teacher') setCurrentTab('teacher');
      else setCurrentTab('students');
    } else {
      // No asumir rol aquí: dejar que el listener `onAuthStateChanged` resuelva el rol
      // simplemente cerrar el modal y navegar; el listener actualizará `currentProfile`.
      setShowLogin(false);
    }

    try { navigate('/', { replace: true }); } catch (e) {}
  };

  // Verificar conexión a Firebase
  useEffect(() => {
    let unsub = () => {};
    let isMounted = true;
    let authFallbackTimer = null;

    const resolveRole = async (user) => {
      if (!user) return null;
      const email = user.email || '';

      // Comprobar colección 'rectors' en Firestore primero
      try {
        const rectorsCol = collection(db, 'rectors');
        const q = query(rectorsCol, where('email', '==', email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const r = snap.docs[0].data();
          return { role: 'rector', name: `${r.firstName || ''} ${r.lastName || ''}`.trim() || email };
        }
      } catch (e) {
        // ignore
      }

      // Buscar profesor por email (solo si fue creado por el rector)
      try {
        const teachers = await getAllTeachers();
        const t = teachers.find((x) => {
          if ((x.email || '').toLowerCase() !== email.toLowerCase()) return false;
          // sólo los docentes generados por el rector tienen acceso al panel
          return x.createdBy === 'rector';
        });
        if (t) return { role: 'teacher', teacherId: t.id, name: `${t.firstName || ''} ${t.lastName || ''}` };
      } catch (e) {
        // ignore
      }

      // Si el documento del estudiante contiene el UID del usuario, buscar
      // por ese campo. De esta manera no dependemos del email, el cual ya
      // no se almacena en el perfil.
      try {
        const students = await getAllStudents();
        const s = students.find((x) => x.authUid === user.uid);
        if (s) {
          return {
            role: 'student',
            studentId: s.id,
            name: `${s.firstName || ''} ${s.lastName || ''}`,
            documentId: s.documentId || null,
            authUid: s.authUid || null,
          };
        }
        // if no student by UID, maybe the user is a guardian previously linked
        // (guardians collection may not exist on older installs but import is safe)
        try {
          const { getGuardianByUid } = await import('./services/guardianService');
          const g = await getGuardianByUid(user.uid);
          if (g && g.studentId) {
            const s2 = students.find((x) => x.id === g.studentId);
            const profName = s2 ? `${s2.firstName || ''} ${s2.lastName || ''}` : email;
            return {
              role: 'guardian',
              studentId: g.studentId,
              name: profName,
              guardianDocumentId: null,
              studentDocumentId: s2 ? s2.documentId || null : null,
            };
          }
        } catch (inner) {
          // ignore if service missing or error
        }
      } catch (e) {
        // ignore
      }

      // Si no se encuentra por ninguno de los métodos previos, 
      // comprobar variable de entorno para Rector
      const rectorEmail = process.env.REACT_APP_RECTOR_EMAIL;
      if (rectorEmail && email.toLowerCase() === rectorEmail.toLowerCase()) {
        return { role: 'rector', name: email };
      }

      // Fallback: si el dominio o correo sugiere rector, marcar como rector
      if (email.toLowerCase().includes('rector') || email.toLowerCase().includes('admin')) {
        return { role: 'rector', name: email };
      }

      // Si no coincide con ninguna, tratar como estudiante por defecto
      return { role: 'student', name: email };
    };

    // Forzar cierre de sesión al iniciar para que siempre arranque en login
    const initializeAuth = async () => {
      try {
        // Timeout de 5 segundos para signOut
        await Promise.race([
          authSignOut(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('signOut timeout')), 5000))
        ]);
      } catch (e) {
        // ignore - continuar de todas formas
        console.debug('SignOut timeout o error (continuando):', e.message);
      }

      if (!isMounted) return;

      authFallbackTimer = setTimeout(() => {
        if (!isMounted || !authLoading) return;
        console.warn('Auth timeout de seguridad alcanzado, mostrando login');
        setCurrentProfile(null);
        setCurrentTab(null);
        setAuthLoading(false);
      }, 8000);

      unsub = onAuthStateChanged(auth, async (user) => {
        try {
          if (!user) {
            if (isMounted) {
              setCurrentProfile(null);
              setCurrentTab(null);
              setShowLogin(false);
              setAuthLoading(false);
            }
            if (authFallbackTimer) clearTimeout(authFallbackTimer);
            return;
          }

          // Usar Promise.race para agregar timeout de 10 segundos
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout resolviendo rol')), 10000)
          );

          if (isMounted) {
            setShowLogin(false);
            setAuthLoading(true);
          }

          const profile = await Promise.race([
            resolveRole(user),
            timeoutPromise
          ]);

          if (isMounted) {
            setCurrentProfile(profile);
            // Navegar según rol
            if (profile?.role === 'rector') setCurrentTab('rector');
            else if (profile?.role === 'teacher') setCurrentTab('teacher');
            else setCurrentTab('students');
            setAuthLoading(false);
          }
          if (authFallbackTimer) clearTimeout(authFallbackTimer);
        } catch (error) {
          console.error('Error en onAuthStateChanged:', error);
          if (isMounted) {
            // Aunque haya error, cerrar el loading y mostrar login
            setAuthLoading(false);
            setCurrentProfile(null);
            setCurrentTab(null);
            setConnectionError('Error al cargar sesión. Por favor, inicie sesión nuevamente.');
          }
          if (authFallbackTimer) clearTimeout(authFallbackTimer);
        }
      });
    };

    initializeAuth();

    const checkConnection = () => {
      const isOnline = navigator.onLine;
      if (!isOnline) {
        setConnectionError('Sin conexión a internet');
      } else {
        setConnectionError(null);
      }
    };

    checkConnection();
    window.addEventListener('online', () => setConnectionError(null));
    window.addEventListener('offline', () => setConnectionError('Sin conexión a internet'));

    return () => {
      isMounted = false;
      if (authFallbackTimer) clearTimeout(authFallbackTimer);
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
      try { unsub(); } catch (e) {}
    };
  }, []);

  if (authLoading) {
    return <LoadingScreen />;
  }
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
      <Route path="/login" element={<LoginPage onLoginSuccess={handleAuthSuccess} />} />
      <Route path="/register" element={<RegisterPage onRegisterSuccess={handleAuthSuccess} />} />
      <Route path="/" element={
        currentProfile ? (
          <motion.div className="min-h-screen bg-gray-100" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.36 }}>
            {/* Navbar */}
            <Navbar currentTab={currentTab} onTabChange={setCurrentTab} currentProfile={currentProfile} onProfileChange={setCurrentProfile} onOpenLogin={() => setShowLogin(true)} onLogout={async () => { try { await authSignOut(); setCurrentProfile(null); setCurrentTab(null); navigate('/login', { replace: true }); } catch (e) { setCurrentProfile(null); setCurrentTab(null); navigate('/login', { replace: true }); } }} />

            {/* Alerta de conexión */}
            {connectionError && (
              <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 text-yellow-800 text-sm">
                ⚠️ {connectionError} - Los cambios se guardarán localmente
              </div>
            )}

            {/* Contenido principal */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {currentProfile?.role === 'student' || currentProfile?.role === 'guardian' ? (
                <StudentDashboard currentProfile={currentProfile} />
              ) : (
                <>
                  {currentTab === 'rector' && <RectorDashboard currentProfile={currentProfile} />}
                  {currentTab === 'students' && <StudentsModule currentProfile={currentProfile} />}
                  {currentTab === 'teacher' && currentProfile?.role === 'teacher' && <TeacherDashboard initialTeacherId={currentProfile.teacherId} currentProfile={currentProfile} />}
                  {currentTab === 'teachers' && <TeachersModule currentProfile={currentProfile} />}
                  {currentTab === 'courses' && <CoursesModule currentProfile={currentProfile} />}
                  {currentTab === 'subjects' && <SubjectsModule currentProfile={currentProfile} />}
                </>
              )}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-gray-600">
                <p>
                  SERMA v1.0 © 2025 - Institución Educativa Bruselas
                </p>
                <p className="mt-2">
                  Sistema de Gestión Académica para la Metodología FRE (Formación Relacional Educativa)
                </p>
              </div>
            </footer>
          </motion.div>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      <Route path="*" element={<Navigate to={currentProfile ? '/' : '/login'} replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
