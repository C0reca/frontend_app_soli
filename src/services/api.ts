import axios, { InternalAxiosRequestConfig } from 'axios';

/**
 * Base da API: SEMPRE HTTPS quando a página está em HTTPS (evita Mixed Content).
 */
function getApiBase(): string {
  if (typeof window === 'undefined') return '/api';
  const { protocol, host, origin } = window.location;
  if (protocol === 'https:') return `https://${host}/api`;
  return `${origin}/api`;
}

/**
 * Garante que o path termina com / (exigido em produção).
 * Ex.: clientes -> clientes/, clientes/1 -> clientes/1/, clientes?limit=1 -> clientes/?limit=1
 */
function ensureTrailingSlash(path: string): string {
  if (!path) return path;
  const i = path.indexOf('?');
  const pathOnly = i >= 0 ? path.slice(0, i) : path;
  const query = i >= 0 ? path.slice(i) : '';
  if (!pathOnly.endsWith('/')) {
    return pathOnly + '/' + query;
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
  let path = (config.url || '').replace(/^\//, '');
  path = path.replace(/^api\/?/, '');
  path = ensureTrailingSlash(path);
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
    return Promise.reject(error);
  }
);

export default api;
export { api };
