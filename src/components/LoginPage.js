import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithEmail, signInWithGoogle } from '../services/authService';

const EyeIcon = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    {open ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
  </svg>
);

const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e && e.preventDefault();
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
      setError(err.message || 'Error con Google');
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background: 'linear-gradient(135deg,#1e90ff 0%,#10b981 100%)'}}>
      <div className="w-full max-w-3xl mx-4">
        <div className="rounded-2xl bg-white shadow-xl overflow-hidden flex">
          <div className="w-1/2 p-10 hidden md:block" style={{background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))'}}>
            <div className="flex flex-col items-center justify-center h-full text-center text-white">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l3 6 6 .5-4.5 3.8L20 20l-8-5-8 5 1.5-7.7L1 8.5 7 8z"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">SERMA</h2>
              <p className="text-sm text-gray-600">Sistema de Gestión Académica</p>
              <p className="text-xs text-gray-500 mt-2">Institución Educativa Departamental Bruselas</p>
            </div>
          </div>

          <div className="w-full md:w-1/2 p-8 md:p-10">
            <h3 className="text-center text-xl font-semibold mb-1">Iniciar Sesión</h3>
            <p className="text-center text-sm text-gray-500 mb-6">Ingrese sus credenciales para acceder al sistema</p>

            {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

            <form onSubmit={submit}>
              <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <div className="mt-1 mb-4">
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="correo@ejemplo.com" required className="w-full border rounded px-4 py-3 text-gray-700" />
              </div>

              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1 mb-4 relative">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} placeholder="********" required className="w-full border rounded px-4 py-3 pr-10 text-gray-700" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3">
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4" /> Recordarme
                </label>
                <Link to="/register" className="text-sm text-blue-600">¿Olvidó su contraseña?</Link>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 rounded-lg text-white font-semibold" style={{background: 'linear-gradient(90deg,#1e90ff,#10b981)'}}>
                {loading ? 'Entrando...' : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="text-center text-sm text-gray-500 mb-3">o acceder con</div>
            <div className="text-center text-sm text-gray-600 mt-3">¿No tienes cuenta? <Link to="/register" className="text-blue-600">Crear cuenta</Link></div>
            <div className="flex gap-3">
              <button onClick={handleGoogle} disabled={loading} className="flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 bg-white">
                <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
                <span className="text-sm">Entrar con Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
