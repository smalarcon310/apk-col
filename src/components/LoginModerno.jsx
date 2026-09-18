import { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../services/authService';
import './LoginModerno.css';

export const LoginModerno = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('PADRE');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await signInWithEmail(email, password);

      // 4. Redirigir al dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('Usuario no existe');
      } else if (err.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta');
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!nombre) {
        setError('El nombre es requerido');
        return;
      }

      await signUpWithEmail(email, password, { name: nombre, role: rol.toLowerCase() });

      // 3. Redirigir
      window.location.href = '/dashboard';
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres');
      } else {
        setError(err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = isRegister ? handleRegister : handleLogin;

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🎓 Sistema Educativo</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                disabled={loading}
              />

              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                disabled={loading}
              >
                <option value="PADRE">Padre/Acudiente</option>
                <option value="PROFESOR">Profesor</option>
                <option value="RECTOR">Rector</option>
              </select>
            </>
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? 'Cargando...'
              : isRegister
              ? 'Registrarse'
              : 'Iniciar Sesión'}
          </button>
        </form>

        <p>
          {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          <button
            type="button"
            className="link-button"
            onClick={() => setIsRegister(!isRegister)}
            disabled={loading}
          >
            {isRegister ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </div>
    </div>
  );
};
