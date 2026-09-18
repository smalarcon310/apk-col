import { mysqlRequest } from './mysqlApi';
export const createAdvance = (data) => mysqlRequest('/api/avances', { method: 'POST', body: data });
export const getAdvancesBySubject = (id) => mysqlRequest(`/api/avances/materia/${id}`);
export const getAdvancesByStudentAndSubject = (studentId, subjectId) => mysqlRequest(`/api/avances/estudiante/${studentId}?subjectId=${subjectId}`);
export const getLatestAdvanceForStudentSubject = async (studentId, subjectId) => (await getAdvancesByStudentAndSubject(studentId, subjectId))[0] || null;
export const updateAdvance = (id, data) => mysqlRequest(`/api/avances/${id}`, { method: 'PUT', body: data });
export const getAdvancesByTeacher = (id) => mysqlRequest(`/api/avances/docente/${id}`);
export default { createAdvance, getAdvancesBySubject, getAdvancesByStudentAndSubject, getLatestAdvanceForStudentSubject, updateAdvance, getAdvancesByTeacher };
