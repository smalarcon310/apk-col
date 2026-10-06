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
      const rows = await Promise.all(studentRows.flatMap((student) => {
        const studentCourseId = String(student.courseId ?? student.course_id ?? '');
        return subjectRows
          .filter((subject) => {
            const subjectCourseId = String(subject.courseId ?? subject.course_id ?? '');
            return studentCourseId && subjectCourseId === studentCourseId;
          })
          .map(async (subject) => {
            const advance = await getLatestAdvanceForStudentSubject(student.id, subject.id);
            return {
              student,
              subject,
              course: courseRows.find((course) => String(course.id) === studentCourseId),
              progress: advance ? Number(advance.progress ?? advance.average ?? 0) : null,
              comment: advance?.comments || advance?.comment || '',
            };
          });
      }));
      setStudents(studentRows);
      setCourses(courseRows);
      setAdvances(rows);
    } catch (loadError) {
      console.error('No se pudo cargar el análisis institucional:', loadError);
      setError('No se pudieron cargar los datos del análisis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const refreshAdvances = () => loadData();
    window.addEventListener('serma:advances-changed', refreshAdvances);
    return () => window.removeEventListener('serma:advances-changed', refreshAdvances);
  }, []);

  const gradeOptions = useMemo(() => [...new Set([
    ...students.map((student) => student.grade),
    ...courses.map((course) => course.grade),
  ].map((value) => String(value || '').trim()).filter(Boolean))]
    .sort((a, b) => Number(a) - Number(b) || a.localeCompare(b)), [students, courses]);

  const courseOptions = useMemo(() => {
    const studentGradesByCourse = new Map();
    students.forEach((student) => {
      const id = String(student.courseId ?? student.course_id ?? '');
      const studentGrade = String(student.grade || '').trim();
      if (!id || !studentGrade) return;
      if (!studentGradesByCourse.has(id)) studentGradesByCourse.set(id, new Set());
      studentGradesByCourse.get(id).add(studentGrade);
    });

    const uniqueCourses = new Map();
    courses.forEach((course) => {
      const id = String(course.id ?? '');
      if (!id || uniqueCourses.has(id)) return;
      const courseGrade = String(course.grade || '').trim();
      const linkedGrades = studentGradesByCourse.get(id) || new Set();
      if (!grade || courseGrade === grade || linkedGrades.has(grade)) {
        uniqueCourses.set(id, course);
      }
    });
    return [...uniqueCourses.values()];
  }, [courses, students, grade]);

  const subjectOptions = useMemo(() => {
    const uniqueSubjects = new Map();
    advances.forEach((row) => {
      const rowGrade = String(row.student.grade || row.course?.grade || '');
      const rowCourseId = String(row.student.courseId ?? row.student.course_id ?? '');
      if (grade && rowGrade !== grade) return;
      if (courseId && rowCourseId !== String(courseId)) return;

      const name = String(row.subject.name || 'Sin materia').trim();
      const key = name.toLocaleLowerCase();
      if (!uniqueSubjects.has(key)) uniqueSubjects.set(key, name);
    });
    return [...uniqueSubjects.entries()];
  }, [advances, grade, courseId]);

  const filteredAdvances = useMemo(() => advances.filter((row) => {
    const rowGrade = String(row.student.grade || row.course?.grade || '');
    const rowCourseId = String(row.student.courseId ?? row.student.course_id ?? '');
    const subjectName = String(row.subject.name || 'Sin materia').trim().toLocaleLowerCase();
    const matchesGrade = !grade || rowGrade === grade;
    const matchesCourse = !courseId || rowCourseId === String(courseId);
    const matchesSubject = !subjectId || subjectName === subjectId;
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
    .filter((row) => row.progress === null || row.progress < riskThreshold)
    .sort((a, b) => {
      if (a.progress === null) return b.progress === null ? 0 : -1;
      if (b.progress === null) return 1;
      return a.progress - b.progress;
    })
    .filter((row, index, rows) => index === rows.findIndex((item) => item.student.id === row.student.id && item.subject.id === row.subject.id))
    , [filteredAdvances, riskThreshold]);
  const visibleLowProgress = useMemo(() => lowProgress
    .filter((row) => `${row.student.firstName} ${row.student.lastName} ${row.course?.name || ''} ${row.subject.name}`.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 50), [lowProgress, search]);
  const unregisteredCount = lowProgress.filter((row) => row.progress === null).length;
  const urgentCount = lowProgress.filter((row) => row.progress !== null && row.progress <= 30).length;
  const studentsNeedingSupport = new Set(lowProgress.map((row) => row.student.id)).size;

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
          <select
            aria-label="Filtrar por grado"
            value={grade}
            onChange={(event) => { setGrade(event.target.value); setCourseId(''); setSubjectId(''); }}
            className="min-w-[145px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todos los grados</option>
            {gradeOptions.map((item) => <option key={item} value={item}>{item}°</option>)}
          </select>
          <select
            aria-label="Filtrar por curso"
            value={courseId}
            onChange={(event) => { setCourseId(event.target.value); setSubjectId(''); }}
            className="min-w-[150px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todos los cursos</option>
            {courseOptions.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}
          </select>
          <select
            aria-label="Filtrar por materia"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            className="min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todas las materias</option>
            {subjectOptions.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
          </select>
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
            <div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead><tr><th className="px-2 py-3 text-slate-500">Curso</th>{subjectNames.map(([id, name]) => <th key={id} className="min-w-[120px] px-2 py-3 text-center text-slate-500">{name}</th>)}</tr></thead><tbody>{heatmap.map((row) => <tr key={row.course} className="border-t border-slate-100"><td className="px-2 py-3 font-medium">{row.course}</td>{row.values.map((value, index) => {
              const color = value === null
                ? 'bg-slate-50 text-slate-400'
                : value < 30
                  ? 'bg-red-100 text-red-700'
                  : value < 60
                    ? 'bg-orange-100 text-orange-700'
                    : value < 80
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-green-100 text-green-700';
              return <td key={`${row.course}-${index}`} className={`m-1 rounded px-2 py-3 text-center transition-colors duration-300 ${color}`}>{value === null ? '—' : `${value}%`}</td>;
            })}</tr>)}</tbody></table></div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-500">
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-red-200" />0–29% · prioridad alta</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-orange-200" />30–59% · requiere refuerzo</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-blue-100" />60–79% · en progreso</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-green-200" />80–100% · esperado</span>
            </div>
          </section>
          <ChartCard title="Registro de avances" subtitle="Estudiantes con y sin avances registrados">
            <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>{pieData.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? BLUE : '#cbd5e1'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
            <div className="text-center text-sm text-slate-500">{studentsWithAdvance} con avance · {studentsWithoutAdvance} sin avance</div>
          </ChartCard>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <h3 className="text-lg font-semibold">Matriz de seguimiento e intervención</h3>
              <p className="text-xs text-slate-500">Prioriza registros pendientes y avances menores al {riskThreshold}%.</p>
            </div>
            <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">{studentsNeedingSupport} estudiantes · {lowProgress.length} seguimientos</span>
          </div>
          <div className="grid gap-px border-b border-slate-200 bg-slate-200 sm:grid-cols-3">
            <div className="bg-white px-5 py-4"><p className="text-xs text-slate-500">Pendientes de registro</p><p className="mt-1 text-xl font-semibold text-slate-700">{unregisteredCount}</p></div>
            <div className="bg-white px-5 py-4"><p className="text-xs text-slate-500">Prioridad urgente · hasta 30%</p><p className="mt-1 flex items-center gap-1 text-xl font-semibold text-red-600"><AlertTriangle className="h-4 w-4" />{urgentCount}</p></div>
            <div className="bg-white px-5 py-4"><p className="text-xs text-slate-500">Por debajo de la meta</p><p className="mt-1 text-xl font-semibold text-orange-600">{lowProgress.length - unregisteredCount - urgentCount}</p></div>
          </div>
          <div className="border-b border-slate-200 p-4">
            <div className="relative max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar estudiante, curso o materia..." className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1000px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Prioridad</th><th className="px-5 py-3">Estudiante</th><th className="px-5 py-3">Curso / materia</th><th className="px-5 py-3">Avance actual</th><th className="px-5 py-3">Brecha a meta</th><th className="px-5 py-3">Acción sugerida</th></tr></thead>
              <tbody>
                {visibleLowProgress.map((row) => {
                  const missing = row.progress === null;
                  const urgent = !missing && row.progress <= 30;
                  const priority = missing ? 'Sin registro' : urgent ? 'Urgente' : 'Refuerzo';
                  const priorityClass = missing
                    ? 'bg-slate-100 text-slate-700'
                    : urgent
                      ? 'bg-red-100 text-red-700'
                      : 'bg-orange-100 text-orange-700';
                  const action = missing
                    ? 'Confirmar el registro con el docente.'
                    : urgent
                      ? 'Agendar revisión individual y acordar refuerzo inmediato.'
                      : 'Definir una meta de corto plazo y revisar el próximo avance.';
                  const gap = missing ? null : Math.max(0, riskThreshold - row.progress);

                  return (
                    <tr key={`${row.student.id}-${row.subject.id}`} className="border-t border-slate-100 align-top">
                      <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass}`}>{priority}</span></td>
                      <td className="px-5 py-4 font-medium">{row.student.firstName} {row.student.lastName}</td>
                      <td className="px-5 py-4"><span className="block font-medium text-slate-700">{row.course?.name || '—'}</span><span className="text-xs text-slate-500">{row.subject.name}</span></td>
                      <td className="px-5 py-4">
                        {missing ? <span className="text-xs text-slate-500">Sin avance registrado</span> : (
                          <div className="w-32">
                            <div className="mb-1 flex justify-between text-xs"><span className={urgent ? 'font-semibold text-red-600' : 'font-semibold text-orange-600'}>{row.progress}%</span><span className="text-slate-400">meta {riskThreshold}%</span></div>
                            <div className="h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${urgent ? 'bg-red-500' : 'bg-orange-400'}`} style={{ width: `${Math.max(0, Math.min(100, row.progress))}%` }} /></div>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">{gap === null ? '—' : `${gap} puntos`}</td>
                      <td className="max-w-xs px-5 py-4 text-xs text-slate-600"><p>{action}</p>{row.comment && <p className="mt-1 border-l-2 border-slate-200 pl-2 text-slate-400">Nota: {row.comment}</p>}</td>
                    </tr>
                  );
                })}
                {visibleLowProgress.length === 0 && <tr><td colSpan="6" className="px-5 py-10 text-center text-sm text-slate-500">{lowProgress.length === 0 ? 'No hay seguimientos pendientes con estos filtros.' : 'No hay coincidencias para la búsqueda.'}</td></tr>}
              </tbody>
            </table>
          </div>
          {lowProgress.length > visibleLowProgress.length && <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Mostrando {visibleLowProgress.length} de {lowProgress.length} seguimientos. Usa los filtros para acotar la lista.</p>}
        </section>
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children }) => (
  <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-semibold">{title}</h3><p className="mb-3 text-xs text-slate-500">{subtitle}</p>{children}</section>
);

export default AnalysisModule;
