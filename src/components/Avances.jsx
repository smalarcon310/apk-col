import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import './Avances.css';

export const Avances = ({ estudianteId, esProfesor }) => {
  const endpoint = esProfesor ? '/api/avances' : `/api/avances/estudiante/${estudianteId}`;
  const { data: avances, loading, error, fetchData } = useApi(endpoint, []);

  useEffect(() => {
    if (estudianteId || esProfesor) {
      fetchData();
    }
  }, [estudianteId, esProfesor]);

  if (loading) return <p className="loading">Cargando avances...</p>;
  if (error) return <p className="error">Error: {error}</p>;

  const promedioCalificaciones =
    Array.isArray(avances) && avances.length > 0
      ? (avances.reduce((sum, a) => sum + parseFloat(a.calificacion), 0) / avances.length).toFixed(2)
      : 0;

  return (
    <div className="avances-container">
      <h2>📊 Desempeño Académico</h2>

      {Array.isArray(avances) && avances.length > 0 && (
        <div className="promedio-section">
          <p>
            <strong>Promedio General:</strong>{' '}
            <span className={parseFloat(promedioCalificaciones) >= 70 ? 'good' : 'warning'}>
              {promedioCalificaciones}
            </span>
          </p>
        </div>
      )}

      {Array.isArray(avances) && avances.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Materia</th>
              <th>Calificación</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Profesor</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {avances.map((avance) => (
              <tr key={avance.id} className={avance.calificacion >= 70 ? 'pass' : 'fail'}>
                <td>{avance.materia_nombre || 'N/A'}</td>
                <td className="calificacion">
                  <strong>{avance.calificacion}</strong>
                </td>
                <td>{avance.tipo_evaluacion}</td>
                <td>{avance.descripcion}</td>
                <td>{avance.profesor_nombre || 'N/A'}</td>
                <td>{new Date(avance.fecha_registro).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty">No hay avances registrados</p>
      )}
    </div>
  );
};
