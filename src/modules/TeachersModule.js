import React, { useState, useEffect } from 'react';
import Alert from '../components/Alert';
import { createTeacher, getAllTeachers, deleteTeacher } from '../services/teacherService';
import { getAllSubjects } from '../services/subjectService';

const emptyForm = {
  firstName: '',
  lastName: '',
  documentId: '',
  email: '',
  phone: '',
  subjects: '',
};

export const TeachersModule = ({ currentProfile }) => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await getAllTeachers();
        setTeachers(list || []);
        const subs = await getAllSubjects();
        setSubjects(subs || []);
      } catch (err) {
        console.error('Error cargando profesores', err);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const teacher = await createTeacher({
        ...form,
        subjects: form.subjects ? form.subjects.split(',').map((s) => s.trim()) : [],
      });
      setMessage('Profesor creado correctamente');
      setTeachers((t) => [teacher, ...t]);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || 'Error creando profesor');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este profesor? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await deleteTeacher(id);
      setTeachers((t) => t.filter((x) => x.id !== id));
      setMessage('Profesor eliminado correctamente');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error eliminando profesor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Gestión de Profesores</h2>

      {message && <Alert type="success" message={message} />}
      {error && <Alert type="error" message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mostrar formulario de creación SOLO para el Rector */}
        {(!currentProfile || currentProfile.role === 'rector') && (
          <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input name="firstName" placeholder="Nombre" value={form.firstName} onChange={handleChange} className="border p-2 rounded" />
              <input name="lastName" placeholder="Apellido" value={form.lastName} onChange={handleChange} className="border p-2 rounded" />
              <input name="documentId" placeholder="Documento" value={form.documentId} onChange={handleChange} className="border p-2 rounded" />
              <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="border p-2 rounded" />
              <input name="phone" placeholder="Teléfono" value={form.phone} onChange={handleChange} className="border p-2 rounded" />
              <input name="subjects" placeholder="Materias (separadas por coma)" value={form.subjects} onChange={handleChange} className="border p-2 rounded col-span-2" />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
                {loading ? 'Guardando...' : 'Crear Profesor'}
              </button>
              <button type="button" onClick={() => setForm(emptyForm)} className="px-3 py-2 border rounded">Limpiar</button>
            </div>
          </form>
        )}

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">Profesores registrados</h3>
          {teachers.length === 0 ? (
            <div className="text-sm text-gray-500">No hay profesores aún.</div>
          ) : (
            <ul className="space-y-2">
              {teachers.map((t) => (
                <li key={t.id} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{t.firstName} {t.lastName}</div>
                    <div className="text-xs text-gray-500">{t.email} • {t.phone}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-400">
                      {t.subjects && Array.isArray(t.subjects) ? (
                        t.subjects.map((s) => {
                          // if s looks like an id present in subjects list, show subject name
                          const sub = subjects.find((x) => x.id === s);
                          return sub ? sub.name : s;
                        }).join(', ')
                      ) : (t.subjects || '')}
                    </div>
                    {/* Mostrar botón Eliminar SOLO para Rector */}
                    {(!currentProfile || currentProfile.role === 'rector') && (
                      <button onClick={() => handleDelete(t.id)} className="text-red-600 text-sm px-3 py-1 border border-red-100 rounded hover:bg-red-50">Eliminar</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeachersModule;
