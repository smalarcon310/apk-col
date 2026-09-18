import React, { useState, useMemo } from 'react';
import { createAdvance } from '../services/avanceService';
import Alert from './Alert';
import ConfirmDialog from './ConfirmDialog';
import { AnimatePresence } from 'framer-motion';

const emptyStudentRow = (student) => ({
  studentId: student.id,
  studentName: `${student.firstName} ${student.lastName}`,
  progress: '',
  comments: '',
  status: 'draft',
});

export const AvancesForm = ({ subject, teacher, students = [], onSaved, hideTitle = false, hideActions = false }) => {
  const [rows, setRows] = useState(() => students.map(emptyStudentRow));
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const handleChange = (index, field, value) => {
    setRows((r) => {
      const copy = [...r];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const validateRow = (row) => {
    const v = Number(row.progress);
    return !isNaN(v) && v >= 0 && v <= 100;
  };

  const computeAverage = (row) => {
    const v = Number(row.progress);
    return !isNaN(v) ? Math.round(v * 100) / 100 : 0;
  };

  const handleSave = async (publish = false) => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      for (const row of rows) {
        // si no hay valores válidos y no está publicando, saltar
        if (!validateRow(row)) continue;

        const payload = {
          studentId: row.studentId,
          subjectId: subject.id,
          teacherId: teacher.id,
          progress: Number(row.progress),
          comments: row.comments || '',
          status: publish ? 'published' : 'draft',
        };

        if (publish) {
          // confirmación simple por fila (podría ser global)
          // aquí asumimos la confirmación ya hecha por el usuario mediante el botón
        }

        await createAdvance(payload);
      }

      setMessage(publish ? 'Avances publicados correctamente' : 'Borrador guardado');
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error guardando avances');
    } finally {
      setSaving(false);
    }
  };

  const alerts = useMemo(() => {
    return rows.map((r) => {
      const low = Number(r.progress) < 60 && r.progress !== '';
      const missing = r.progress === '' || r.progress === null || r.progress === undefined;
      return { studentId: r.studentId, low, missing };
    });
  }, [rows]);

  return (
    <div className="bg-white p-4 rounded shadow mt-4">
      {!hideTitle && (
        <h3 className="font-semibold mb-3">Registro de Avances - {subject.name}</h3>
      )}

      <AnimatePresence>
        {message && (
          <Alert key="msg" type="success" message={message} onClose={() => setMessage(null)} />
        )}
        {error && (
          <Alert key="err" type="error" message={error} onClose={() => setError(null)} />
        )}
      </AnimatePresence>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th>Estudiante</th>
              <th>Avance (%)</th>
              <th>Promedio</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.studentId} className={`${alerts[i].low ? 'bg-yellow-50' : ''}`}>
                <td className="py-2 pr-3">{r.studentName}</td>
                <td><input type="number" min="0" max="100" value={r.progress} onChange={(e) => handleChange(i, 'progress', e.target.value)} className="border p-1 w-20" /></td>
                <td className="text-center">{computeAverage(r)}</td>
                <td><input type="text" value={r.comments} onChange={(e) => handleChange(i, 'comments', e.target.value)} className="border p-1 w-64" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!hideActions && (
        <div className="mt-4 flex gap-2">
          <button onClick={() => handleSave(false)} disabled={saving} className="px-4 py-2 border rounded">Guardar borrador</button>
          <button onClick={() => setConfirmPublish(true)} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded">Publicar avances</button>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmPublish}
        title="Publicar avances"
        message="Confirma publicar los avances seleccionados?"
        onConfirm={async () => { setConfirmPublish(false); await handleSave(true); }}
        onCancel={() => setConfirmPublish(false)}
        confirmLabel="Publicar"
      />
    </div>
  );
};

export default AvancesForm;
