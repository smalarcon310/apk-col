import React, { useEffect, useState } from 'react';
import { getLatestAdvanceForStudentSubject, createAdvance, updateAdvance } from '../services/avanceService';

const TeacherProgressPanel = ({ student, subject, teacher, onSaved, onCancel }) => {
  const [previous, setPrevious] = useState(null);
  const [value, setValue] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!student || !subject) return;
      try {
        const last = await getLatestAdvanceForStudentSubject(student.id, subject.id);
        if (last) {
          // prefer progress field if present, else average
          setPrevious(last.progress ?? last.average ?? 0);
          setValue(last.progress ?? last.average ?? 0);
          setComment(last.comments || last.comment || '');
        } else {
          setPrevious(null);
          setValue(0);
          setComment('');
        }
      } catch (err) {
        console.error(err);
        setPrevious(null);
        setComment('');
      }
      setMessage(null);
    };
    load();
  }, [student, subject]);

  const handleSave = async () => {
    if (!student || !subject || !teacher) return;
    setSaving(true);
      try {
      const payload = {
        studentId: student.id,
        subjectId: subject.id,
        teacherId: teacher.id,
        progress: Number(value),
        comments: comment.trim(),
      };
      const last = await getLatestAdvanceForStudentSubject(student.id, subject.id);
      if (last?.id) await updateAdvance(last.id, payload);
      else await createAdvance(payload);
      setMessage('Avance guardado');
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      setMessage('Error guardando avance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-4">{subject ? subject.name : 'Selecciona materia'}</h3>

      {!student || !subject ? (
        <div className="text-sm text-gray-500">Seleccione estudiante y materia para editar el avance.</div>
      ) : (
        <div>
          <div className="mb-3">
            <div className="text-xs text-gray-500">Estudiante</div>
            <div className="font-medium">{student.firstName} {student.lastName}</div>
            {student.documentId && (
              <div className="text-xs text-gray-500">Cédula: {student.documentId}</div>
            )}
          </div>

          <div className="mb-3">
            <div className="text-xs text-gray-500">Avance anterior</div>
            <div className="font-medium">{previous !== null ? `${previous}%` : 'Sin registros'}</div>
            <div className="w-full bg-gray-200 h-2 rounded mt-2">
              <div style={{ width: `${previous || 0}%` }} className="h-2 bg-blue-500 rounded" />
            </div>
          </div>

          <div className="mb-3">
            <div className="text-xs text-gray-500">Nuevo avance</div>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="100" value={value} onChange={(e) => setValue(e.target.value)} className="flex-1" />
              <input type="number" min="0" max="100" value={value} onChange={(e) => setValue(e.target.value)} className="w-20 border p-1 rounded" />
            </div>
            <div className="w-full bg-gray-200 h-2 rounded mt-3">
              <div style={{ width: `${value}%` }} className="h-2 bg-green-500 rounded" />
            </div>
          </div>

          <div className="mb-3">
            <div className="text-xs text-gray-500">Comentario para el estudiante</div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribe una recomendación o retroalimentación..."
              className="w-full border p-2 rounded min-h-[88px]"
              maxLength={500}
            />
            <div className="text-xs text-gray-400 text-right mt-1">{comment.length}/500</div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={onCancel} className="px-4 py-2 border rounded">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">Guardar avance</button>
          </div>

          {message && <div className="mt-3 text-sm text-gray-700">{message}</div>}
        </div>
      )}
    </div>
  );
};

export default TeacherProgressPanel;
