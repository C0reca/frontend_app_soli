import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface EmailMensagem {
  id: number;
  message_id?: string;
  pasta: string;
  de: string;
  para: string;
  cc?: string;
  assunto: string;
  corpo_texto?: string;
  corpo_html?: string;
  lido: boolean;
  data?: string;
  processo_id?: number;
  cliente_id?: number;
  direcao: string;
  sincronizado_em?: string;
}

export function useEmailStatus() {
  return useQuery({
    queryKey: ['email-inbox-status'],
    queryFn: async () => {
      const { data } = await api.get('/email-inbox/status');
      return data as { imap_configurado: boolean; imap_host: string | null; imap_user: string | null };
    },
    staleTime: 60_000 * 10,
  });
}

export function useEmailMensagens(pasta = 'INBOX', direcao?: string, search?: string, lido?: boolean, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['email-inbox', pasta, direcao, search, lido, limit, offset],
    queryFn: async () => {
      const params: any = { pasta, limit, offset };
      if (direcao) params.direcao = direcao;
      if (search) params.search = search;
      if (lido !== undefined) params.lido = lido;
      const { data } = await api.get('/email-inbox/mensagens', { params });
      return data as { total: number; items: EmailMensagem[] };
    },
    refetchInterval: 30_000, // Refrescar lista a cada 30s
  });
}

export function useEmailMensagem(id: number) {
  return useQuery({
    queryKey: ['email-inbox', 'msg', id],
    queryFn: async () => {
      const { data } = await api.get(`/email-inbox/mensagens/${id}`);
      return data as EmailMensagem;
    },
    enabled: !!id,
  });
}

export function useEmailNaoLidos() {
  return useQuery({
    queryKey: ['email-inbox-nao-lidos'],
    queryFn: async () => {
      const { data } = await api.get('/email-inbox/nao-lidos');
      return data as { nao_lidos: number };
    },
    refetchInterval: 30_000,
  });
}

export function useEmailSyncStatus() {
  return useQuery({
    queryKey: ['email-sync-status'],
    queryFn: async () => {
      const { data } = await api.get('/email-inbox/sync-status');
      return data as { auto_sync_ativo: boolean; intervalo_segundos: number };
    },
    staleTime: 60_000 * 5,
  });
}

export function useEmailMutations() {
  const qc = useQueryClient();

  const sincronizar = useMutation({
    mutationFn: async (limite?: number) => {
      const params = limite ? { limite } : {};
      const { data } = await api.post('/email-inbox/sincronizar', null, { params });
      return data as { sincronizados: number; total_processados: number };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-inbox'] }),
  });

  const enviar = useMutation({
    mutationFn: async (dados: { para: string; assunto: string; corpo: string; html?: boolean; processo_id?: number; cliente_id?: number }) => {
      const { data } = await api.post('/email-inbox/enviar', dados);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-inbox'] }),
  });

  const marcarLido = useMutation({
    mutationFn: async ({ id, lido }: { id: number; lido: boolean }) => {
      await api.put(`/email-inbox/mensagens/${id}/lido`, null, { params: { lido } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email-inbox'] });
      qc.invalidateQueries({ queryKey: ['email-inbox-nao-lidos'] });
    },
  });

  const associar = useMutation({
    mutationFn: async ({ id, processo_id, cliente_id }: { id: number; processo_id?: number; cliente_id?: number }) => {
      const { data } = await api.put(`/email-inbox/mensagens/${id}/associar`, null, { params: { processo_id, cliente_id } });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-inbox'] }),
  });

  return { sincronizar, enviar, marcarLido, associar };
}
