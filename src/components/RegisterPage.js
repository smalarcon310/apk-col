import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signUpWithEmail, sendPasswordReset } from '../services/authService';
import { createStudent, getStudentByDocument } from '../services/studentService';
import { Link, useNavigate } from 'react-router-dom';
import getAssetPath from '../utils/assetPath';

const RegisterPage = ({ onRegisterSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const [documentId, setDocumentId] = useState('');
  const [phone, setPhone] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [role, setRole] = useState('student');
  const [studentMatch, setStudentMatch] = useState(null);

  // whenever the cédula changes we check for existing student
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
        console.warn('Error buscando estudiante por cédula:', e);
      }
    };
    check();
    return () => { active = false; };
  }, [documentId]);

  const submit = async (e) => {
    e && e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const user = await signUpWithEmail(email, password, {
        firstName,
        lastName,
        cedula: documentId,
        role,
      });
      // Build extra profile data
      const extra = { firstName, lastName, documentId, phone, studentId: user.studentId || null };

      // Create associated academic profile depending on role
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
          } else {
            console.warn('No se encontró estudiante con cédula', documentId);
          }
        }
      } catch (e) {
        console.warn('Advertencia al crear perfil:', e.message);
      }

      setSuccess(user.message || 'Cuenta creada correctamente');
      window.setTimeout(() => {
        onRegisterSuccess && onRegisterSuccess(user, role, extra);
        navigate('/', { replace: true });
      }, 1200);
    } catch (err) {
      if (err && (err.code === 'EMAIL_ALREADY_REGISTERED' || err.code === 'auth/email-already-in-use')) {
        setError('Correo ya registrado');
        setEmailExists(true);
      } else if (err && err.code === 'STUDENT_ACCOUNT_ALREADY_EXISTS') {
        setError('Este estudiante ya tiene una cuenta creada');
      } else {
        setError(err.message || 'Error creando la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async () => {
    setResetSent(false);
    setError(null);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch (e) {
      setError(e.message || 'Error enviando correo de recuperación');
    }
  };

  return (
    <div className="min-h-screen flex items-stretch">
      <div className="hidden lg:flex w-1/2 items-center justify-center px-10" style={{ background: 'linear-gradient(135deg,#2a8a99 0%,#1f6b7a 100%)' }}>
        <div className="text-center max-w-lg">
          <div className="bg-white rounded-2xl inline-flex items-center justify-center p-2 shadow-2xl mb-8">
            <img src={getAssetPath('logo 1.png')} alt="SERMA" className="w-40 h-40 object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Sistema Educativo SERMA</h1>
          <p className="text-white/95 text-base leading-relaxed">Sistema centralizado de gestión académica y aprendizaje</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-white px-4 py-10 overflow-y-auto">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
          <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Crear cuenta</h2>
          <p className="text-center text-sm text-gray-600 mb-6">Completa los datos para registrarte</p>

          {error && <div className="text-sm text-red-600 mb-3 bg-red-50 p-3 rounded">{error}</div>}
          {success && <div className="text-sm text-green-700 mb-3 bg-green-50 p-3 rounded">{success}</div>}

          <form onSubmit={submit}>
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
                La cédula coincide con un estudiante registrado; se creará una cuenta de acudiente vinculada a ese alumno.
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-700 mb-1">Celular</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Número de celular" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-600" />
            </div>

            <button disabled={loading} type="submit" className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50">{loading ? 'Creando...' : 'Crear cuenta'}</button>
          </form>

          <div className="text-center text-sm text-gray-700 mt-6">
            ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Iniciar sesión</Link>
          </div>

          {emailExists && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">El correo proporcionado ya está en uso.</p>
              <div className="mt-3 flex gap-2">
                <Link to="/login" className="flex-1 px-3 py-2 bg-blue-600 text-white text-center text-sm rounded">Ir a iniciar sesión</Link>
                <button onClick={handleSendReset} className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm">Enviar recuperación</button>
              </div>
              {resetSent && <p className="mt-2 text-sm text-green-700">Correo de recuperación enviado. Revisa tu bandeja.</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
