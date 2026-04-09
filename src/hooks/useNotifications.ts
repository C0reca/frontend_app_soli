import { useEffect, useRef, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

interface Notification {
  id: number;
  tipo: string;
  titulo: string;
  mensagem?: string;
  lida: boolean;
  lida_em?: string;
  link_tipo?: string;
  link_id?: number;
  criado_em: string;
}

interface NotificationCount {
  nao_lidas: number;
}

// --- WebSocket singleton ---

function getWsUrl(): string {
  const { protocol, host } = window.location;
  const isLocal =
    host === 'localhost' ||
    host.startsWith('localhost:') ||
    host === '127.0.0.1' ||
    host.startsWith('127.0.0.1:');
  let wsBase: string;
  if (import.meta.env.DEV && isLocal) {
    // Usar proxy Vite (same-origin) para que cookies httpOnly sejam enviados
    wsBase = `ws://${host}/api`;
  } else if (protocol === 'https:') {
    wsBase = `wss://${host}/api`;
  } else {
    wsBase = `ws://${host}/api`;
  }
  // Cookie httpOnly é enviado automaticamente na ligação WebSocket (same-origin)
  return `${wsBase}/ws/notificacoes`;
}

type WsListener = (data: any) => void;
const wsListeners = new Set<WsListener>();
let wsInstance: WebSocket | null = null;
let wsConnected = false;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let pingTimer: ReturnType<typeof setInterval> | undefined;

function connectWs() {
  const url = getWsUrl();
  if (!url || wsInstance) return;

  try {
    const ws = new WebSocket(url);
    wsInstance = ws;

    ws.onopen = () => { wsConnected = true; };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        wsListeners.forEach((fn) => fn(data));
      } catch { /* pong */ }
    };
    ws.onclose = () => {
      wsConnected = false;
      wsInstance = null;
      reconnectTimer = setTimeout(connectWs, 5000);
    };
    ws.onerror = () => { ws.close(); };

    clearInterval(pingTimer);
    pingTimer = setInterval(() => {
      if (wsInstance?.readyState === WebSocket.OPEN) wsInstance.send('ping');
    }, 30_000);
  } catch {
    wsConnected = false;
  }
}

function disconnectWs() {
  clearTimeout(reconnectTimer);
  clearInterval(pingTimer);
  wsInstance?.close();
  wsInstance = null;
  wsConnected = false;
}

/**
 * Hook that connects to WebSocket for live notifications.
 * Should be called once from the NotificationDropdown (always mounted).
 */
export function useWebSocketNotifications() {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(wsConnected);

  useEffect(() => {
    const listener: WsListener = (data) => {
      if (data.type === 'nova_notificacao') {
        queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      }
      // Novos emails sincronizados automaticamente pelo backend
      if (data.tipo === 'novos_emails') {
        queryClient.invalidateQueries({ queryKey: ['email-inbox'] });
        queryClient.invalidateQueries({ queryKey: ['email-inbox-nao-lidos'] });
      }
    };

    wsListeners.add(listener);
    connectWs();

    // Track connected state
    const check = setInterval(() => setConnected(wsConnected), 2000);

    return () => {
      wsListeners.delete(listener);
      clearInterval(check);
      if (wsListeners.size === 0) disconnectWs();
    };
  }, [queryClient]);

  return { connected };
}

// --- React Query hooks ---

export function useNotificationCount() {
  const { connected } = useWebSocketNotifications();

  return useQuery<NotificationCount>({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const { data } = await api.get('/notificacoes/count');
      return data;
    },
    refetchInterval: connected ? 120_000 : 30_000,
    staleTime: 10_000,
  });
}

export function useNotifications(enabled: boolean, apenasNaoLidas: boolean = false) {
  return useQuery<Notification[]>({
    queryKey: ['notifications', { apenas_nao_lidas: apenasNaoLidas }],
    queryFn: async () => {
      const { data } = await api.get('/notificacoes', {
        params: { limit: 50, apenas_nao_lidas: apenasNaoLidas },
      });
      return data;
    },
    enabled,
    staleTime: 10_000,
  });
}

export function useNotificationsPaginated(skip: number = 0, limit: number = 20, apenasNaoLidas: boolean = false) {
  return useQuery<Notification[]>({
    queryKey: ['notifications-page', { skip, limit, apenas_nao_lidas: apenasNaoLidas }],
    queryFn: async () => {
      const { data } = await api.get('/notificacoes', {
        params: { skip, limit, apenas_nao_lidas: apenasNaoLidas },
      });
      return data;
    },
  });
}

export function useNotificationMutations() {
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/notificacoes/${id}/lida`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/notificacoes/marcar-todas-lidas');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
    },
  });

  return { markAsRead, markAllAsRead };
}
