import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface Dossie {
  id: number;
  entidade_id: number;
  nome?: string;
  descricao?: string;
  numero?: string;
  criado_em: string;
  atualizado_em: string;
  ativo: boolean;
  entidade?: { nome?: string; nome_empresa?: string };
  processos?: unknown[];
}

/** Nome da entidade (cliente) do dossiê */
export function getEntidadeNomeFromDossie(dossie: Dossie): string {
  const entidade = dossie.entidade;
  if (!entidade) return 'N/A';
  return entidade.nome || entidade.nome_empresa || 'N/A';
}

/** Representação do arquivo: "id - nome da entidade" */
export function getDossieDisplayLabel(dossie: Dossie): string {
  return `${dossie.id} - ${getEntidadeNomeFromDossie(dossie)}`;
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
    queryKey: ['dossies', entidadeId ?? 'all'],
    queryFn: async () => {
      const url = entidadeId != null
        ? `/dossies/?entidade_id=${entidadeId}`
        : '/dossies/';
      try {
        const response = await api.get(url);
        return response.data;
      } catch (error: unknown) {
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 404) {
          return [];
        }
        throw error;
      }
    },
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
      const response = await api.post('/dossies/', dossie);
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
        description: "Arquivo criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar arquivo.",
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
        description: "Arquivo atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar arquivo.",
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
        description: "Arquivo excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir arquivo.",
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

