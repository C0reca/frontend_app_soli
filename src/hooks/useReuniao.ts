import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface ReuniaoItem {
  id: number;
  tipo_item: string;
  item_id: number;
  criado_em: string;
}

export interface Reuniao {
  id: number;
  processo_id: number | null;
  funcionario_id: number;
  funcionario_nome: string | null;
  titulo: string;
  notas: string | null;
  inicio: string;
  fim: string | null;
  duracao_segundos: number | null;
  log_processo_id: number | null;
  criado_em: string;
  itens: ReuniaoItem[];
}

interface ReuniaoTerminarData {
  notas?: string;
  duracao_segundos: number;
  itens: { tipo_item: string; item_id: number }[];
}

export const useReuniao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const ativaQuery = useQuery({
    queryKey: ['reuniao-ativa'],
    queryFn: async () => {
      const res = await api.get('/reunioes/ativa');
      return res.data as Reuniao | null;
    },
    staleTime: 5 * 60_000,
    enabled: !!localStorage.getItem('user'),
  });

  const iniciarReuniao = useMutation({
    mutationFn: async (data: { processo_id?: number; titulo: string }) => {
      const res = await api.post('/reunioes', data);
      return res.data as Reuniao;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reuniao-ativa'] });
      toast({ title: 'Reunião iniciada', description: 'O temporizador está a correr.' });
    },
    onError: (err: any) => {
      toast({
        title: 'Erro',
        description: err?.response?.data?.detail || 'Erro ao iniciar reunião.',
        variant: 'destructive',
      });
    },
  });

  const terminarReuniao = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ReuniaoTerminarData }) => {
      const res = await api.put(`/reunioes/${id}/terminar`, data);
      return res.data as Reuniao;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reuniao-ativa'] });
      queryClient.invalidateQueries({ queryKey: ['logs-processo'] });
      if (data.processo_id) {
        queryClient.invalidateQueries({ queryKey: ['logs-processo', data.processo_id] });
      }
      toast({ title: 'Reunião terminada', description: 'O registo foi adicionado à timeline.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao terminar reunião.', variant: 'destructive' });
    },
  });

  const cancelarReuniao = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/reunioes/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reuniao-ativa'] });
      toast({ title: 'Reunião cancelada' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao cancelar reunião.', variant: 'destructive' });
    },
  });

  const detalhesReuniao = (reuniaoId: number) =>
    useQuery({
      queryKey: ['reuniao', reuniaoId],
      queryFn: async () => {
        const res = await api.get(`/reunioes/${reuniaoId}`);
        return res.data as Reuniao;
      },
      enabled: !!reuniaoId,
    });

  return {
    ativa: ativaQuery.data,
    isLoadingAtiva: ativaQuery.isLoading,
    iniciarReuniao,
    terminarReuniao,
    cancelarReuniao,
    detalhesReuniao,
  };
};
