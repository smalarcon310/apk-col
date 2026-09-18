import { mysqlRequest } from './mysqlApi';
export const createCourse = (data) => mysqlRequest('/api/cursos', { method: 'POST', body: data });
export const getAllCourses = () => mysqlRequest('/api/cursos');
export const getCourseById = (id) => mysqlRequest(`/api/cursos/${id}`);
export const getCourseByCriteria = async (criteria) => { const rows = await getAllCourses(); return rows.find((row) => Object.entries(criteria).every(([key, value]) => row[key] === value)) || null; };
export const getCoursesByGrade = (grade) => mysqlRequest(`/api/cursos?grade=${grade}`);
export const updateCourse = (id, data) => mysqlRequest(`/api/cursos/${id}`, { method: 'PUT', body: data });
export const deleteCourse = (id) => mysqlRequest(`/api/cursos/${id}`, { method: 'DELETE' });
export const onCoursesChange = (callback) => { getAllCourses().then(callback); return () => {}; };
