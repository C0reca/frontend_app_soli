import axios from 'axios';

// Base URL: em browser usa o origin da página; se a página está em HTTPS, forçar https (evita Mixed Content).
const getBaseURL = (): string => {
  if (typeof window === 'undefined') return '/api/';
  const { protocol, host } = window.location;
  const origin = protocol === 'https:' ? `https://${host}` : `${protocol}//${host}`;
  return `${origin}/api/`;
};

export const api = axios.create({
  baseURL: '/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Forçar baseURL com o origin atual para garantir HTTPS quando a página está em HTTPS
  config.baseURL = getBaseURL();
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
