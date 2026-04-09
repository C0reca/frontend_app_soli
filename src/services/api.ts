import axios, { InternalAxiosRequestConfig } from 'axios';

/**
 * Base da API: em dev usa o proxy do Vite (/api → backend) para que os cookies
 * httpOnly funcionem (same-origin). Em produção usa HTTPS.
 */
function getApiBase(): string {
  if (typeof window === 'undefined') return '/api';
  const { protocol, host, origin } = window.location;
  const isLocal =
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host === '127.0.0.1' ||
    host.startsWith('127.0.0.1:');
  // Em dev, usar o proxy do Vite (same-origin) — necessário para cookies httpOnly.
  // O Vite proxy reencaminha /api → http://127.0.0.1:8000
  if (import.meta.env.DEV && isLocal) return '/api';
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
  withCredentials: true, // Envia cookies httpOnly automaticamente em todas as requests
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const base = getApiBase().replace(/\/$/, '');
  let path = (config.url || '').replace(/^\//, '').replace(/^api\/?/, '');
  path = stripTrailingSlash(path);
  const fullUrl = path ? `${base}/${path}` : `${base}/`;
  config.url = fullUrl;
  config.baseURL = '';

  // Cookie httpOnly é enviado automaticamente pelo browser (withCredentials: true)
  // Não é necessário adicionar header Authorization manualmente

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      // Evitar loop infinito: não redirecionar se já estamos no /login
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 403) {
      const detail = error.response?.data?.detail || '';
      if (typeof detail === 'string' && detail.includes('IP')) {
        localStorage.removeItem('user');
        window.location.href = '/login?erro=ip';
      }
    }
    // Normalizar detail do Pydantic (array de objectos) para string legível
    // para que nenhum toast/handler receba um objecto como React child
    if (error.response?.data?.detail && typeof error.response.data.detail !== 'string') {
      const d = error.response.data.detail;
      if (Array.isArray(d)) {
        error.response.data.detail = d.map((item: any) =>
          typeof item === 'string' ? item : item?.msg || JSON.stringify(item)
        ).join('; ');
      } else if (typeof d === 'object') {
        error.response.data.detail = JSON.stringify(d);
      }
    }
    return Promise.reject(error);
  }
);

// ── Azure Files helpers ──────────────────────────────────────────────────

export type AzureEntityType = 'clientes' | 'processos';

export const azureFiles = {
  listar: (tipo: AzureEntityType, id: number, subpasta?: string) =>
    api.get(`/${tipo}/${id}/ficheiros`, { params: subpasta ? { subpasta } : {} }),

  upload: (tipo: AzureEntityType, id: number, ficheiro: File, subpasta?: string) => {
    const form = new FormData();
    form.append('ficheiro', ficheiro);
    if (subpasta) form.append('subpasta', subpasta);
    return api.post(`/${tipo}/${id}/ficheiros/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  download: (tipo: AzureEntityType, id: number, caminho: string) =>
    api.get(`/${tipo}/${id}/ficheiros/download`, {
      params: { caminho },
      responseType: 'blob',
    }),

  apagar: (tipo: AzureEntityType, id: number, caminho: string) =>
    api.delete(`/${tipo}/${id}/ficheiros`, { params: { caminho } }),

  configurarPasta: (tipo: AzureEntityType, id: number, azure_folder_path: string) =>
    api.patch(`/${tipo}/${id}/ficheiros/pasta`, { azure_folder_path }),
};

// ── Processo Templates helpers ──────────────────────────────────────────

export const processoTemplates = {
  // Templates
  list: (params?: { tipo_processo?: string; estado?: string }) =>
    api.get('/admin/templates', { params }),
  get: (id: number) => api.get(`/admin/templates/${id}`),
  create: (data: any) => api.post('/admin/templates', data),
  update: (id: number, data: any) => api.put(`/admin/templates/${id}`, data),
  ativar: (id: number) => api.post(`/admin/templates/${id}/ativar`),
  arquivar: (id: number) => api.post(`/admin/templates/${id}/arquivar`),
  duplicar: (id: number) => api.post(`/admin/templates/${id}/duplicar`),
  delete: (id: number) => api.delete(`/admin/templates/${id}`),
  getAtivo: (tipo: string) => api.get(`/templates/tipo/${tipo}/ativo`),

  // Wizard rascunhos
  getRascunho: (processoId: number) => api.get(`/processos/${processoId}/wizard/rascunho`),
  salvarRascunho: (processoId: number, data: { dados_parciais?: any; passo_atual?: number }) =>
    api.put(`/processos/${processoId}/wizard/rascunho`, data),
  apagarRascunho: (processoId: number) => api.delete(`/processos/${processoId}/wizard/rascunho`),

  // Passos
  createPasso: (tid: number, data: any) => api.post(`/admin/templates/${tid}/passos`, data),
  updatePasso: (tid: number, pid: number, data: any) => api.put(`/admin/templates/${tid}/passos/${pid}`, data),
  deletePasso: (tid: number, pid: number) => api.delete(`/admin/templates/${tid}/passos/${pid}`),
  reordenarPassos: (tid: number, ordem: number[]) => api.post(`/admin/templates/${tid}/passos/reordenar`, { ordem }),

  // Campos
  createCampo: (tid: number, pid: number, data: any) => api.post(`/admin/templates/${tid}/passos/${pid}/campos`, data),
  updateCampo: (tid: number, pid: number, cid: number, data: any) => api.put(`/admin/templates/${tid}/passos/${pid}/campos/${cid}`, data),
  deleteCampo: (tid: number, pid: number, cid: number) => api.delete(`/admin/templates/${tid}/passos/${pid}/campos/${cid}`),
  reordenarCampos: (tid: number, pid: number, ordem: number[]) => api.post(`/admin/templates/${tid}/passos/${pid}/campos/reordenar`, { ordem }),

  // Tarefas automáticas
  createTarefa: (tid: number, data: any) => api.post(`/admin/templates/${tid}/tarefas`, data),
  updateTarefa: (tid: number, tarefaId: number, data: any) => api.put(`/admin/templates/${tid}/tarefas/${tarefaId}`, data),
  deleteTarefa: (tid: number, tarefaId: number) => api.delete(`/admin/templates/${tid}/tarefas/${tarefaId}`),

  // Documentos automáticos
  createDoc: (tid: number, data: any) => api.post(`/admin/templates/${tid}/documentos`, data),
  updateDoc: (tid: number, docId: number, data: any) => api.put(`/admin/templates/${tid}/documentos/${docId}`, data),
  deleteDoc: (tid: number, docId: number) => api.delete(`/admin/templates/${tid}/documentos/${docId}`),
};

export default api;
export { api };
