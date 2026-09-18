import { mysqlRequest } from './mysqlApi';
export const createGuardian = (authUid, studentId, relationship = null) => mysqlRequest('/api/acudientes', { method: 'POST', body: { authUid, studentId, relationship } });
export const getGuardianByUid = (uid) => mysqlRequest(`/api/acudientes/${uid}`);
export default { createGuardian, getGuardianByUid };
