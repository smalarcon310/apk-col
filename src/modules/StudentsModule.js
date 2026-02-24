/**
 * SERMA - Módulo de Estudiantes
 * Gestión completa de estudiantes: crear, listar, editar, eliminar, buscar
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Modal } from '../components/Modal';
import { DataTable } from '../components/DataTable';
import Alert from '../components/Alert';
import { TextInput, SelectInput, Button, SearchInput } from '../components/FormInputs';
import {
  createStudent,
  getAllStudents,
  updateStudent,
  deleteStudent,
} from '../services/studentService';
import { getAllCourses } from '../services/courseService';
import { formatDate } from '../utils/helpers';

/**
 * StudentForm - Formulario para crear/editar estudiante
 */
const StudentForm = ({ student, courses, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState(
    student || {
      firstName: '',
      lastName: '',
      documentId: '',
      grade: '',
      email: '',
      phone: '',
      courseId: '',
    }
  );

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error del campo
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

  const courseOptions = courses.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <TextInput
          label="Nombre"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          error={errors.firstName}
          required
        />
        <TextInput
          label="Apellido"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          error={errors.lastName}
          required
        />
      </div>

      <TextInput
        label="Documento de identidad"
        name="documentId"
        value={formData.documentId}
        onChange={handleChange}
        error={errors.documentId}
        placeholder="Ej: 1234567890"
        required
      />

      <TextInput
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        placeholder="ejemplo@email.com"
        required
      />

      <TextInput
        label="Teléfono"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        error={errors.phone}
        placeholder="Ej: 3001234567"
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
          label="Curso"
          name="courseId"
          value={formData.courseId}
          onChange={handleChange}
          error={errors.courseId}
          options={courseOptions}
          required
        />
      </div>

      {/* Botones */}
      <div className="flex gap-3 mt-6">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
        >
          {student ? 'Actualizar' : 'Crear'} Estudiante
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
 * StudentsModule - Módulo de gestión de estudiantes
 */
export const StudentsModule = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [alert, setAlert] = useState(null);

  // Cargar estudiantes y cursos
  useEffect(() => {
    loadData();
  }, []);

  // Filtrar estudiantes
  useEffect(() => {
    const filtered = students.filter((student) =>
      `${student.firstName} ${student.lastName} ${student.documentId}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [students, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, coursesData] = await Promise.all([
        getAllStudents(),
        getAllCourses(),
      ]);
      setStudents(studentsData);
      setCourses(coursesData);
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
    setSelectedStudent(null);
    setShowModal(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleDelete = async (student) => {
    if (window.confirm(`¿Eliminar a ${student.firstName} ${student.lastName}?`)) {
      try {
        setLoading(true);
        await deleteStudent(student.id);
        setAlert({
          type: 'success',
          title: 'Éxito',
          message: 'Estudiante eliminado correctamente',
        });
        await loadData();
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
      if (selectedStudent) {
        await updateStudent(selectedStudent.id, formData);
        setAlert({
          type: 'success',
          title: 'Éxito',
          message: 'Estudiante actualizado correctamente',
        });
      } else {
        await createStudent(formData);
        setAlert({
          type: 'success',
          title: 'Éxito',
          message: 'Estudiante creado correctamente',
        });
      }
      setShowModal(false);
      await loadData();
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

  const getCourseNameById = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : '-';
  };

  const columns = [
    {
      label: 'Nombre',
      key: 'firstName',
      render: (_, row) => `${row.firstName} ${row.lastName}`,
    },
    {
      label: 'Documento',
      key: 'documentId',
    },
    {
      label: 'Email',
      key: 'email',
    },
    {
      label: 'Teléfono',
      key: 'phone',
    },
    {
      label: 'Grado',
      key: 'grade',
    },
    {
      label: 'Curso',
      key: 'courseId',
      render: (courseId) => getCourseNameById(courseId),
    },
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
          <h2 className="text-2xl font-bold text-gray-900">Estudiantes</h2>
          <p className="text-gray-600 text-sm mt-1">
            Total: {filteredStudents.length} estudiante(s)
          </p>
        </div>
        <Button
          onClick={handleCreate}
          variant="primary"
        >
          <Plus className="w-4 h-4" />
          Nuevo Estudiante
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="flex gap-4">
        <div className="flex-1">
          <SearchInput
            placeholder="Buscar por nombre, apellido o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            loading={loading}
          />
        </div>
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Modal */}
      <Modal
        isOpen={showModal}
        title={selectedStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}
        onClose={() => setShowModal(false)}
        size="lg"
        footer={null}
      >
        <StudentForm
          student={selectedStudent}
          courses={courses}
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
          loading={loading}
        />
      </Modal>
    </div>
  );
};

export default StudentsModule;
