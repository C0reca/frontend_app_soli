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
  return (entidade.nome || entidade.nome_empresa || 'N/A').toUpperCase();
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

  // Lista de dossiês: só faz GET /dossies (ou /dossies?entidade_id=X) quando NÃO temos entidadeId
  // Assim evitamos duplicar pedidos quando só precisamos do dossiê de uma entidade (ex.: ProcessModal)
  const listQuery = useQuery({
    queryKey: ['dossies', entidadeId ?? 'all'],
    queryFn: async () => {
      const url = entidadeId != null
        ? `/dossies?entidade_id=${entidadeId}`
        : '/dossies';
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
    enabled: entidadeId == null, // desativado quando pedimos um dossiê por entidade (usamos só o single)
  });

  // Um dossiê por entidade: GET /dossies/entidade/{id} (uma chamada só; backend devolve null se não houver)
  // staleTime alto (5 min) para evitar refetches simultâneos de muitas entidades que esgotam o pool
  const singleQuery = useQuery({
    queryKey: ['dossie', 'entidade', entidadeId],
    queryFn: async () => {
      if (!entidadeId) return null;
      try {
        const response = await api.get(`/dossies/entidade/${entidadeId}`);
        return response.data;
      } catch (err: unknown) {
        const e = err as { response?: { status?: number } };
        if (e.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!entidadeId,
    staleTime: 5 * 60 * 1000,  // 5 min — dossiês mudam raramente
    gcTime: 10 * 60 * 1000,    // 10 min — manter em cache mais tempo
  });

  // Quando temos entidadeId: usar só o single (1 pedido). Lista = [dossie] ou []
  const dossie = singleQuery.data ?? null;
  const dossies = entidadeId != null
    ? (dossie ? [dossie] : [])
    : (listQuery.data ?? []);
  const isLoading = entidadeId != null ? singleQuery.isLoading : listQuery.isLoading;
  const isLoadingDossie = singleQuery.isLoading;
  const error = entidadeId != null ? singleQuery.error : listQuery.error;
  const errorDossie = singleQuery.error;

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

  const changeEntidade = useMutation({
    mutationFn: async ({ dossieId, entidadeId }: { dossieId: number; entidadeId: number }) => {
      const response = await api.put(`/dossies/${dossieId}/entidade`, { entidade_id: entidadeId });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dossies'] });
      if (data?.entidade_id) {
        queryClient.invalidateQueries({ queryKey: ['dossie', 'entidade', data.entidade_id] });
      }
      toast({
        title: "Sucesso",
        description: "Entidade do arquivo alterada com sucesso.",
      });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      toast({
        title: "Erro",
        description: detail || "Erro ao alterar entidade do arquivo.",
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
    changeEntidade,
    deleteDossie,
  };
};

