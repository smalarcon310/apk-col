import React, { useState } from 'react';
import { signUpWithEmail, sendPasswordReset } from '../services/authService';
import { createStudent, getStudentByDocument } from '../services/studentService';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = ({ onRegisterSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [documentId, setDocumentId] = useState('');
  const [phone, setPhone] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const role = 'student';

  const submit = async (e) => {
    e && e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const user = await signUpWithEmail(email, password);
      // Build extra profile data
      const extra = { firstName, lastName, documentId, phone };

      // Create a student profile in Firestore (all users are students)
      try {
        let existingStudent = null;
        if (documentId) {
          existingStudent = await getStudentByDocument(documentId);
        }
        if (existingStudent) {
          extra.studentId = existingStudent.id;
        } else {
          const courseId = 'default';
          const grade = '6';
          const savedStudent = await createStudent({ firstName, lastName, documentId, email, phone, courseId, grade });
          extra.studentId = savedStudent.id;
        }
      } catch (e) {
        console.warn('Advertencia al crear estudiante:', e.message);
      }

      onRegisterSuccess && onRegisterSuccess(user, role, extra);
      navigate('/', { replace: true });
    } catch (err) {
      if (err && err.code === 'auth/email-already-in-use') {
        setError('El correo ya está registrado. Puedes iniciar sesión o recuperar la contraseña.');
        setEmailExists(true);
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
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg,#1e90ff 0%,#10b981 100%)'}}>
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-center mb-2">Crear cuenta</h2>
        <p className="text-center text-sm text-gray-500 mb-6">Complete los datos para registrarse</p>

        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

        <form onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre" required className="border rounded px-3 py-2" />
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Apellido" required className="border rounded px-3 py-2" />
          </div>
          <div className="mb-3">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="correo@ejemplo.com" required className="w-full border rounded px-3 py-2" />
          </div>
          <div className="mb-3">
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Contraseña" required className="w-full border rounded px-3 py-2" />
          </div>
          <div className="mb-3">
            <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" placeholder="Confirmar contraseña" required className="w-full border rounded px-3 py-2" />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-600">Cédula</label>
            <input value={documentId} onChange={(e) => setDocumentId(e.target.value)} placeholder="Número de cédula" required className="w-full border rounded px-3 py-2" />
          </div>
          <div className="mb-3">
            <label className="text-sm text-gray-600">Celular</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Número de celular" required className="w-full border rounded px-3 py-2" />
          </div>

          <button disabled={loading} type="submit" className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold">{loading ? 'Creando...' : 'Crear cuenta'}</button>
        </form>

        <div className="text-center text-sm text-gray-600 mt-4">
          ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600">Iniciar sesión</Link>
        </div>

        {emailExists && (
          <div className="mt-4 p-3 bg-yellow-50 border rounded">
            <p className="text-sm text-yellow-800">El correo proporcionado ya está en uso.</p>
            <div className="mt-2 flex gap-2">
              <Link to="/login" className="px-3 py-2 bg-blue-600 text-white rounded">Ir a iniciar sesión</Link>
              <button onClick={handleSendReset} className="px-3 py-2 border rounded">Enviar recuperación</button>
            </div>
            {resetSent && <p className="mt-2 text-sm text-green-700">Correo de recuperación enviado. Revisa tu bandeja.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
