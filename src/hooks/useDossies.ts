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

/**
 * Obtém dossiês para várias entidades numa única chamada (evita N pedidos GET /dossies/entidade/{id}).
 * Retorna array na mesma ordem de entidadeIds; null onde a entidade não tem dossiê.
 */
export async function fetchDossiesPorEntidades(entidadeIds: number[]): Promise<(Dossie | null)[]> {
  if (entidadeIds.length === 0) return [];
  const ids = entidadeIds.join(',');
  const response = await api.get<(Dossie | null)[]>(`/dossies/por-entidades?entidade_ids=${encodeURIComponent(ids)}`);
  return response.data ?? [];
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

const DEFAULT_PAGE_SIZE = 25;

export interface UseDossiesOptions {
  skip?: number;
  limit?: number;
}

export const useDossies = (entidadeId?: number, options: UseDossiesOptions = {}) => {
  const { skip: listSkip = 0, limit: listLimit = DEFAULT_PAGE_SIZE } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Lista de dossiês paginada: GET /dossies?skip=0&limit=25 (resposta: { items, total })
  // Quando temos entidadeId usamos só o single (uma chamada). Sem entidadeId usamos lista paginada.
  const listQuery = useQuery({
    queryKey: ['dossies', entidadeId ?? 'all', listSkip, listLimit],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (entidadeId != null) params.set('entidade_id', String(entidadeId));
      params.set('skip', String(listSkip));
      params.set('limit', String(listLimit));
      const url = `/dossies?${params.toString()}`;
      try {
        const response = await api.get(url);
        const data = response.data;
        // Backend devolve { items, total }; compatibilidade com formato antigo (array)
        if (data && typeof data === 'object' && 'items' in data) {
          return { items: data.items as Dossie[], total: (data as { total?: number }).total ?? 0 };
        }
        return { items: Array.isArray(data) ? data : [], total: Array.isArray(data) ? data.length : 0 };
      } catch (error: unknown) {
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 404) {
          return { items: [], total: 0 };
        }
        throw error;
      }
    },
    enabled: entidadeId == null,
  });

  // Um dossiê por entidade: GET /dossies/entidade/{id} (uma chamada só; backend devolve null se não houver)
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
  });

  // Quando temos entidadeId: usar só o single (1 pedido). Lista = [dossie] ou []
  const dossie = singleQuery.data ?? null;
  const listData = listQuery.data;
  const rawDossies = entidadeId != null
    ? (dossie ? [dossie] : [])
    : (listData && typeof listData === 'object' && 'items' in listData
        ? (Array.isArray((listData as { items?: unknown }).items) ? (listData as { items: unknown[] }).items : [])
        : Array.isArray(listData) ? listData : []);
  // Sempre devolver um array real (cópia) para evitar .filter is not a function em consumidores
  const dossies: Dossie[] = Array.isArray(rawDossies) ? [...rawDossies] : [];
  const dossiesTotal = listData && typeof listData === 'object' && 'total' in listData ? (listData as { total: number }).total : dossies.length;
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
    dossiesTotal,
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

