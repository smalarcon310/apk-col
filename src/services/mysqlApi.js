const configuredApiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002';
const API_BASE_URL = configuredApiUrl.replace('localhost', window.location.hostname);

export async function mysqlRequest(endpoint, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || `Error ${response.status}`);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('La API no respondió a tiempo');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function sessionUser() {
  try { return JSON.parse(localStorage.getItem('sessionUser') || 'null'); } catch { return null; }
}
