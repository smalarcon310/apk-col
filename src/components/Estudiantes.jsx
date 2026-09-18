import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import './Estudiantes.css';

export const Estudiantes = () => {
  const { data: estudiantes, loading, error, fetchData, create, remove } =
    useApi('/api/estudiantes', []);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [grado, setGrado] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitError('');

    try {
      await create({ nombre, email, grado });
      setNombre('');
      setEmail('');
      setGrado('');
    } catch (err) {
      setSubmitError(err.response?.data?.error || err.message);
    }
  };

  const handleDelete = async (id, nombreEstudiante) => {
    if (window.confirm(`¿Eliminar a ${nombreEstudiante}?`)) {
      try {
        await remove(id);
      } catch (err) {
        alert('Error: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  if (error && !estudiantes?.length) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="estudiantes-container">
      <h2>📚 Gestión de Estudiantes</h2>

      {/* Formulario */}
      <div className="form-section">
        <h3>Agregar Nuevo Estudiante</h3>
        {submitError && <div className="error">{submitError}</div>}

        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Nombre:</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre completo"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Grado:</label>
            <select
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Seleccionar grado</option>
              <option value="Primero">Primero</option>
              <option value="Segundo">Segundo</option>
              <option value="Tercero">Tercero</option>
              <option value="Cuarto">Cuarto</option>
              <option value="Quinto">Quinto</option>
            </select>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Agregar Estudiante'}
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="table-section">
        <h3>Lista de Estudiantes ({estudiantes?.length || 0})</h3>

        {loading && <p>Cargando...</p>}

        {Array.isArray(estudiantes) && estudiantes.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Grado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((est) => (
                <tr key={est.id}>
                  <td>{est.id}</td>
                  <td>{est.nombre}</td>
                  <td>{est.email}</td>
                  <td>{est.grado}</td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(est.id, est.nombre)}
                      disabled={loading}
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay estudiantes registrados</p>
        )}
      </div>
    </div>
  );
};
