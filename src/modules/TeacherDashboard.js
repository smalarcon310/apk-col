import React, { useEffect, useState } from 'react';
import { getAllTeachers } from '../services/teacherService';
import { getAllSubjects } from '../services/subjectService';
import { getAllStudents } from '../services/studentService';
import { getAllCourses } from '../services/courseService';
import CourseCard from '../components/CourseCard';
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
  const [courseFilter] = useState(null);

  // load data (exposed so we can call it from event listener)
  const loadData = async () => {
    try {
      const [t, s, st, c] = await Promise.all([getAllTeachers(), getAllSubjects(), getAllStudents(), getAllCourses()]);
      // only keep teachers created by the rector (others shouldn't have a panel)
      setTeachers((t || []).filter((x) => x.createdBy === 'rector'));
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

  // derive assigned subjects for the selected teacher
  const assignedSubjects = (() => {
    if (!selectedTeacher) return [];
    const fullName = `${selectedTeacher.firstName} ${selectedTeacher.lastName}`;

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
        const fullMatches = subjects.filter((s) => s.name === name && s.teacher === fullName);
        if (fullMatches.length > 0) {
          fullMatches.forEach((m) => found.push(m));
          return;
        }

        // Fallback: any subject with the same name (may exist in other grades)
        const matches = subjects.filter((s) => s.name === name);
        if (matches.length > 0) {
          matches.forEach((m) => found.push(m));
        } else {
          // if no matching subject doc, keep a placeholder to avoid data loss
          found.push({ id: name, name, courseId: null });
        }
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
      list = subjects.filter((s) => s.teacher === fullName);
    }

    // If a student is selected, only show subjects that belong to the same course/grade
    if (selectedStudent) {
      const studentCourseId = selectedStudent.courseId || null;
      const studentGrade = selectedStudent.grade || selectedStudent.course || null;

      return list.filter((s) => {
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
      return list.filter((s) => s.courseId === courseFilter);
    }

    return list;
  })();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Panel Docente</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Left: Students list */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Mis Estudiantes</h3>
          <div className="text-sm text-gray-500 mb-3">Gestiona el avance académico</div>
          <input placeholder="Buscar estudiante o cédula..." value={studentSearch} onChange={(e) => {
              const v = e.target.value;
              setStudentSearch(v);
              // if user typed an exact cedula, auto-select student
              const match = students.find((s) => s.documentId === v);
              if (match) {
                setSelectedStudent(match);
              }
            }} className="w-full border p-2 rounded mb-3" />
          <div className="space-y-2 max-h-96 overflow-auto">
            {students.filter(s => {
              const fullname = `${s.firstName} ${s.lastName}`.toLowerCase();
              const term = studentSearch.toLowerCase();
              return fullname.includes(term) || (s.documentId && s.documentId.includes(term));
            }).map((st) => (
              <div key={st.id} onClick={() => setSelectedStudent(st)} className={`p-3 rounded border ${selectedStudent && selectedStudent.id === st.id ? 'ring-2 ring-blue-300' : ''} cursor-pointer`}> 
                <div className="font-medium">{st.firstName} {st.lastName}</div>
                <div className="text-xs text-gray-500">
                  {st.documentId ? `Cédula: ${st.documentId} • ` : ''}{st.course || st.grade || 'Grado'} - Promedio: {st.average || '--'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle: Courses Assigned */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Cursos Asignados</h3>
          <div className="text-sm text-gray-500 mb-3">Modifica el avance del estudiante</div>
          <div>
            {assignedSubjects.map((subj) => (
              <div key={subj.id || subj.name} className="mb-3">
                <CourseCard id={subj.id} name={subj.name} code={subj.courseId} teacherName={selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : subj.teacher} onSelect={() => { /* open subject for default */ }} />
                <div className="flex justify-end">
                  <button disabled={!selectedStudent} onClick={() => setEditingSubject(subj)} className={`px-4 py-2 rounded ${selectedStudent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>Modificar avance</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Editor only */}
        <div className="bg-white p-4 rounded shadow">
          {editingSubject && selectedStudent ? (
            <TeacherProgressPanel
              student={selectedStudent}
              subject={subjects.find(s => s.id === (editingSubject.id || editingSubject.name)) || editingSubject}
              teacher={selectedTeacher}
              onSaved={() => { setEditingSubject(null); /* refresh data */ loadData(); }}
              onCancel={() => setEditingSubject(null)}
            />
          ) : (
            <div className="text-sm text-gray-500">Seleccione un estudiante y haga clic en "Modificar avance" en la materia correspondiente.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
