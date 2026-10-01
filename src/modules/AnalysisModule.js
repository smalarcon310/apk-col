import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Filter, RefreshCcw, Search } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getAllStudents } from '../services/studentService';
import { getAllCourses } from '../services/courseService';
import { getAllSubjects } from '../services/subjectService';
import { getLatestAdvanceForStudentSubject } from '../services/avanceService';
import LoadingScreen from '../components/LoadingScreen';

const BLUE = '#2563eb';
const PALETTE = ['#2563eb', '#60a5fa', '#93c5fd', '#1d4ed8', '#3b82f6', '#bfdbfe'];

const AnalysisModule = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [grade, setGrade] = useState('');
  const [courseId, setCourseId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [search, setSearch] = useState('');
  const [riskThreshold, setRiskThreshold] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentRows, courseRows, subjectRows] = await Promise.all([
        getAllStudents(),
        getAllCourses(),
        getAllSubjects(),
      ]);
      const rows = await Promise.all(studentRows.flatMap((student) =>
        subjectRows
          .filter((subject) => subject.courseId === student.courseId || subject.course_id === student.courseId)
          .map(async (subject) => {
            const advance = await getLatestAdvanceForStudentSubject(student.id, subject.id);
            return {
              student,
              subject,
              course: courseRows.find((course) => course.id === student.courseId),
              progress: advance ? Number(advance.progress ?? advance.average ?? 0) : null,
              comment: advance?.comments || advance?.comment || '',
            };
          })
      ));
      setStudents(studentRows);
      setCourses(courseRows);
      setSubjects(subjectRows);
      setAdvances(rows);
    } catch (loadError) {
      console.error('No se pudo cargar el análisis institucional:', loadError);
      setError('No se pudieron cargar los datos del análisis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredAdvances = useMemo(() => advances.filter((row) => {
    const rowGrade = String(row.student.grade || row.course?.grade || '');
    const matchesGrade = !grade || rowGrade === grade;
    const matchesCourse = !courseId || row.student.courseId === courseId;
    const matchesSubject = !subjectId || row.subject.id === subjectId;
    return matchesGrade && matchesCourse && matchesSubject;
  }), [advances, grade, courseId, subjectId]);

  const byGrade = useMemo(() => {
    const groups = {};
    filteredAdvances.forEach((row) => {
      const key = row.student.grade || row.course?.grade || 'Sin grado';
      if (!groups[key]) groups[key] = [];
      if (row.progress !== null) groups[key].push(row.progress);
    });
    return Object.entries(groups).map(([name, values]) => ({
      name: name === 'Sin grado' ? name : `${name}°`,
      value: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0,
    })).sort((a, b) => Number.parseInt(a.name, 10) - Number.parseInt(b.name, 10));
  }, [filteredAdvances, riskThreshold]);

  const byCourse = useMemo(() => {
    const groups = {};
    filteredAdvances.forEach((row) => {
      const key = row.course?.name || row.student.courseId || 'Sin curso';
      if (!groups[key]) groups[key] = [];
      if (row.progress !== null) groups[key].push(row.progress);
    });
    return Object.entries(groups).map(([name, values]) => ({
      name: name.replace(/^.*?(\d{3,4}).*$/, '$1'),
      value: values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0,
    }));
  }, [filteredAdvances]);

  const subjectNames = useMemo(() => {
    const uniqueNames = new Map();
    filteredAdvances.forEach((row) => {
      const name = String(row.subject.name || 'Sin materia').trim();
      const key = name.toLocaleLowerCase();
      if (!uniqueNames.has(key)) uniqueNames.set(key, name);
    });
    return [...uniqueNames.entries()];
  }, [filteredAdvances]);
  const heatmap = useMemo(() => {
    const grouped = {};
    filteredAdvances.forEach((row) => {
      const course = row.course?.name || row.student.courseId || 'Sin curso';
      const subjectName = String(row.subject.name || 'Sin materia').trim().toLocaleLowerCase();
      const key = `${course}-${subjectName}`;
      if (!grouped[key]) grouped[key] = { total: 0, count: 0 };
      if (row.progress !== null) {
        grouped[key].total += row.progress;
        grouped[key].count += 1;
      }
    });
    return [...new Set(filteredAdvances.map((row) => row.course?.name || row.student.courseId || 'Sin curso'))].map((course) => ({
      course,
      values: subjectNames.map(([subjectName]) => {
        const item = grouped[`${course}-${subjectName}`];
        return item?.count ? Math.round(item.total / item.count) : null;
      }),
    }));
  }, [filteredAdvances, subjectNames]);

  const studentsWithoutAdvance = useMemo(() => new Set(
    filteredAdvances.filter((row) => row.progress === null).map((row) => row.student.id)
  ).size, [filteredAdvances]);
  const studentsWithAdvance = useMemo(() => new Set(
    filteredAdvances.filter((row) => row.progress !== null).map((row) => row.student.id)
  ).size, [filteredAdvances]);
  const lowProgress = useMemo(() => filteredAdvances
    .filter((row) => row.progress !== null && row.progress < riskThreshold)
    .sort((a, b) => a.progress - b.progress)
    .filter((row, index, rows) => index === rows.findIndex((item) => item.student.id === row.student.id && item.subject.id === row.subject.id))
    .slice(0, 50), [filteredAdvances]);

  const pieData = [
    { name: 'Con avance', value: studentsWithAdvance },
    { name: 'Sin avance', value: studentsWithoutAdvance },
  ];

  if (loading) return <LoadingScreen size="full" />;
  if (error) return <div className="m-8 rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">{error}<button onClick={loadData} className="ml-4 underline">Reintentar</button></div>;

  return (
    <div className="min-h-screen bg-[#f4f7f5] px-4 py-6 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-700">Una mirada a toda la institución</p>
            <h2 className="text-3xl font-bold tracking-tight">Análisis académico <span className="text-blue-600">•</span></h2>
            <p className="mt-2 text-sm text-slate-500">Entiende el avance de tus estudiantes e identifica dónde hacer la diferencia.</p>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:border-blue-300"><RefreshCcw className="h-4 w-4" /> Actualizar</button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><Filter className="h-4 w-4 text-blue-600" /> Explorar datos</div>
          <select value={grade} onChange={(event) => setGrade(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Todos los grados</option>{[...new Set(students.map((item) => item.grade).filter(Boolean))].sort().map((item) => <option key={item} value={item}>{item}°</option>)}</select>
          <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Todos los cursos</option>{courses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Todas las materias</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <label className="flex items-center gap-2 text-sm text-slate-600">Mostrar avances por debajo de
            <input type="number" min="0" max="100" value={riskThreshold} onChange={(event) => setRiskThreshold(Math.max(0, Math.min(100, Number(event.target.value))))} className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-blue-500" />%
          </label>
          <button onClick={() => { setGrade(''); setCourseId(''); setSubjectId(''); setRiskThreshold(60); }} className="text-sm text-blue-600 hover:underline">Restablecer</button>
        </div>

        <div className="mb-3 flex items-center justify-between text-sm text-slate-500"><span className="font-medium text-blue-700">● Panorama académico</span><span>{filteredAdvances.length} registros analizados</span></div>
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard title="Avance académico por grado" subtitle="Promedio de avance de cada grado">
            <ResponsiveContainer width="100%" height={260}><BarChart data={byGrade}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis domain={[0, 100]} unit="%" /><Tooltip formatter={(value) => [`${value}%`, 'Avance']} /><Bar dataKey="value" fill={BLUE} radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Avance académico por curso" subtitle="Una mirada al rendimiento de cada grupo">
            <ResponsiveContainer width="100%" height={260}><BarChart data={byCourse}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis domain={[0, 100]} unit="%" /><Tooltip formatter={(value) => [`${value}%`, 'Avance']} /><Bar dataKey="value" fill="#60a5fa" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="mb-6 grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Mapa de avance por curso y materia</h3>
            <p className="mb-4 text-xs text-slate-500">Identifica dónde enfocar el acompañamiento académico.</p>
            <div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead><tr><th className="px-2 py-3 text-slate-500">Curso</th>{subjectNames.map(([id, name]) => <th key={id} className="min-w-[120px] px-2 py-3 text-center text-slate-500">{name}</th>)}</tr></thead><tbody>{heatmap.map((row) => <tr key={row.course} className="border-t border-slate-100"><td className="px-2 py-3 font-medium">{row.course}</td>{row.values.map((value, index) => <td key={`${row.course}-${index}`} className={`m-1 rounded px-2 py-3 text-center ${value === null ? 'bg-slate-50 text-slate-400' : value < 60 ? 'bg-orange-100 text-orange-700' : value < 80 ? 'bg-blue-50 text-blue-700' : 'bg-blue-100 text-blue-800'}`}>{value === null ? '—' : `${value}%`}</td>)}</tr>)}</tbody></table></div>
          </section>
          <ChartCard title="Registro de avances" subtitle="Estudiantes con y sin avances registrados">
            <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>{pieData.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? BLUE : '#cbd5e1'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
            <div className="text-center text-sm text-slate-500">{studentsWithAdvance} con avance · {studentsWithoutAdvance} sin avance</div>
          </ChartCard>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5"><div><h3 className="text-lg font-semibold">Estudiantes que necesitan acompañamiento</h3><p className="text-xs text-slate-500">Avances por debajo del {riskThreshold}%.</p></div><span className="rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-700"><AlertTriangle className="mr-1 inline h-4 w-4" /> {lowProgress.length} registros</span></div>
          <div className="border-b border-slate-200 p-4"><div className="relative max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar estudiante o materia..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></div></div>
          <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Estudiante</th><th className="px-5 py-3">Curso</th><th className="px-5 py-3">Materia</th><th className="px-5 py-3">Avance</th><th className="px-5 py-3">Seguimiento</th></tr></thead><tbody>{lowProgress.filter((row) => `${row.student.firstName} ${row.student.lastName} ${row.subject.name}`.toLowerCase().includes(search.toLowerCase())).slice(0, 10).map((row) => <tr key={`${row.student.id}-${row.subject.id}`} className="border-t border-slate-100"><td className="px-5 py-4 font-medium">{row.student.firstName} {row.student.lastName}</td><td className="px-5 py-4 text-slate-500">{row.course?.name || '—'}</td><td className="px-5 py-4 text-slate-500">{row.subject.name}</td><td className="px-5 py-4 font-semibold text-orange-600">{row.progress}%</td><td className="px-5 py-4 text-xs text-slate-500">{row.comment || 'Sin comentario registrado'}</td></tr>)}</tbody></table></div>
        </section>
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children }) => (
  <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-semibold">{title}</h3><p className="mb-3 text-xs text-slate-500">{subtitle}</p>{children}</section>
);

export default AnalysisModule;
