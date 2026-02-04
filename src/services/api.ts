import axios, { InternalAxiosRequestConfig } from 'axios';

/**
 * Base da API: SEMPRE o origin da página (https em produção = sem Mixed Content).
 * O URL completo é construído no interceptor para não depender de baseURL nem de URLs relativos.
 */
function getApiBase(): string {
  if (typeof window === 'undefined') return '/api';
  return `${window.location.origin}/api`;
}

const api = axios.create({
  baseURL: '/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Construir SEMPRE o URL completo a partir do origin da página (resolve Mixed Content em HTTPS)
  const base = getApiBase();
  const path = (config.url || '').replace(/^\//, '');
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
