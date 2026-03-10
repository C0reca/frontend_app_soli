import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface MarketingInteracao {
  id: number;
  cliente_id: number;
  tipo_servico: string;
  empresa_parceira?: string;
  estado: string;
  data_interacao?: string;
  urgencia?: string;
  notas?: string;
  email_enviado_em?: string;
  criado_por_id?: number;
  criado_em?: string;
  atualizado_em?: string;
  cliente_nome?: string;
}

interface ListParams {
  cliente_id?: number;
  tipo_servico?: string;
  estado?: string;
}

export function useMarketingInteracoes(params: ListParams = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ['marketing', params];

  const { data: interacoes = [], isLoading } = useQuery<MarketingInteracao[]>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.cliente_id) searchParams.set('cliente_id', String(params.cliente_id));
      if (params.tipo_servico) searchParams.set('tipo_servico', params.tipo_servico);
      if (params.estado) searchParams.set('estado', params.estado);
      const qs = searchParams.toString();
      const { data } = await api.get(`/marketing${qs ? `?${qs}` : ''}`);
      return data;
    },
  });

  const createInteracao = useMutation({
    mutationFn: async (data: Omit<MarketingInteracao, 'id' | 'criado_em' | 'atualizado_em' | 'cliente_nome'>) => {
      const response = await api.post('/marketing', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing'] });
      toast({ title: 'Sucesso', description: 'Interação registada.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao registar interação.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  const updateInteracao = useMutation({
    mutationFn: async ({ id, ...data }: Partial<MarketingInteracao> & { id: number }) => {
      const response = await api.put(`/marketing/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing'] });
      toast({ title: 'Sucesso', description: 'Interação atualizada.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao atualizar interação.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  const deleteInteracao = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/marketing/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing'] });
      toast({ title: 'Sucesso', description: 'Interação eliminada.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao eliminar interação.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  return { interacoes, isLoading, createInteracao, updateInteracao, deleteInteracao };
}

export function useMarketingResumoCliente(clienteId: number | null) {
  return useQuery<{ abordado: boolean; interacoes: MarketingInteracao[] }>({
    queryKey: ['marketing-resumo', clienteId],
    queryFn: async () => {
      const { data } = await api.get(`/marketing/cliente/${clienteId}/resumo`);
      return data;
    },
    enabled: !!clienteId,
    staleTime: 60_000,
  });
}
