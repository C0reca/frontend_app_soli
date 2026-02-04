import axios from 'axios';

const API_PREFIX = '/api';

// Em HTTPS, forçar o URL absoluto para https:// para evitar Mixed Content (o browser pode estar a servir JS em cache).
function ensureHttpsUrl(config: { url?: string; baseURL?: string }): void {
  if (typeof window === 'undefined') return;
  if (window.location.protocol !== 'https:') return;
  const host = window.location.host;
  const path = (config.url || '').replace(/^\//, '');
  const fullPath = path ? `${API_PREFIX}/${path}` : API_PREFIX;
  (config as any).url = `https://${host}${fullPath.startsWith('/') ? fullPath : `/${fullPath}`}`;
  (config as any).baseURL = '';
}

export const api = axios.create({
  baseURL: API_PREFIX + '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  ensureHttpsUrl(config);
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
