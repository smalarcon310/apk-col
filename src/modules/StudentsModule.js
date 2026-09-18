import React, { useEffect, useMemo, useState } from 'react';
import { createStudent, getAllStudents, updateStudent, deleteStudent } from '../services/studentService';
import { getAllCourses } from '../services/courseService';
import { DataTable } from '../components/DataTable';
import Modal from '../components/Modal';
import { TextInput, SelectInput, SearchInput, Button } from '../components/FormInputs';

export const StudentsModule = ({ currentProfile = null }) => {
	const [students, setStudents] = useState([]);
	const [courses, setCourses] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
		const [deletingStudentId, setDeletingStudentId] = useState(null);
		const [editingStudent, setEditingStudent] = useState(null);
		const [editFormData, setEditFormData] = useState(null);
	const [message, setMessage] = useState(null);
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		documentId: '',
		phone: '',
		email: '',
		grade: '6',
		courseId: '',
	});

	const loadData = async (showLoading = true) => {
		try {
			if (showLoading) setLoading(true);
			const [studentsData, coursesData] = await Promise.all([
				getAllStudents(),
				getAllCourses(),
			]);
			setStudents(studentsData || []);
			setCourses(coursesData || []);
		} catch (error) {
			setMessage({
				type: 'error',
				text: 'No se pudieron cargar estudiantes y cursos.',
			});
		} finally {
			if (showLoading) setLoading(false);
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	const courseOptions = courses.map((course) => ({
		value: course.id,
		label: `${course.name} - Grado ${course.grade}`,
	}));

	const filteredStudents = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		if (!term) return students;

		return students.filter((student) => {
			const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
			return (
				fullName.includes(term) ||
				String(student.documentId || '').toLowerCase().includes(term) ||
				String(student.email || '').toLowerCase().includes(term)
			);
		});
	}, [students, searchTerm]);

	const columns = [
		{ label: 'Nombre', key: 'name', render: (_, row) => `${row.firstName || ''} ${row.lastName || ''}`.trim() },
		{ label: 'Documento', key: 'documentId' },
		{ label: 'Correo', key: 'email' },
		{ label: 'Grado', key: 'grade', render: (value) => `Grado ${value || '-'}` },
		{
			label: 'Curso',
			key: 'courseId',
			render: (value) => {
				const c = courses.find((course) => course.id === value);
				return c ? c.name : 'Sin curso';
			},
		},
	];

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			setSaving(true);
			setMessage(null);
			await createStudent(formData);
			setMessage({ type: 'success', text: 'Estudiante registrado correctamente.' });
			setFormData({
				firstName: '',
				lastName: '',
				documentId: '',
				phone: '',
				email: '',
				grade: '6',
				courseId: '',
			});
			await loadData(false);
		} catch (error) {
			setMessage({ type: 'error', text: error.message || 'No se pudo registrar el estudiante.' });
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (student) => {
		const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
		if (!window.confirm(`¿Desea eliminar al estudiante ${studentName}? También se eliminarán sus avances académicos.`)) return;

		try {
			setDeletingStudentId(student.id);
			setMessage(null);
			await deleteStudent(student.id);
			setStudents((current) => current.filter((item) => item.id !== student.id));
			setMessage({ type: 'success', text: 'Estudiante eliminado correctamente.' });
		} catch (error) {
			setMessage({ type: 'error', text: error.message || 'No se pudo eliminar el estudiante.' });
		} finally {
			setDeletingStudentId(null);
		}
	};

	const handleEdit = (student) => {
		setEditingStudent(student);
		setEditFormData({
			firstName: student.firstName || '',
			lastName: student.lastName || '',
			documentId: student.documentId || '',
			phone: student.phone || '',
			email: student.email || '',
			grade: String(student.grade || '6'),
			courseId: student.courseId || '',
		});
	};

	const handleEditChange = (e) => {
		const { name, value } = e.target;
		setEditFormData((previous) => {
			if (name !== 'grade') return { ...previous, [name]: value };
			const compatibleCourse = courses.find((course) => String(course.grade) === String(value));
			return { ...previous, grade: value, courseId: compatibleCourse?.id || '' };
		});
	};

	const handleEditSubmit = async (e) => {
		e.preventDefault();
		try {
			setSaving(true);
			await updateStudent(editingStudent.id, editFormData);
			setStudents((current) => current.map((student) => (
				student.id === editingStudent.id ? { ...student, ...editFormData } : student
			)));
			setEditingStudent(null);
			setEditFormData(null);
			setMessage({ type: 'success', text: 'Estudiante actualizado correctamente.' });
		} catch (error) {
			setMessage({ type: 'error', text: error.message || 'No se pudo actualizar el estudiante.' });
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-lg shadow p-6">
				<h2 className="text-2xl font-bold mb-4">Gestión de Estudiantes</h2>
				<p className="text-sm text-gray-600 mb-6">Registra estudiantes y consulta los ya creados.</p>

				<div
					aria-live="polite"
					className={`mb-4 rounded p-3 text-sm ${message ? (message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200') : 'invisible'}`}
				>
					{message?.text || ''}
				</div>

				<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<TextInput label="Nombre" name="firstName" value={formData.firstName} onChange={handleChange} required />
					<TextInput label="Apellido" name="lastName" value={formData.lastName} onChange={handleChange} required />
					<TextInput label="Documento" name="documentId" value={formData.documentId} onChange={handleChange} required />
					<TextInput label="Teléfono" name="phone" value={formData.phone} onChange={handleChange} required />
					<TextInput label="Correo" name="email" type="email" value={formData.email} onChange={handleChange} />
					<SelectInput
						label="Grado"
						name="grade"
						value={formData.grade}
						onChange={handleChange}
						options={[
							{ value: '6', label: 'Grado 6' },
							{ value: '7', label: 'Grado 7' },
							{ value: '8', label: 'Grado 8' },
							{ value: '9', label: 'Grado 9' },
							{ value: '10', label: 'Grado 10' },
							{ value: '11', label: 'Grado 11' },
						]}
						required
					/>
					<div className="md:col-span-2">
						<SelectInput
							label="Curso"
							name="courseId"
							value={formData.courseId}
							onChange={handleChange}
							options={courseOptions}
							required
						/>
					</div>
					<div className="md:col-span-2 flex justify-end">
						<Button type="submit" loading={saving}>Registrar estudiante</Button>
					</div>
				</form>
			</div>

			<div className="bg-white rounded-lg shadow p-6">
				<div className="flex items-center justify-between mb-4 gap-4">
					<h3 className="text-lg font-semibold">Listado de estudiantes</h3>
					<div className="w-full max-w-sm">
						<SearchInput
							placeholder="Buscar por nombre, documento o correo..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</div>
				<DataTable
					columns={columns}
					data={filteredStudents}
					loading={loading}
					pagination
					pageSize={8}
					onEdit={currentProfile?.role === 'rector' ? handleEdit : undefined}
					onDelete={currentProfile?.role === 'rector' && !deletingStudentId ? handleDelete : undefined}
				/>
			</div>

			<Modal
				isOpen={Boolean(editingStudent && editFormData)}
				title="Editar estudiante"
				onClose={() => { setEditingStudent(null); setEditFormData(null); }}
				size="md"
				footer={null}
			>
				{editFormData && (
					<form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<TextInput label="Nombre" name="firstName" value={editFormData.firstName} onChange={handleEditChange} required />
						<TextInput label="Apellido" name="lastName" value={editFormData.lastName} onChange={handleEditChange} required />
						<TextInput label="Documento" name="documentId" value={editFormData.documentId} onChange={handleEditChange} required />
						<TextInput label="Teléfono" name="phone" value={editFormData.phone} onChange={handleEditChange} required />
						<TextInput label="Correo" name="email" type="email" value={editFormData.email} onChange={handleEditChange} />
						<SelectInput
							label="Grado"
							name="grade"
							value={editFormData.grade}
							onChange={handleEditChange}
							options={['6', '7', '8', '9', '10', '11'].map((grade) => ({ value: grade, label: `Grado ${grade}` }))}
							required
						/>
						<div className="md:col-span-2">
							<SelectInput
								label="Curso"
								name="courseId"
								value={editFormData.courseId}
								onChange={handleEditChange}
								options={courseOptions.filter((course) => {
									const selectedCourse = courses.find((item) => item.id === course.value);
									return selectedCourse && String(selectedCourse.grade) === String(editFormData.grade);
								})}
								required
							/>
						</div>
						<div className="md:col-span-2 flex justify-end gap-2">
							<Button type="button" variant="secondary" onClick={() => { setEditingStudent(null); setEditFormData(null); }} disabled={saving}>Cancelar</Button>
							<Button type="submit" loading={saving}>Guardar cambios</Button>
						</div>
					</form>
				)}
			</Modal>
		</div>
	);
};

export default StudentsModule;
