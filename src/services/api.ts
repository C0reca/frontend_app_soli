import axios from 'axios';

// Base URL da API: sempre o mesmo origin que a página, forçando HTTPS quando a página está em HTTPS (evita Mixed Content)
function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '/api/';
  const { protocol, host } = window.location;
  const origin = protocol === 'https:' ? `https://${host}` : `${protocol}//${host}`;
  return `${origin}/api/`;
}

export const api = axios.create({
  baseURL: '/api/', // será sobrescrito no interceptor para usar o origin correto
  headers: {
    'Content-Type': 'application/json',
  },
});

// Em cada pedido, forçar o baseURL com o origin atual (HTTPS em produção)
api.interceptors.request.use((config) => {
  const baseURL = getApiBaseUrl();
  config.baseURL = baseURL;
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
