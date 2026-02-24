/**
 * SERMA - Módulo de Materias
 * Gestión completa de materias: crear, listar, editar, eliminar, buscar
 */

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../components/Modal';
import { DataTable } from '../components/DataTable';
import Alert from '../components/Alert';
import { TextInput, SelectInput, Button, SearchInput, TextArea } from '../components/FormInputs';
import {
  createSubject,
  getAllSubjects,
  updateSubject,
  deleteSubject,
} from '../services/subjectService';
import { getAllCourses } from '../services/courseService';
import { getAllTeachers, updateTeacher } from '../services/teacherService';

/**
 * SubjectForm - Formulario para crear/editar materia
 */
const SubjectForm = ({ subject, courses, teachers = [], onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState(
    subject || {
      name: '',
      courseId: '',
      teacherId: '',
      description: '',
    }
  );

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const courseOptions = courses.map((c) => ({
    value: c.id,
    label: `${c.name} (Grado ${c.grade})`,
  }));

  const teacherOptions = teachers.map((t) => ({
    value: t.id,
    label: `${t.firstName} ${t.lastName}`,
  }));

  return (
    <form onSubmit={handleSubmit}>
      <TextInput
        label="Nombre de la materia"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        placeholder="Ej: Matemáticas"
        required
      />

      <SelectInput
        label="Curso"
        name="courseId"
        value={formData.courseId}
        onChange={handleChange}
        error={errors.courseId}
        options={courseOptions}
        required
      />

      <SelectInput
        label="Docente asignado"
        name="teacherId"
        value={formData.teacherId}
        onChange={handleChange}
        error={errors.teacher}
        options={[{ value: '', label: 'Seleccione un docente' }, ...teacherOptions]}
        required
      />

      <TextArea
        label="Descripción (opcional)"
        name="description"
        value={formData.description || ''}
        onChange={handleChange}
        placeholder="Descripción de la materia..."
        rows="3"
      />

      {/* Botones */}
      <div className="flex gap-3 mt-6">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          {subject ? 'Actualizar' : 'Crear'} Materia
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};

/**
 * SubjectsModule - Módulo de gestión de materias
 */
export const SubjectsModule = ({ currentProfile }) => {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [alert, setAlert] = useState(null);

  // Cargar materias y cursos
  useEffect(() => {
    loadData();
  }, []);

  // Filtrar materias
  useEffect(() => {
    let filtered = subjects.filter((subject) =>
      `${subject.name} ${subject.teacher} ${subject.description || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    if (filterCourse) {
      filtered = filtered.filter((subject) => subject.courseId === filterCourse);
    }

    setFilteredSubjects(filtered);
  }, [subjects, searchTerm, filterCourse]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjectsData, coursesData, teachersData] = await Promise.all([
        getAllSubjects(),
        getAllCourses(),
        getAllTeachers(),
      ]);
      // Normalize subjects: if subject has no teacherId but has teacher name, try to resolve it
      const teacherMapByName = (teachersData || []).reduce((acc, t) => {
        acc[`${t.firstName} ${t.lastName}`] = t.id;
        return acc;
      }, {});

      const normalizedSubjects = (subjectsData || []).map((s) => {
        if (!s.teacherId && s.teacher) {
          const tid = teacherMapByName[s.teacher];
          if (tid) return { ...s, teacherId: tid };
        }
        return s;
      });

      setSubjects(normalizedSubjects);
      setCourses(coursesData);
      setTeachers(teachersData || []);
    } catch (error) {
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los datos',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedSubject(null);
    setShowModal(true);
  };

  const handleEdit = (subject) => {
    // Solo el Rector puede editar materias
    if (currentProfile && currentProfile.role !== 'rector') {
      setAlert({ type: 'error', title: 'Acceso denegado', message: 'Solo el Rector puede editar materias.' });
      return;
    }
    setSelectedSubject(subject);
    setShowModal(true);
  };

  const handleDelete = async (subject) => {
    // Solo el Rector puede eliminar materias
    if (currentProfile && currentProfile.role !== 'rector') {
      setAlert({ type: 'error', title: 'Acceso denegado', message: 'Solo el Rector puede eliminar materias.' });
      return;
    }

    if (window.confirm(`¿Eliminar la materia ${subject.name}?`)) {
      try {
        setLoading(true);
        await deleteSubject(subject.id);
        setAlert({
          type: 'success',
          title: 'Éxito',
          message: 'Materia eliminada correctamente',
        });
        await loadData();
        try {
          window.dispatchEvent(new Event('serma:data-changed'));
        } catch (e) {}
      } catch (error) {
        setAlert({
          type: 'error',
          title: 'Error',
          message: error.message || 'Error al eliminar',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      if (selectedSubject) {
        // ensure we send teacherId and teacher (name) for backward compatibility
        const teacherObj = teachers.find((t) => t.id === formData.teacherId);
        const payload = { ...formData, teacher: teacherObj ? `${teacherObj.firstName} ${teacherObj.lastName}` : formData.teacher };
        await updateSubject(selectedSubject.id, payload);
        // Si el docente cambió, actualizar asignaciones en docentes (usar IDs)
        try {
          const teachersList = await getAllTeachers();
          const oldTid = selectedSubject.teacherId || teachersList.find((t) => `${t.firstName} ${t.lastName}` === selectedSubject.teacher)?.id;
          const newTid = formData.teacherId;

          if (oldTid !== newTid) {
            // Quitar materia (por id) del docente antiguo
            if (oldTid) {
              const oldT = teachersList.find((t) => t.id === oldTid);
              if (oldT) {
                const updated = (oldT.subjects || []).filter((s) => s !== selectedSubject.id);
                await updateTeacher(oldT.id, { subjects: updated });
              }
            }

            // Añadir materia (por id) al nuevo docente
            if (newTid) {
              const newT = teachersList.find((t) => t.id === newTid);
              if (newT) {
                const updated2 = Array.from(new Set([...(newT.subjects || []), selectedSubject.id]));
                await updateTeacher(newT.id, { subjects: updated2 });
              }
            }
          }
        } catch (err) {
          console.warn('No se pudo actualizar asignaciones de docentes:', err);
        }
        setAlert({
          type: 'success',
          title: 'Éxito',
          message: 'Materia actualizada correctamente',
        });
      } else {
        // create subject with teacherId + teacher name for compatibility
        const teacherObj = teachers.find((t) => t.id === formData.teacherId);
        const payload = { ...formData, teacher: teacherObj ? `${teacherObj.firstName} ${teacherObj.lastName}` : formData.teacher };
        const created = await createSubject(payload);
        // Vincular la materia al docente indicado (si existe) usando subject id
        try {
          const teachersList = await getAllTeachers();
          const t = teachersList.find((x) => x.id === formData.teacherId);
          if (t) {
            const updated = Array.from(new Set([...(t.subjects || []), created.id]));
            await updateTeacher(t.id, { subjects: updated });
          }
        } catch (err) {
          console.warn('No se pudo asignar materia al docente:', err);
        }
        setAlert({
          type: 'success',
          title: 'Éxito',
          message: 'Materia creada correctamente',
        });
      }
      setShowModal(false);
      await loadData();
      try {
        window.dispatchEvent(new Event('serma:data-changed'));
      } catch (e) {
        // ignore
      }
    } catch (error) {
      setAlert({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al guardar',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCourseName = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : '-';
  };

  const columns = [
    {
      label: 'Materia',
      key: 'name',
    },
    {
      label: 'Curso',
      key: 'courseId',
      render: (courseId) => getCourseName(courseId),
    },
    {
      label: 'Docente',
      key: 'teacher',
      render: (val, row) => {
        if (row.teacherId) {
          const t = teachers.find((x) => x.id === row.teacherId);
          if (t) return `${t.firstName} ${t.lastName}`;
        }
        return row.teacher || '-';
      },
    },
    {
      label: 'Descripción',
      key: 'description',
      render: (desc) => desc ? desc.substring(0, 40) + '...' : '-',
    },
  ];

  const courseOptions = [
    { value: '', label: 'Todos los cursos' },
    ...courses.map((c) => ({
      value: c.id,
      label: `${c.name} (Grado ${c.grade})`,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
          duration={4000}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Materias</h2>
          <p className="text-gray-600 text-sm mt-1">
            Total: {filteredSubjects.length} materia(s)
          </p>
        </div>
        {/* Solo Rector puede crear materias */}
        {(!currentProfile || currentProfile.role === 'rector') && (
          <Button
            onClick={handleCreate}
            variant="primary"
          >
            <Plus className="w-4 h-4" />
            Nueva Materia
          </Button>
        )}
      </div>

      {/* Búsqueda y Filtros */}
      <div className="flex gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Buscar por nombre, docente o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            loading={loading}
          />
        </div>
        <div className="w-48">
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {courseOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={filteredSubjects}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        title={selectedSubject ? 'Editar Materia' : 'Nueva Materia'}
        onClose={() => setShowModal(false)}
        size="lg"
        footer={null}
      >
        <SubjectForm
          subject={selectedSubject}
          courses={courses}
          teachers={teachers}
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default SubjectsModule;
