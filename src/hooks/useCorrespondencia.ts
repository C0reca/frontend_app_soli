import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface Correspondencia {
  id: number;
  tipo: string;
  processo_id?: number;
  cliente_id?: number;
  assunto: string;
  descricao?: string;
  destinatario?: string;
  remetente?: string;
  data_envio?: string;
  data_rececao?: string;
  tracking_code?: string;
  estado: string;
  documento_id?: number;
  notas?: string;
  criado_por_id?: number;
  criado_em?: string;
  atualizado_em?: string;
  processo_titulo?: string;
  cliente_nome?: string;
}

interface ListParams {
  processo_id?: number;
  cliente_id?: number;
  tipo?: string;
  estado?: string;
}

export function useCorrespondencias(params: ListParams = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ['correspondencias', params];

  const { data: correspondencias = [], isLoading } = useQuery<Correspondencia[]>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.processo_id) searchParams.set('processo_id', String(params.processo_id));
      if (params.cliente_id) searchParams.set('cliente_id', String(params.cliente_id));
      if (params.tipo) searchParams.set('tipo', params.tipo);
      if (params.estado) searchParams.set('estado', params.estado);
      const qs = searchParams.toString();
      const { data } = await api.get(`/correspondencia${qs ? `?${qs}` : ''}`);
      return data;
    },
  });

  const createCorrespondencia = useMutation({
    mutationFn: async (data: Omit<Correspondencia, 'id' | 'criado_em' | 'atualizado_em' | 'processo_titulo' | 'cliente_nome'>) => {
      const response = await api.post('/correspondencia', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondencias'] });
      toast({ title: 'Sucesso', description: 'Correspondência registada.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao registar correspondência.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  const updateCorrespondencia = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Correspondencia> & { id: number }) => {
      const response = await api.put(`/correspondencia/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondencias'] });
      toast({ title: 'Sucesso', description: 'Correspondência atualizada.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao atualizar correspondência.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  const deleteCorrespondencia = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/correspondencia/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['correspondencias'] });
      toast({ title: 'Sucesso', description: 'Correspondência eliminada.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao eliminar correspondência.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  return { correspondencias, isLoading, createCorrespondencia, updateCorrespondencia, deleteCorrespondencia };
}
