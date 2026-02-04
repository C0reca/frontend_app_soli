import axios, { InternalAxiosRequestConfig } from 'axios';

/**
 * Base da API: SEMPRE HTTPS quando a página está em HTTPS (evita Mixed Content).
 * Usa location.origin e força https para o mesmo host, para não depender de proxy/redirect.
 */
function getApiBase(): string {
  if (typeof window === 'undefined') return '/api';
  const { protocol, host, origin } = window.location;
  // Em HTTPS, garantir que o base da API seja https (evita Mixed Content mesmo com cache/proxy)
  if (protocol === 'https:') {
    return `https://${host}/api`;
  }
  return `${origin}/api`;
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
