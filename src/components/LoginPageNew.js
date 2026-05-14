import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmail, signInWithGoogle, signUpWithEmail, sendPasswordReset } from '../services/authService';
import { createStudent, getStudentByDocument } from '../services/studentService';
import getAssetPath from '../utils/assetPath';

const LoginPage = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);

  // Registro
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirm, setConfirm] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [phone, setPhone] = useState('');
  const [studentMatch, setStudentMatch] = useState(null);
  const [role, setRole] = useState('student');

  React.useEffect(() => {
    let active = true;
    const check = async () => {
      if (!documentId) {
        setStudentMatch(null);
        setRole('student');
        return;
      }
      try {
        const s = await getStudentByDocument(documentId);
        if (!active) return;
        setStudentMatch(s);
        if (s) setRole('guardian');
        else setRole('student');
      } catch (e) {
        console.warn('Error buscando estudiante:', e);
      }
    };
    check();
    return () => { active = false; };
  }, [documentId]);

  const handleLogin = async (e) => {
    e && e.preventDefault();
    setError(null);
    setResetSent(false);
    setLoading(true);
    try {
      const user = await signInWithEmail(email, password);
      onLoginSuccess && onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setResetSent(false);
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      onLoginSuccess && onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Error con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e && e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const user = await signUpWithEmail(email, password);
      const extra = { firstName, lastName, documentId, phone };

      try {
        if (role === 'student') {
          let existingStudent = null;
          if (documentId) {
            existingStudent = await getStudentByDocument(documentId);
          }
          if (existingStudent) {
            extra.studentId = existingStudent.id;
          } else {
            const courseId = 'default';
            const grade = '6';
            const savedStudent = await createStudent({ firstName, lastName, documentId, phone, courseId, grade, authUid: user.uid });
            extra.studentId = savedStudent.id;
          }
        } else if (role === 'guardian') {
          const child = await getStudentByDocument(documentId);
          if (child) {
            extra.studentId = child.id;
            extra.studentDocumentId = documentId;
            try {
              const { createGuardian } = await import('../services/guardianService');
              await createGuardian(user.uid, child.id);
            } catch (e) {
              console.warn('Error creando guardián:', e);
            }
          }
        }
      } catch (e) {
        console.warn('Advertencia al crear perfil:', e.message);
      }

      onLoginSuccess && onLoginSuccess(user, role, extra);
    } catch (err) {
      setError(err.message || 'Error creando la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async () => {
    if (!email) {
      setError('Ingresa tu correo para recuperar la contraseña');
      return;
    }
    setError(null);
    setResetSent(false);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (err) {
      setError(err.message || 'Error enviando correo');
    }
  };

  const toggleForm = () => {
    setIsRegister(!isRegister);
    setError(null);
    setResetSent(false);
  };

  const slideVariants = {
    hidden: { opacity: 0, x: isRegister ? 400 : -400 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: isRegister ? -400 : 400 }
  };

  return (
    <div className="min-h-screen flex items-stretch">
      <div className="hidden lg:flex w-1/2 items-center justify-center px-10" style={{ background: 'linear-gradient(135deg,#2a8a99 0%,#1f6b7a 100%)' }}>
        <div className="text-center max-w-lg">
          <div className="bg-white rounded-2xl inline-flex items-center justify-center p-6 shadow-2xl mb-8">
            <img src={getAssetPath('logo 1.png')} alt="SERMA" className="w-40 h-40 object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Sistema Educativo SERMA</h1>
          <p className="text-white/95 text-base leading-relaxed">Sistema centralizado de gestión académica y aprendizaje</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-white px-4 py-10 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={isRegister ? 'register' : 'login'}
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md"
          >
            {!isRegister ? (
              // LOGIN FORM
              <div>
                <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Bienvenido</h2>
                <p className="text-center text-sm text-gray-600 mb-6">Inicia sesión para acceder al sistema</p>

                {error && <div className="text-sm text-red-600 mb-3 bg-red-50 p-3 rounded">{error}</div>}
                {resetSent && <div className="text-sm text-green-700 mb-3 bg-green-50 p-3 rounded">Correo de recuperación enviado. Revisa tu bandeja.</div>}

                <form onSubmit={handleLogin}>
                  <div className="mb-4">
                    <label htmlFor="login-email" className="block text-xs font-medium text-gray-700 mb-1">Usuario</label>
                    <input id="login-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Ingresa tu usuario" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="login-password" className="block text-xs font-medium text-gray-700 mb-1">Contraseña</label>
                    <input id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Ingresa tu contraseña" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <input id="remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer" />
                    <label htmlFor="remember" className="text-sm text-gray-700 cursor-pointer">Mantener sesión iniciada</label>
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-3 rounded-lg text-white font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                    {loading ? 'Entrando...' : 'Iniciar Sesión'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button type="button" onClick={handleSendReset} className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                  <div className="text-xs text-gray-500 mt-2">¿Necesitas ayuda? Contacta a soporte técnico</div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-600">o acceder con</div>
                <div className="mt-4">
                  <button onClick={handleGoogle} disabled={loading} className="w-full py-2 rounded-lg border border-gray-300 flex items-center justify-center gap-2 bg-white hover:bg-gray-50">
                    <img src={getAssetPath('google-icon.svg')} alt="Google" className="w-5 h-5" />
                    <span className="text-sm text-gray-700">Entrar con Google</span>
                  </button>
                </div>

                <div className="mt-6 text-center text-sm text-gray-700">
                  ¿No tienes cuenta? <button onClick={toggleForm} className="text-blue-600 hover:text-blue-700 font-medium">Crear cuenta</button>
                </div>
              </div>
            ) : (
              // REGISTER FORM
              <div className="overflow-y-auto max-h-[85vh]">
                <div className="pb-6">
                  <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Crear cuenta</h2>
                  <p className="text-center text-sm text-gray-600 mb-6">Completa los datos para registrarte</p>

                  {error && <div className="text-sm text-red-600 mb-3 bg-red-50 p-3 rounded">{error}</div>}

                  <form onSubmit={handleRegister}>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Apellido</label>
                        <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Apellido" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Correo electrónico</label>
                      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="correo@ejemplo.com" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña</label>
                      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Contraseña" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                      <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" placeholder="Confirmar contraseña" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Cédula</label>
                      <input value={documentId} onChange={(e) => setDocumentId(e.target.value)} placeholder="Número de cédula" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
                    </div>

                    {studentMatch && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                        <strong>Estudiante encontrado:</strong> {studentMatch.firstName} {studentMatch.lastName}
                        {studentMatch.grade ? ` - Grado ${studentMatch.grade}` : ''}
                      </div>
                    )}

                    {role === 'guardian' && studentMatch && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                        Se creará una cuenta de acudiente vinculada al estudiante.
                      </div>
                    )}

                    <div className="mb-6">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Celular</label>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Número de celular" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">
                      {loading ? 'Creando...' : 'Crear cuenta'}
                    </button>
                  </form>

                  <div className="mt-6 text-center text-sm text-gray-700">
                    ¿Ya tienes cuenta? <button onClick={toggleForm} className="text-blue-600 hover:text-blue-700 font-medium">Iniciar sesión</button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LoginPage;
