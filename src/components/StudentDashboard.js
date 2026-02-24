import React, { useEffect, useState } from 'react';
import { Award, Target, CheckCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StudentDashboard = ({ currentProfile }) => {
  const [studentData, setStudentData] = useState(null);

  // Datos de ejemplo - En producción, estos vendrían de Firestore
  useEffect(() => {
    const mockData = {
      name: currentProfile?.name || 'Estudiante',
      grade: '10°B',
      studentId: '2024-10-156',
      averageGrade: 4.2,
      currentProgress: 78,
      attendance: 95,
      weekProgress: 12,
      subjects: [
        { name: 'Matemáticas', current: 92, previous: 85, change: '+7%' },
        { name: 'Ciencias', current: 88, previous: 82, change: '+6%' },
        { name: 'Español', current: 78, previous: 84, change: '-6%' },
        { name: 'Inglés', current: 85, previous: 79, change: '+6%' },
        { name: 'Sociales', current: 90, previous: 88, change: '+2%' },
        { name: 'Ed. Física', current: 92, previous: 90, change: '+2%' },
      ],
      motivationMessage: '¡Excelente Progreso! Has mejorado tu avance en 13% este semestre (de 65% a 78%). Continúa así para alcanzar el 100% en todas las materias. Tu constancia y dedicación se reflejan en tus resultados.',
    };
    setStudentData(mockData);
  }, [currentProfile]);

  if (!studentData) return <div className="p-6">Cargando...</div>;

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
    </div>
  );
};

export default StudentDashboard;
