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

const api = axios.create({
  baseURL: '/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Construir SEMPRE o URL completo a partir do origin da página (resolve Mixed Content em HTTPS)
  const base = getApiBase();
  let path = (config.url || '').replace(/^\//, '');
  // Em produção alguns servidores exigem / no fim (ex.: /api/clientes/); garantir barra final em paths de coleção
  const [pathOnly, query] = path.includes('?') ? path.split('?', 2) : [path, ''];
  const segments = pathOnly.split('/').filter(Boolean);
  const isCollectionPath = segments.length === 1; // ex.: clientes, processos, dossies
  const needsTrailingSlash = pathOnly.length > 0 && !pathOnly.endsWith('/') && isCollectionPath;
  if (needsTrailingSlash) {
    path = pathOnly + '/' + (query ? '?' + query : '');
  }
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
