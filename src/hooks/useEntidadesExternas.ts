import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface EntidadeExterna {
  id: number;
  nome: string;
  email?: string | null;
  contacto?: string | null;
  nif?: string | null;
  ativo: boolean;
  criado_em?: string;
  atualizado_em?: string;
}

interface EntidadesExternasResponse {
  items: EntidadeExterna[];
  total: number;
}

export const useEntidadesExternas = (search?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<EntidadesExternasResponse>({
    queryKey: ['entidades-externas', search],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '200' };
      if (search) params.search = search;
      const response = await api.get('/entidades-externas', { params });
      return response.data;
    },
  });

  const criar = useMutation({
    mutationFn: async (dados: { nome: string; email?: string; contacto?: string; nif?: string }) => {
      const response = await api.post('/entidades-externas', dados);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entidades-externas'] });
      toast({ title: 'Sucesso', description: 'Entidade externa criada com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar entidade externa.', variant: 'destructive' });
    },
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, ...dados }: { id: number; nome?: string; email?: string; contacto?: string; nif?: string }) => {
      const response = await api.put(`/entidades-externas/${id}`, dados);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entidades-externas'] });
      toast({ title: 'Sucesso', description: 'Entidade externa atualizada com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar entidade externa.', variant: 'destructive' });
    },
  });

  const eliminar = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/entidades-externas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entidades-externas'] });
      toast({ title: 'Sucesso', description: 'Entidade externa desativada com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao desativar entidade externa.', variant: 'destructive' });
    },
  });

  const converter = useMutation({
    mutationFn: async ({ id, dados }: { id: number; dados: Record<string, unknown> }) => {
      const response = await api.post(`/entidades-externas/${id}/converter`, dados);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entidades-externas'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['processo-entidades-secundarias'] });
      toast({ title: 'Sucesso', description: 'Entidade externa convertida para entidade normal com sucesso.' });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      toast({
        title: 'Erro',
        description: typeof detail === 'string' ? detail : 'Erro ao converter entidade externa.',
        variant: 'destructive',
      });
    },
  });

  return {
    entidades: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    criar,
    atualizar,
    eliminar,
    converter,
  };
};
