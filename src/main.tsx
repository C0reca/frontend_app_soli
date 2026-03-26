import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Patch: prevenir crash do React quando Radix portals são desmontados
// durante re-renders de listas paginadas. O removeChild falha porque
// o nó do portal já foi removido do DOM pelo Radix antes do React cleanup.
const _origRemoveChild = Node.prototype.removeChild;
// @ts-expect-error — override DOM method for Radix portal safety
Node.prototype.removeChild = function (child: Node) {
  if (child.parentNode !== this) {
    return child;
  }
  return _origRemoveChild.call(this, child);
};

const _origInsertBefore = Node.prototype.insertBefore;
// @ts-expect-error — override DOM method for Radix portal safety
Node.prototype.insertBefore = function (newNode: Node, refNode: Node | null) {
  if (refNode && refNode.parentNode !== this) {
    return newNode;
  }
  return _origInsertBefore.call(this, newNode, refNode);
};

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

// Erros benignos que não afectam o utilizador — ignorar nos logs
const IGNORED_ERRORS = [
  'ResizeObserver loop',
  'ResizeObserver loop completed',
];

window.onerror = (message, source, lineno, colno, error) => {
  const msg = String(message);
  if (IGNORED_ERRORS.some(e => msg.includes(e))) return true;
  reportError({
    error_type: error?.name || 'UncaughtError',
    error_message: msg,
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
