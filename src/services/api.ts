import axios, { InternalAxiosRequestConfig } from 'axios';

/**
 * Base da API: em dev (Vite) pedidos diretos ao backend em HTTP (evita proxy e SSL); em produção HTTPS quando a página é HTTPS.
 */
function getApiBase(): string {
  if (typeof window === 'undefined') return '/api';
  const { protocol, host, origin } = window.location;
  const isLocal =
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host === '127.0.0.1' ||
    host.startsWith('127.0.0.1:');
  // Em dev, URL direto ao backend em HTTP (sem passar pelo proxy do Vite = menos latência; sem SSL).
  if (import.meta.env.DEV && isLocal) return 'http://127.0.0.1:8000/api';
  if (isLocal) return `http://${host}/api`;
  if (protocol === 'https:') return `https://${host}/api`;
  return `${origin}/api`;
}

/**
 * Remove trailing slash para evitar 307 redirects do FastAPI.
 * As rotas do backend estão definidas sem trailing slash.
 */
function stripTrailingSlash(path: string): string {
  if (!path) return path;
  const i = path.indexOf('?');
  const pathOnly = i >= 0 ? path.slice(0, i) : path;
  const query = i >= 0 ? path.slice(i) : '';
  if (pathOnly.length > 1 && pathOnly.endsWith('/')) {
    return pathOnly.slice(0, -1) + query;
  }
  return path;
}

const api = axios.create({
  baseURL: '/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const base = getApiBase().replace(/\/$/, '');
  let path = (config.url || '').replace(/^\//, '').replace(/^api\/?/, '');
  path = stripTrailingSlash(path);
  const fullUrl = path ? `${base}/${path}` : `${base}/`;
  config.url = fullUrl;
  config.baseURL = '';

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (error.response?.status === 403) {
      const detail = error.response?.data?.detail || '';
      if (typeof detail === 'string' && detail.includes('IP')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?erro=ip';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { api };
