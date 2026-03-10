import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface SessaoTrabalho {
  id: number;
  processo_id?: number;
  funcionario_id: number;
  titulo: string;
  notas_html?: string;
  inicio?: string;
  fim?: string;
  duracao_segundos?: number;
  estado: string;
  processo_titulo?: string;
  funcionario_nome?: string;
}

export function useSessoesAtivas() {
  return useQuery<SessaoTrabalho[]>({
    queryKey: ['sessoes-trabalho-ativas'],
    queryFn: async () => {
      const { data } = await api.get('/sessoes-trabalho/ativas');
      return data;
    },
    staleTime: 10_000,
  });
}

export function useSessoesHistorico(processoId?: number) {
  return useQuery<SessaoTrabalho[]>({
    queryKey: ['sessoes-trabalho-historico', processoId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (processoId) params.set('processo_id', String(processoId));
      const qs = params.toString();
      const { data } = await api.get(`/sessoes-trabalho/historico${qs ? `?${qs}` : ''}`);
      return data;
    },
  });
}

export function useSessoesMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const iniciarSessao = useMutation({
    mutationFn: async (data: { processo_id?: number; titulo: string }) => {
      const response = await api.post('/sessoes-trabalho', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessoes-trabalho-ativas'] });
      toast({ title: 'Sucesso', description: 'Sessão de trabalho iniciada.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao iniciar sessão.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  const atualizarSessao = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; notas_html?: string; estado?: string }) => {
      const response = await api.put(`/sessoes-trabalho/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessoes-trabalho-ativas'] });
    },
  });

  const terminarSessao = useMutation({
    mutationFn: async (data: { id: number; notas_html?: string; duracao_segundos: number }) => {
      const { id, ...body } = data;
      const response = await api.put(`/sessoes-trabalho/${id}/terminar`, body);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessoes-trabalho-ativas'] });
      queryClient.invalidateQueries({ queryKey: ['sessoes-trabalho-historico'] });
      toast({ title: 'Sucesso', description: 'Sessão de trabalho terminada.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao terminar sessão.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  const apagarSessao = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/sessoes-trabalho/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessoes-trabalho-ativas'] });
      queryClient.invalidateQueries({ queryKey: ['sessoes-trabalho-historico'] });
      toast({ title: 'Sucesso', description: 'Sessão eliminada.' });
    },
  });

  return { iniciarSessao, atualizarSessao, terminarSessao, apagarSessao };
}
