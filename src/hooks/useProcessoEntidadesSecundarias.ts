import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface ProcessoEntidadeSecundaria {
  id: number;
  processo_id: number;
  cliente_id: number;
  tipo_participacao?: string | null;
  criado_em: string;
  atualizado_em: string;
  cliente?: {
    id: number;
    nome: string;
    tipo: string;
    nif?: string;
  };
}

export const useProcessoEntidadesSecundarias = (processoId: number | null) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: entidades = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['processo-entidades-secundarias', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const response = await api.get(`/processos/${processoId}/entidades-secundarias`);
      return response.data;
    },
    enabled: !!processoId,
  });

  const adicionarEntidade = useMutation({
    mutationFn: async (dados: { cliente_id: number; tipo_participacao?: string }) => {
      if (!processoId) throw new Error('Processo ID não disponível');
      const response = await api.post(`/processos/${processoId}/entidades-secundarias`, dados);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processo-entidades-secundarias', processoId] });
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({
        title: 'Sucesso',
        description: 'Entidade secundária adicionada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao adicionar entidade secundária.',
        variant: 'destructive',
      });
    },
  });

  const atualizarEntidade = useMutation({
    mutationFn: async ({ id, ...dados }: { id: number; tipo_participacao?: string }) => {
      if (!processoId) throw new Error('Processo ID não disponível');
      const response = await api.put(`/processos/${processoId}/entidades-secundarias/${id}`, dados);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processo-entidades-secundarias', processoId] });
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({
        title: 'Sucesso',
        description: 'Entidade secundária atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao atualizar entidade secundária.',
        variant: 'destructive',
      });
    },
  });

  const removerEntidade = useMutation({
    mutationFn: async (id: number) => {
      if (!processoId) throw new Error('Processo ID não disponível');
      await api.delete(`/processos/${processoId}/entidades-secundarias/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processo-entidades-secundarias', processoId] });
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({
        title: 'Sucesso',
        description: 'Entidade secundária removida com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao remover entidade secundária.',
        variant: 'destructive',
      });
    },
  });

  return {
    entidades,
    isLoading,
    error,
    adicionarEntidade,
    atualizarEntidade,
    removerEntidade,
  };
};
