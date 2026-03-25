import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Captura global de erros não tratados — envia para o backend
const reportError = (payload: Record<string, unknown>) => {
  try {
    const token = localStorage.getItem('token');
    fetch('/api/admin/error-logs/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        source: 'frontend',
        path: window.location.pathname,
        browser: navigator.userAgent,
        ...payload,
      }),
    }).catch(() => { /* silencioso */ });
  } catch { /* silencioso */ }
};

window.onerror = (message, source, lineno, colno, error) => {
  reportError({
    error_type: error?.name || 'UncaughtError',
    error_message: String(message),
    stack_trace: error?.stack || `${source}:${lineno}:${colno}`,
  });
};

window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const err = event.reason;
  reportError({
    error_type: 'UnhandledPromiseRejection',
    error_message: err?.message || String(err),
    stack_trace: err?.stack || '',
  });
};

createRoot(document.getElementById("root")!).render(<App />);
