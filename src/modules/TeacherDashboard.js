import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Filter, GraduationCap, LayoutGrid, Search, Users } from 'lucide-react';
import { getAllTeachers } from '../services/teacherService';
import { getAllSubjects } from '../services/subjectService';
import { getAllStudents } from '../services/studentService';
import { getAllCourses } from '../services/courseService';
import { createAdvance, getLatestAdvanceForStudentSubject, updateAdvance } from '../services/avanceService';
import TeacherProgressPanel from '../components/TeacherProgressPanel';

const TeacherDashboard = ({ initialTeacherId = null, currentProfile = null }) => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [progressValues, setProgressValues] = useState({});
  const [attendanceValues, setAttendanceValues] = useState({});
  const [commentValues, setCommentValues] = useState({});
  const [savingKey, setSavingKey] = useState(null);
  const [progressSaveStatus, setProgressSaveStatus] = useState({});
  const [progressLoadError, setProgressLoadError] = useState('');
  const [progressLoadAttempt, setProgressLoadAttempt] = useState(0);
  const loadedProgressKey = useRef('');
  const skipProgressBlurKey = useRef(null);

  // load data (exposed so we can call it from event listener)
  const loadData = async () => {
    try {
      const [t, s, st, c] = await Promise.all([getAllTeachers(), getAllSubjects(), getAllStudents(), getAllCourses()]);
      // MySQL teachers do not expose the legacy createdBy field.
      setTeachers((t || []).filter((x) => !x.createdBy || x.createdBy === 'rector'));
      setSubjects(s || []);
      setStudents(st || []);
      setCourses(c || []);
      // keep selectedTeacher reference in sync with reloaded teachers
      setSelectedTeacher((prev) => {
        if (!prev) return prev;
        return (t || []).find((x) => x.id === prev.id) || null;
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();

    // reload when other modules signal data changes
    const handler = () => {
      loadData();
    };
    window.addEventListener('serma:data-changed', handler);
    return () => window.removeEventListener('serma:data-changed', handler);
  }, []);

  useEffect(() => {
    // If a teacher profile is active, attempt to auto-select that teacher
    if (currentProfile && currentProfile.role === 'teacher') {
      const idToSelect = initialTeacherId || currentProfile.teacherId || null;
      if (idToSelect && teachers.length > 0) {
        const t = teachers.find((x) => x.id === idToSelect);
        if (t) {
          setSelectedTeacher(t);
          return;
        }
      }
    }

    // If there's exactly one teacher in the system, auto-select them to improve UX
    if (!selectedTeacher && teachers.length === 1) {
      setSelectedTeacher(teachers[0]);
    }
  }, [initialTeacherId, teachers, currentProfile, selectedTeacher]);

  const activeTeacher = selectedTeacher || (currentProfile?.role === 'teacher' ? {
    id: initialTeacherId || currentProfile.teacherId,
    firstName: currentProfile.name || '',
    lastName: '',
  } : null);

  // derive assigned subjects for the selected teacher
  const teacherSubjects = (() => {
    if (!activeTeacher) return [];
    if (currentProfile?.role === 'teacher') return subjects;
    const fullName = `${activeTeacher.firstName || ''} ${activeTeacher.lastName || ''}`.trim();

    // Prefer authoritative list stored on teacher document
    let list = [];
    if (Array.isArray(selectedTeacher.subjects) && selectedTeacher.subjects.length > 0) {
      // Map each subject name to subjects that match that name.
      // Prefer subjects that also list this teacher in their `teacher` field to avoid picking the same-named subject from another grade.
      const found = [];
      selectedTeacher.subjects.forEach((entry) => {
        // entry can be a subjectId or a subject name (legacy)
        const byId = subjects.find((s) => s.id === entry);
        if (byId) {
          found.push(byId);
          return;
        }

        // treat as name fallback
        const name = String(entry || '').trim();
        const fullMatches = subjects.filter(
          (s) =>
            s.name === name &&
            (s.teacher === fullName || s.teacherId === activeTeacher.id)
        );
        if (fullMatches.length > 0) {
          fullMatches.forEach((m) => found.push(m));
          return;
        }

        // If no exact doc matches this teacher, keep a placeholder to avoid leaking
        // same-name subjects assigned to other teachers.
        found.push({ id: name, name, courseId: null, teacher: fullName });
      });
      // dedupe by id or name
      const seen = new Set();
      list = found.filter((x) => {
        const key = x.id || x.name;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } else {
      // Fallback: find subjects that have the teacher name in the subject document
      list = subjects.filter(
        (s) => s.teacher === fullName || s.teacherId === activeTeacher.id
      );
    }

    return list;
  })();

  const teacherCourseIds = Array.from(
    new Set(teacherSubjects.map((s) => s.courseId).filter(Boolean))
  );

  const teacherCourses = courses.filter((c) => teacherCourseIds.includes(c.id));

  const assignedSubjects = (() => {
    // If a student is selected, only show subjects that belong to the same course/grade
    if (selectedStudent) {
      const studentCourseId = selectedStudent.courseId || null;
      const studentGrade = selectedStudent.grade || selectedStudent.course || null;

      return teacherSubjects.filter((s) => {
        // If subject has a courseId and student has courseId, match directly
        if (s.courseId && studentCourseId) return s.courseId === studentCourseId;

        // Otherwise, try to match by course grade
        if (s.courseId) {
          const course = courses.find((c) => c.id === s.courseId);
          if (course && studentGrade) return String(course.grade) === String(studentGrade);
        }

        // If we can't determine, exclude (safer) so teacher only sees relevant subjects
        return false;
      });
    }

    // If no student selected but a courseFilter is active, show subjects for that course
    if (courseFilter) {
      return teacherSubjects.filter((s) => s.courseId === courseFilter);
    }

    return teacherSubjects;
  })();

  const subjectColumns = (() => {
    const subjectsForTable = courseFilter
      ? teacherSubjects.filter((subject) => subject.courseId === courseFilter)
      : teacherSubjects;
    const columns = new Map();
    subjectsForTable.forEach((subject) => {
      if (!subject.courseId || !subject.name) return;
      const key = subject.name.trim().toLocaleLowerCase();
      if (!columns.has(key)) columns.set(key, { key, name: subject.name });
    });
    return Array.from(columns.values());
  })();

  const getSubjectForStudent = (student, column) => teacherSubjects.find(
    (subject) =>
      subject.courseId === student.courseId &&
      subject.name.trim().toLocaleLowerCase() === column.key
  );

  useEffect(() => {
    if (courseFilter && !teacherCourseIds.includes(courseFilter)) {
      setCourseFilter('');
    }
  }, [courseFilter, teacherCourseIds]);

  const filteredStudents = students.filter((s) => {
    const fullname = `${s.firstName} ${s.lastName}`.toLowerCase();
    const term = studentSearch.toLowerCase();
    const matchesSearch = fullname.includes(term) || (s.documentId && s.documentId.includes(term));
    const matchesTeacherCourses = teacherCourseIds.length === 0 || teacherCourseIds.includes(s.courseId);
    const matchesCourse = !courseFilter || s.courseId === courseFilter;
    return matchesSearch && matchesTeacherCourses && matchesCourse;
  });
  const progressLoadKey = `${filteredStudents.map((student) => student.id).join(',')}|${teacherSubjects.map((subject) => subject.id).join(',')}`;

  useEffect(() => {
    if (filteredStudents.length === 0) {
      setSelectedStudent(null);
      setEditingSubject(null);
      return;
    }

    const selectedStillVisible = selectedStudent && filteredStudents.some((student) => student.id === selectedStudent.id);
    if (!selectedStillVisible) {
      setSelectedStudent(filteredStudents[0]);
      setEditingSubject(null);
    }
  }, [filteredStudents, selectedStudent]);

  useEffect(() => {
    let cancelled = false;
    if (!filteredStudents.length || !teacherSubjects.length) {
      loadedProgressKey.current = '';
      setProgressValues({});
      setAttendanceValues({});
      setProgressLoadError('');
      return () => { cancelled = true; };
    }
    if (loadedProgressKey.current === progressLoadKey) return () => { cancelled = true; };

    setProgressLoadError('');
    const loadProgress = async () => {
      const pairs = await Promise.all(filteredStudents.flatMap((student) => teacherSubjects
        .filter((subject) => subject.courseId === student.courseId)
        .map(async (subject) => {
          try {
            const advance = await getLatestAdvanceForStudentSubject(student.id, subject.id);
            return [`${student.id}-${subject.id}`, {
              id: advance?.id || null,
              progress: advance?.progress ?? advance?.average ?? null,
              attendance: advance?.attendance === null || advance?.attendance === undefined ? '' : Boolean(advance.attendance) ? 'Sí' : 'No',
              comment: advance?.comments || advance?.comment || '',
            }];
          } catch (error) {
            console.warn('No se pudo cargar el avance de la planilla:', error);
            return [`${student.id}-${subject.id}`, null, error];
          }
        })));
      if (!cancelled) {
        const values = Object.fromEntries(pairs);
        setProgressValues(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value?.progress ?? null])));
        setAttendanceValues(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value?.attendance ?? ''])));
        setCommentValues((current) => Object.fromEntries(filteredStudents.map((student) => {
          const firstSubject = teacherSubjects.find((subject) => subject.courseId === student.courseId);
          return [student.id, current[student.id] ?? (firstSubject ? values[`${student.id}-${firstSubject.id}`]?.comment || '' : '')];
        })));
        const failedPair = pairs.find(([, value]) => value === null);
        if (failedPair) {
          setProgressLoadError(failedPair[2]?.message || 'No se pudieron cargar algunos avances.');
        } else {
          loadedProgressKey.current = progressLoadKey;
        }
      }
    };
    loadProgress().catch((error) => {
      console.error('No se pudieron cargar los avances:', error);
      if (!cancelled) setProgressLoadError(error.message || 'No se pudieron cargar los avances.');
    });
    return () => { cancelled = true; };
  }, [progressLoadKey, progressLoadAttempt]);

  const saveProgress = async (student, subject, value) => {
    const key = `${student.id}-${subject.id}`;
    const progress = Math.max(0, Math.min(100, Number(value)));
    setSavingKey(key);
    setProgressSaveStatus((current) => ({ ...current, [key]: null }));
    try {
      const last = await getLatestAdvanceForStudentSubject(student.id, subject.id);
      const attendance = attendanceValues[key];
      const payload = { studentId: student.id, subjectId: subject.id, teacherId: activeTeacher?.id || null, progress, attendance: attendance === '' ? null : attendance === 'Sí', comments: last?.comments || last?.comment || '' };
      if (last?.id) await updateAdvance(last.id, payload);
      else await createAdvance(payload);
      setProgressValues((current) => ({ ...current, [key]: progress }));
      setProgressSaveStatus((current) => ({ ...current, [key]: 'Avance guardado' }));
      window.dispatchEvent(new Event('serma:advances-changed'));
    } catch (error) {
      console.error('No se pudo guardar el avance:', error);
      setProgressSaveStatus((current) => ({ ...current, [key]: error.message || 'No se pudo guardar el avance' }));
    } finally {
      setSavingKey(null);
    }
  };

  const saveAttendance = async (student, subject, value) => {
    const key = `${student.id}-${subject.id}`;
    setAttendanceValues((current) => ({ ...current, [key]: value }));
    try {
      const last = await getLatestAdvanceForStudentSubject(student.id, subject.id);
      const progress = last?.progress ?? last?.average ?? 0;
      const payload = { studentId: student.id, subjectId: subject.id, teacherId: activeTeacher?.id || null, progress, attendance: value === '' ? null : value === 'Sí', comments: last?.comments || last?.comment || '' };
      if (last?.id) await updateAdvance(last.id, payload);
      else await createAdvance(payload);
    } catch (error) {
      console.error('No se pudo guardar la asistencia:', error);
    }
  };

  const saveComment = async (student) => {
    const subjectsForStudent = teacherSubjects.filter((subject) => subject.courseId === student.courseId);
    const comment = commentValues[student.id] || '';
    setSavingKey(`comment-${student.id}`);
    try {
      await Promise.all(subjectsForStudent.map(async (subject) => {
        const last = await getLatestAdvanceForStudentSubject(student.id, subject.id);
        const key = `${student.id}-${subject.id}`;
        const attendance = attendanceValues[key];
        const payload = { studentId: student.id, subjectId: subject.id, teacherId: activeTeacher?.id || null, progress: last?.progress ?? last?.average ?? 0, attendance: attendance === '' || attendance === undefined ? null : attendance === 'Sí', comments: comment.trim() };
        if (last?.id) await updateAdvance(last.id, payload);
        else await createAdvance(payload);
      }));
    } catch (error) {
      console.error('No se pudo guardar el comentario:', error);
    } finally {
      setSavingKey(null);
    }
  };

  const courseFilterOptions = useMemo(
    () => [
      { value: '', label: 'Todos los cursos' },
      ...teacherCourses.map((c) => ({
        value: c.id,
        label: `${c.name || 'Curso'}${c.grade ? ` - Grado ${c.grade}` : ''}`,
      })),
    ],
    [teacherCourses]
  );

  const exportPlan = () => {
    const escapeHtml = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const headers = ['Cédula', 'Estudiante', ...subjectColumns.map((column) => column.name), 'Comentarios'];
    const rows = filteredStudents.map((student) => [
      student.documentId || '',
      `${student.firstName || ''} ${student.lastName || ''}`.trim(),
      ...subjectColumns.map((column) => {
        const subject = getSubjectForStudent(student, column);
        return subject ? progressValues[`${student.id}-${subject.id}`] ?? 'Sin registro' : '—';
      }),
      commentValues[student.id] || '',
    ]);
    const tableRows = [headers, ...rows].map((row, rowIndex) => {
      const cells = row.map((value) => `<td>${escapeHtml(value)}</td>`).join('');
      return rowIndex === 0 ? `<tr class="header">${cells}</tr>` : `<tr>${cells}</tr>`;
    }).join('');
    const excelDocument = `<!DOCTYPE html>
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"><style>
          table { border-collapse: collapse; }
          th, td { border: 1px solid #d9e2f3; padding: 8px; }
          .header { background: #2563eb; color: #ffffff; font-weight: bold; }
        </style></head>
        <body><table>${tableRows}</table></body>
      </html>`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\uFEFF${excelDocument}`], { type: 'application/vnd.ms-excel;charset=utf-8;' }));
    link.download = 'planilla-avances.xls';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 100);
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5] px-4 py-6 text-slate-800 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-blue-700">Tu espacio de trabajo</p>
            <h2 className="text-3xl font-bold tracking-tight">Panel docente <span className="text-blue-600">•</span></h2>
            <p className="mt-2 text-sm text-slate-500">Todos tus estudiantes, avances y comentarios en una sola planilla.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-600" /> Año académico 2025 <span className="mx-3 text-slate-300">|</span> Periodo 2
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
          <div className="flex items-center gap-4 border-slate-100 sm:border-r">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-700"><Users className="h-5 w-5" /></div>
            <div><p className="text-xs text-slate-500">Estudiantes del curso</p><p className="text-2xl font-bold">{filteredStudents.length}</p><p className="text-xs text-slate-400">estudiantes visibles</p></div>
          </div>
          <div className="flex items-center gap-4 sm:pl-4">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-700"><GraduationCap className="h-5 w-5" /></div>
            <div><p className="text-xs text-slate-500">Materias asignadas</p><p className="text-2xl font-bold">{assignedSubjects.length}</p><p className="text-xs text-slate-400">en este curso</p></div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-700"><LayoutGrid className="h-5 w-5" /></div>
              <div><h3 className="font-semibold">Planilla de avances</h3><p className="text-xs text-slate-500">{activeTeacher ? `${activeTeacher.firstName || ''} ${activeTeacher.lastName || ''}`.trim() : 'Docente'} · {filteredStudents.length} estudiantes</p></div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={exportPlan} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"><Download className="h-4 w-4" /> Exportar</button>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-4 md:flex-row">
            <select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setSelectedStudent(null); setEditingSubject(null); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500">
              {courseFilterOptions.map((option) => <option key={`course-opt-${option.value || 'all'}`} value={option.value}>{option.label}</option>)}
            </select>
            <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input placeholder="Buscar estudiante o cédula..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></div>
            <button type="button" className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"><Filter className="h-4 w-4" /> Filtros</button>
          </div>

          {progressLoadError && (
            <div role="alert" className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
              <span>No se pudieron cargar todos los avances: {progressLoadError}</span>
              <button type="button" onClick={() => setProgressLoadAttempt((attempt) => attempt + 1)} className="shrink-0 font-medium underline">
                Reintentar
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-base">
              <thead className="bg-slate-50 text-sm uppercase tracking-wide text-slate-500"><tr><th className="w-36 px-6 py-5">Cédula</th><th className="min-w-[260px] px-5 py-5">Estudiante</th>{subjectColumns.map((column) => <th key={column.key} className="min-w-[180px] px-5 py-5">{column.name}<span className="mt-1 block text-xs font-normal normal-case">Avance académico</span></th>)}<th className="min-w-[240px] px-5 py-5">Comentarios</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, index) => <tr key={student.id} className={`hover:bg-blue-50/40 ${selectedStudent?.id === student.id ? 'bg-blue-50/30' : ''}`}>
                  <td className="px-6 py-5 text-sm text-slate-500">{student.documentId || '—'}</td>
                  <td className="px-5 py-5"><button type="button" onClick={() => setSelectedStudent(student)} className="flex items-center gap-3 text-left font-medium text-slate-700 hover:text-blue-700"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">{`${student.firstName || ''} ${student.lastName || ''}`.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>{student.firstName} {student.lastName}</button></td>
                  {subjectColumns.map((column) => {
                    const subject = getSubjectForStudent(student, column);
                    if (!subject) return <td key={`${student.id}-${column.key}`} className="px-5 py-4 text-xs text-slate-400" title="Esta materia pertenece a otro curso">No aplica</td>;
                    const progress = progressValues[`${student.id}-${subject.id}`];
                    const barColor = progress === null || progress === undefined ? 'bg-slate-300' : progress >= 80 ? 'bg-blue-600' : progress >= 60 ? 'bg-amber-400' : 'bg-orange-400';
                    const key = `${student.id}-${subject.id}`;
                    return <td key={key} className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" max="100" value={progress ?? ''} placeholder="0" data-progress-column={column.key} onChange={(event) => {
                          setProgressValues((current) => ({ ...current, [key]: event.target.value }));
                          setProgressSaveStatus((current) => ({ ...current, [key]: null }));
                        }} onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            saveProgress(student, subject, event.currentTarget.value);
                            const columnInputs = Array.from(event.currentTarget.closest('tbody')?.querySelectorAll('[data-progress-column]') || [])
                              .filter((input) => input.dataset.progressColumn === column.key);
                            const currentIndex = columnInputs.indexOf(event.currentTarget);
                            const nextInput = columnInputs[currentIndex + 1];
                            if (nextInput) {
                              skipProgressBlurKey.current = key;
                              nextInput.focus();
                            }
                          }
                        }} onBlur={(event) => {
                          if (skipProgressBlurKey.current === key) {
                            skipProgressBlurKey.current = null;
                            return;
                          }
                          saveProgress(student, subject, event.target.value);
                        }} className="w-20 rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500" aria-label={`Avance de ${subject.name}`} />
                        <span className="text-xs">%</span>
                      </div>
                      <label className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">¿Faltó?
                        <select value={attendanceValues[key] ?? ''} onChange={(event) => saveAttendance(student, subject, event.target.value)} className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px] outline-none focus:border-blue-500" aria-label={`Falta de ${subject.name}`}>
                          <option value="">—</option><option value="Sí">Sí</option><option value="No">No</option>
                        </select>
                      </label>
                      <span className="mt-2 block h-2 w-32 rounded-full bg-slate-100"><span className={`block h-2 rounded-full ${barColor}`} style={{ width: `${progress || 0}%` }} /></span>
                      {savingKey === key && <span className="text-[10px] text-blue-600">Guardando...</span>}
                      {savingKey !== key && progressSaveStatus[key] && <span className={`block text-[10px] ${progressSaveStatus[key] === 'Avance guardado' ? 'text-green-600' : 'text-red-600'}`}>{progressSaveStatus[key]}</span>}
                    </td>;
                  })}
                  <td className="px-5 py-4">
                    <textarea value={commentValues[student.id] || ''} onChange={(event) => setCommentValues((current) => ({ ...current, [student.id]: event.target.value }))} onBlur={() => saveComment(student)} placeholder="Agregar comentario..." maxLength={500} className="min-h-10 w-56 rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" aria-label={`Comentario de ${student.firstName} ${student.lastName}`} />
                    {savingKey === `comment-${student.id}` && <span className="block text-[10px] text-blue-600">Guardando...</span>}
                  </td>
                </tr>)}
              </tbody>
            </table>
            {filteredStudents.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No hay estudiantes que coincidan con la búsqueda.</p>}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {editingSubject && selectedStudent ? <TeacherProgressPanel key={`progress-${selectedStudent?.id || 'none'}-${editingSubject?.id || editingSubject?.name || 'none'}`} student={selectedStudent} subject={subjects.find((s) => s.id === (editingSubject.id || editingSubject.name)) || editingSubject} teacher={activeTeacher} onSaved={() => { setEditingSubject(null); loadData(); }} onCancel={() => setEditingSubject(null)} /> : <div className="py-4 text-center text-sm text-slate-500">Selecciona una materia en la planilla para modificar el avance.</div>}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
