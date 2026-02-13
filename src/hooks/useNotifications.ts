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

export function useNotificationCount() {
  return useQuery<NotificationCount>({
    queryKey: ['notifications-count'],
    queryFn: async () => {
      const { data } = await api.get('/notificacoes/count');
      return data;
    },
    refetchInterval: 30_000,
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
