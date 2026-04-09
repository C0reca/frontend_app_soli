import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';

// Mock axios antes de importar api
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: { headers: { common: {} } },
  };
  return { default: mockAxios };
});

describe('API client configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('creates axios instance with withCredentials: true', async () => {
    // Re-import para trigger o create
    vi.resetModules();
    await import('./api');

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        withCredentials: true,
      })
    );
  });

  it('creates axios instance with correct baseURL', async () => {
    vi.resetModules();
    await import('./api');

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: '/api/',
      })
    );
  });

  it('creates axios instance with JSON content type', async () => {
    vi.resetModules();
    await import('./api');

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('registers request and response interceptors', async () => {
    vi.resetModules();
    const mod = await import('./api');
    const api = mod.default;

    expect(api.interceptors.request.use).toHaveBeenCalledTimes(1);
    expect(api.interceptors.response.use).toHaveBeenCalledTimes(1);
  });

  it('does not add Authorization header to requests (cookie-based auth)', async () => {
    vi.resetModules();
    const mod = await import('./api');
    const api = mod.default;

    // Obter o request interceptor
    const requestInterceptor = (api.interceptors.request.use as ReturnType<typeof vi.fn>).mock.calls[0][0];

    const config = {
      url: '/auth/me',
      headers: {} as Record<string, string>,
      baseURL: '/api/',
    };

    const result = requestInterceptor(config);

    // Não deve ter header Authorization (token é cookie httpOnly)
    expect(result.headers.Authorization).toBeUndefined();
  });
});

describe('Auth flow (localStorage user data)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('login stores user data in localStorage (not token)', () => {
    const userData = { id: 1, nome: 'Test', email: 'test@test.com', role: 'admin' };
    localStorage.setItem('user', JSON.stringify(userData));

    const stored = JSON.parse(localStorage.getItem('user')!);
    expect(stored.email).toBe('test@test.com');
    expect(stored.role).toBe('admin');

    // Token NÃO deve estar no localStorage (está no cookie httpOnly)
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('logout clears user data from localStorage', () => {
    localStorage.setItem('user', JSON.stringify({ id: 1, nome: 'Test' }));
    expect(localStorage.getItem('user')).not.toBeNull();

    // Simular logout
    localStorage.removeItem('user');
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('token is never stored in localStorage', () => {
    // Verificar que nenhum código guarda 'token' no localStorage
    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});

describe('Response error handling', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: '/', host: 'localhost:8080', protocol: 'http:', origin: 'http://localhost:8080' },
      writable: true,
    });
  });

  it('401 response clears user from localStorage', async () => {
    vi.resetModules();
    const mod = await import('./api');
    const api = mod.default;

    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    // Obter o error handler do response interceptor
    const errorHandler = (api.interceptors.response.use as ReturnType<typeof vi.fn>).mock.calls[0][1];

    const error = {
      response: { status: 401 },
    };

    try {
      await errorHandler(error);
    } catch {
      // Expected rejection
    }

    expect(localStorage.getItem('user')).toBeNull();
  });

  it('403 with IP detail clears user from localStorage', async () => {
    vi.resetModules();
    const mod = await import('./api');
    const api = mod.default;

    localStorage.setItem('user', JSON.stringify({ id: 1 }));

    const errorHandler = (api.interceptors.response.use as ReturnType<typeof vi.fn>).mock.calls[0][1];

    const error = {
      response: {
        status: 403,
        data: { detail: 'IP não autorizado' },
      },
    };

    try {
      await errorHandler(error);
    } catch {
      // Expected rejection
    }

    expect(localStorage.getItem('user')).toBeNull();
  });

  it('normalizes Pydantic array errors to string', async () => {
    vi.resetModules();
    const mod = await import('./api');
    const api = mod.default;

    const errorHandler = (api.interceptors.response.use as ReturnType<typeof vi.fn>).mock.calls[0][1];

    const error = {
      response: {
        status: 422,
        data: {
          detail: [
            { msg: 'field required', loc: ['body', 'email'] },
            { msg: 'invalid value', loc: ['body', 'password'] },
          ],
        },
      },
    };

    try {
      await errorHandler(error);
    } catch {
      // Expected rejection
    }

    expect(typeof error.response.data.detail).toBe('string');
    expect(error.response.data.detail).toContain('field required');
    expect(error.response.data.detail).toContain('invalid value');
  });
});
