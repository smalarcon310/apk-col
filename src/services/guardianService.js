import { mysqlRequest } from './mysqlApi';

export const createGuardian = (authUid, studentId, relationship = null) =>
  mysqlRequest('/api/acudientes', { method: 'POST', body: { authUid, studentId, relationship } });
export const getGuardianByUid = (uid) => mysqlRequest(`/api/acudientes/${uid}`);
export const getAllGuardians = () => mysqlRequest('/api/acudientes');
export const updateGuardian = (id, data) => mysqlRequest(`/api/acudientes/${id}`, { method: 'PUT', body: data });
export const deleteGuardian = (id) => mysqlRequest(`/api/acudientes/${id}`, { method: 'DELETE' });
export const importGuardians = (rows) =>
  mysqlRequest('/api/acudientes/importar', { method: 'POST', body: { rows } });
export default { createGuardian, getGuardianByUid, getAllGuardians, updateGuardian, deleteGuardian, importGuardians };
