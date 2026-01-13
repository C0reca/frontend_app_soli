import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface Dossie {
  id: number;
  entidade_id: number;
  nome: string;
  descricao?: string;
  numero?: string;
  criado_em: string;
  atualizado_em: string;
  ativo: boolean;
}

export type NovaEntidadePayload = {
  tipo: 'singular' | 'coletivo';
  nome?: string;
  nome_empresa?: string;
  email?: string;
  telefone?: string;
  nif?: string;
  nif_empresa?: string;
};

export interface DossieCreate {
  entidade_id?: number;
  nome: string;
  descricao?: string;
  numero?: string;
  nova_entidade?: NovaEntidadePayload;
}

export const useDossies = (entidadeId?: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: dossies = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['dossies', entidadeId],
    queryFn: async () => {
      const url = entidadeId ? `/dossies?entidade_id=${entidadeId}` : '/dossies';
      const response = await api.get(url);
      return response.data;
    },
    // Permite listar todos os dossiês mesmo sem entidade_id
  });

  // Hook para obter o dossiê de uma entidade específica (uma entidade tem apenas um dossiê)
  const {
    data: dossie,
    isLoading: isLoadingDossie,
    error: errorDossie
  } = useQuery({
    queryKey: ['dossie', 'entidade', entidadeId],
    queryFn: async () => {
      if (!entidadeId) return null;
      try {
        const response = await api.get(`/dossies/entidade/${entidadeId}`);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null; // Dossiê não existe ainda
        }
        throw error;
      }
    },
    enabled: !!entidadeId,
  });

  const createDossie = useMutation({
    mutationFn: async (dossie: DossieCreate) => {
      const response = await api.post('/dossies', dossie);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dossies'] });
      const entidadeId = data?.entidade_id ?? variables.entidade_id;
      if (entidadeId) {
        queryClient.invalidateQueries({ queryKey: ['dossie', 'entidade', entidadeId] });
      }
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Sucesso",
        description: "Dossiê criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar dossiê.",
        variant: "destructive",
      });
    },
  });

  const updateDossie = useMutation({
    mutationFn: async ({ id, ...dossie }: Partial<Dossie> & { id: number }) => {
      const response = await api.put(`/dossies/${id}`, dossie);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dossies'] });
      if (data?.entidade_id) {
        queryClient.invalidateQueries({ queryKey: ['dossie', 'entidade', data.entidade_id] });
      }
      toast({
        title: "Sucesso",
        description: "Dossiê atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar dossiê.",
        variant: "destructive",
      });
    },
  });

  const deleteDossie = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/dossies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossies'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Sucesso",
        description: "Dossiê excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir dossiê.",
        variant: "destructive",
      });
    },
  });

  return {
    dossies,
    dossie, // Dossiê único da entidade
    isLoading,
    isLoadingDossie,
    error,
    errorDossie,
    createDossie,
    updateDossie,
    deleteDossie,
  };
};

