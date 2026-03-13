import React, { useEffect, useState } from 'react';
import { Award, Target, CheckCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAllSubjects } from '../services/subjectService';
import {
  getAdvancesByStudentAndSubject,
} from '../services/avanceService';
import { getStudentById } from '../services/studentService';
import { db, auth } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const StudentDashboard = ({ currentProfile }) => {
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    // attempt to determine a valid studentId even if profile lacked one
    const resolveAndLoad = async () => {
      let studentId = currentProfile?.studentId;
      if (!studentId) {
        // try by auth UID or documentId
        try {
          const students = await import('../services/studentService').then((m) => m.getAllStudents());
          const uid = auth.currentUser?.uid;
          const docId = currentProfile?.documentId;
          const found = students.find(
            (s) => s.authUid === uid || (docId && s.documentId === docId)
          );
          studentId = found?.id;
          if (found && !currentProfile.studentId) {
            // update profile object locally for future use
            currentProfile.studentId = studentId;
          }
          // if we matched and the student record lacks authUid, persist it
          if (found && found.id && !found.authUid && auth.currentUser?.uid) {
            try {
              const { updateStudent } = await import('../services/studentService');
              await updateStudent(found.id, { authUid: auth.currentUser.uid });
            } catch (e) {
              console.warn('No se pudo guardar authUid en student:', e);
            }
          }
        } catch (e) {
          console.warn('No se pudo resolver studentId automáticamente:', e);
        }
      }

      if (!studentId) {
        setStudentData({ error: 'No se encontró tu perfil como estudiante. Contacta al administrador.' });
        return;
      }

      const loadData = async () => {
        try {
          const studentInfo = await getStudentById(studentId).catch(() => null);
          const subjects = await getAllSubjects();
          const rows = await Promise.all(
            subjects.map(async (subj) => {
              let advances = await getAdvancesByStudentAndSubject(studentId, subj.id);
              advances = advances.filter((a) => a.status === 'published');
              let current = 0;
              let previous = 0;
              if (advances && advances.length > 0) {
                const last = advances[advances.length - 1];
                current = last.progress ?? last.average ?? 0;
                if (advances.length > 1) {
                  const prev = advances[advances.length - 2];
                  previous = prev.progress ?? prev.average ?? 0;
                }
              }
              const changeVal = current - previous;
              const changeStr =
                changeVal > 0
                  ? `+${changeVal}%`
                  : changeVal < 0
                  ? `${changeVal}%`
                  : '0%';
              return {
                name: subj.name,
                current,
                previous,
                change: changeStr,
              };
            })
          );

          const avgProgress =
            rows.length > 0
              ? Math.round(rows.reduce((sum, r) => sum + r.current, 0) / rows.length)
              : 0;
          const avgPrevious =
            rows.length > 0
              ? Math.round(rows.reduce((sum, r) => sum + r.previous, 0) / rows.length)
              : 0;

          setStudentData({
            name:
              (studentInfo && `${studentInfo.firstName} ${studentInfo.lastName}`) ||
              currentProfile?.name ||
              'Estudiante',
            grade: studentInfo?.grade ? `Grado ${studentInfo.grade}` : '',
            studentId:
              studentInfo?.documentId || studentInfo?.id || studentId || '',
            averageGrade: studentInfo?.averageGrade || 0,
            currentProgress: avgProgress,
            attendance: studentInfo?.attendance || 0,
            weekProgress: avgProgress - avgPrevious,
            subjects: rows,
            motivationMessage:
              avgProgress > 0
                ? `Tu avance promedio actual es ${avgProgress}%. Sigue esforzándote para mejorar.`
                : 'Aún no hay avances publicados por tu docente.',
          });
        } catch (err) {
          console.error('Error cargando datos del estudiante:', err);
        }
      };

      loadData();

      const q = query(
        collection(db, 'avances'),
        where('studentId', '==', studentId),
        where('status', '==', 'published')
      );
      const unsubscribe = onSnapshot(q, loadData);
      return unsubscribe;
    };

    const unsubscribePromise = resolveAndLoad();
    // handle cleanup if effect re-runs
    return () => {
      if (typeof unsubscribePromise.then === 'function') {
        unsubscribePromise.then((u) => u && u());
      }
    };
  }, [currentProfile]);

  if (!studentData) return <div className="p-6">Cargando...</div>;

  if (studentData.error) {
    return <div className="p-6 text-red-600">{studentData.error}</div>;
  }

  const comparisonData = studentData.subjects.map((s) => ({
    name: s.name,
    Anterior: s.previous,
    'Avance Actual': s.current,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Encabezado del estudiante */}
      <div
        className="rounded-lg text-white p-6 mb-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1e90ff 0%, #10b981 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
            <span className="text-2xl">👨‍🎓</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{studentData.name}</h2>
            <p className="text-sm opacity-90">{studentData.grade} • ID: {studentData.studentId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-400 rounded-full"></span>
          <span className="text-sm">En tiempo real</span>
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Promedio General */}
        <div
          className="rounded-lg text-white p-6 flex flex-col items-center justify-center"
          style={{ background: '#1e90ff' }}
        >
          <Award className="w-8 h-8 mb-2" />
          <p className="text-4xl font-bold">{studentData.averageGrade}</p>
          <p className="text-sm text-center">Promedio General</p>
        </div>

        {/* Avance Actual */}
        <div
          className="rounded-lg text-white p-6 flex flex-col items-center justify-center"
          style={{ background: '#10b981' }}
        >
          <Target className="w-8 h-8 mb-2" />
          <p className="text-4xl font-bold">{studentData.currentProgress}%</p>
          <p className="text-sm text-center">Avance Actual</p>
        </div>

        {/* Asistencia */}
        <div
          className="rounded-lg text-white p-6 flex flex-col items-center justify-center"
          style={{ background: '#a855f7' }}
        >
          <CheckCircle className="w-8 h-8 mb-2" />
          <p className="text-4xl font-bold">{studentData.attendance}%</p>
          <p className="text-sm text-center">Asistencia</p>
        </div>

        {/* Avance Semana Pasada */}
        <div
          className="rounded-lg text-white p-6 flex flex-col items-center justify-center"
          style={{ background: '#ff9500' }}
        >
          <TrendingUp className="w-8 h-8 mb-2" />
          <p className="text-4xl font-bold">+{studentData.weekProgress}%</p>
          <p className="text-sm text-center">Avance Semana Pasada</p>
        </div>
      </div>

      {/* Rendimiento por Materia */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          📚 Rendimiento por Materia
        </h3>
        <div className="space-y-4">
          {studentData.subjects.map((subject, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        idx === 0
                          ? '#1e90ff'
                          : idx === 1
                          ? '#10b981'
                          : idx === 2
                          ? '#a855f7'
                          : idx === 3
                          ? '#ff9500'
                          : idx === 4
                          ? '#06b6d4'
                          : '#8b5cf6',
                    }}
                  ></span>
                  <span className="font-medium">{subject.name}</span>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                      subject.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {subject.change}
                  </span>
                </div>
                <span className="text-lg font-bold">{subject.current}%</span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-gray-500">Avance actual: {subject.current}%</span>
                <span className="text-gray-400">Anterior: {subject.previous}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-black h-2 rounded-full"
                  style={{ width: `${subject.current}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de Comparación */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          📊 Comparación de Avances
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Anterior" fill="#9ca3af" />
            <Bar dataKey="Avance Actual" fill="#1e90ff" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mensaje de motivación */}
      {studentData.motivationMessage && (
        <div
          className="rounded-lg text-white p-6 flex items-start gap-4"
          style={{ background: 'linear-gradient(135deg, #1e90ff 0%, #10b981 100%)' }}
        >
          <TrendingUp className="w-8 h-8 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-lg font-semibold mb-2">¡Excelente Progreso!</h4>
            <p className="text-sm opacity-90">{studentData.motivationMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
