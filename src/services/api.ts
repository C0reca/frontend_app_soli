import axios from 'axios';

// Usar o mesmo origin que a página para evitar Mixed Content (HTTPS em produção)
function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return 'api/';
  const { protocol, host } = window.location;
  // Se a página está em HTTPS, forçar API em HTTPS (evita proxies que passam origin em http)
  const origin = protocol === 'https:' ? `https://${host}` : `${protocol}//${host}`;
  return `${origin}/api/`;
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
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
