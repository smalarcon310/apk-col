import { mysqlRequest } from './mysqlApi';

export const createRector = (data) =>
  mysqlRequest('/api/rectores', { method: 'POST', body: data });

export default { createRector };
