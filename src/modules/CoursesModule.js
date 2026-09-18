/**
 * SERMA - Módulo de Cursos
 * Gestión completa de cursos: crear, listar, editar, eliminar, buscar
 */

import React, { useState, useEffect } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus } from 'lucide-react';
import { Modal } from '../components/Modal';
import { DataTable } from '../components/DataTable';
import Alert from '../components/Alert';
import { TextInput, SelectInput, Button, SearchInput } from '../components/FormInputs';
import {
  createCourse,
  getAllCourses,
  updateCourse,
  deleteCourse,
} from '../services/courseService';

/**
 * CourseForm - Formulario para crear/editar curso
 */
const CourseForm = ({ course, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState(
    course || {
      name: '',
      grade: '',
      academicYear: new Date().getFullYear(),
      description: '',
    }
  );

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'academicYear' ? parseInt(value) : value,
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

  const gradeOptions = ['6', '7', '8', '9', '10', '11'].map((g) => ({
    value: g,
    label: `Grado ${g}`,
  }));

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => ({
    value: (currentYear + i).toString(),
    label: (currentYear + i).toString(),
  }));

  return (
    <form onSubmit={handleSubmit}>
      <TextInput
        label="Nombre del curso"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        placeholder="Ej: 6-A"
        required
      />

      <div className="grid grid-cols-2 gap-4 mb-4">
        <SelectInput
          label="Grado"
          name="grade"
          value={formData.grade}
          onChange={handleChange}
          error={errors.grade}
          options={gradeOptions}
          required
        />

        <SelectInput
          label="Año académico"
          name="academicYear"
          value={formData.academicYear.toString()}
          onChange={handleChange}
          error={errors.academicYear}
          options={yearOptions}
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Descripción (opcional)
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          placeholder="Descripción del curso..."
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3 mt-6">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          {course ? 'Actualizar' : 'Crear'} Curso
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
 * CoursesModule - Módulo de gestión de cursos
 */
export const CoursesModule = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [alert, setAlert] = useState(null);

  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Cargar cursos
  useEffect(() => {
    loadCourses();
  }, []);

  // Filtrar cursos
  useEffect(() => {
    let filtered = courses.filter((course) =>
      `${course.name} ${course.description || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    if (filterGrade) {
      filtered = filtered.filter((course) => course.grade === filterGrade);
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, filterGrade]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await getAllCourses();
      setCourses(coursesData);
    } catch (error) {
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los cursos',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCourse(null);
    setShowModal(true);
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleDelete = (course) => {
    setConfirm({
      open: true,
      title: 'Confirmar eliminación',
      message: `¿Eliminar el curso ${course.name}?`,
      onConfirm: async () => {
        try {
          setLoading(true);
          await deleteCourse(course.id);
          setAlert({ type: 'success', title: 'Éxito', message: 'Curso eliminado correctamente' });
          await loadCourses();
        } catch (error) {
          setAlert({ type: 'error', title: 'Error', message: error.message || 'Error al eliminar' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      if (selectedCourse) {
        await updateCourse(selectedCourse.id, formData);
        setAlert({
          type: 'success',
          title: 'Éxito',
          message: 'Curso actualizado correctamente',
        });
      } else {
        await createCourse(formData);
        setAlert({
          type: 'success',
          title: 'Éxito',
          message: 'Curso creado correctamente',
        });
      }
      setShowModal(false);
      await loadCourses();
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

  const columns = [
    {
      label: 'Nombre',
      key: 'name',
    },
    {
      label: 'Grado',
      key: 'grade',
      render: (grade) => `Grado ${grade}`,
    },
    {
      label: 'Año académico',
      key: 'academicYear',
    },
    {
      label: 'Descripción',
      key: 'description',
      render: (desc) => desc ? desc.substring(0, 50) + '...' : '-',
    },
  ];

  const gradeOptions = ['', '6', '7', '8', '9', '10', '11'].map((g) => ({
    value: g,
    label: g ? `Grado ${g}` : 'Todos los grados',
  }));

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
          <h2 className="text-2xl font-bold text-gray-900">Cursos</h2>
          <p className="text-gray-600 text-sm mt-1">
            Total: {filteredCourses.length} curso(s)
          </p>
        </div>
        <Button
          onClick={handleCreate}
          variant="primary"
        >
          <Plus className="w-4 h-4" />
          Nuevo Curso
        </Button>
      </div>

      <ConfirmDialog
        isOpen={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={async () => { if (confirm.onConfirm) await confirm.onConfirm(); setConfirm({ open: false }); }}
        onCancel={() => setConfirm({ open: false })}
      />

      {/* Búsqueda y Filtros */}
      <div className="flex gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            loading={loading}
          />
        </div>
        <div className="w-48">
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {gradeOptions.map((option) => (
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
        data={filteredCourses}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        title={selectedCourse ? 'Editar Curso' : 'Nuevo Curso'}
        onClose={() => setShowModal(false)}
        size="md"
        footer={null}
      >
        <CourseForm
          course={selectedCourse}
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default CoursesModule;
