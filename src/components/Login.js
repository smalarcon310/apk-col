import React, { useState } from 'react';
import { signInWithEmail, signInWithGoogle } from '../services/authService';

const Login = ({ onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
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
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      onLoginSuccess && onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Iniciar sesión</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">Cerrar</button>
        </div>

        {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm text-gray-700 mb-1">Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border rounded px-3 py-2" />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border rounded px-3 py-2" />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>

        <div className="mt-4">
          <div className="text-center text-sm text-gray-500 mb-2">o</div>
          <button onClick={handleGoogle} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded bg-white">
            <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
            <span>Entrar con Google</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
