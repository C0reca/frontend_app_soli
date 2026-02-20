import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Opcao {
  id: number;
  categoria: string;
  valor: string;
  label: string;
  ordem: number;
  ativo: boolean;
}

export interface CategoriaResumo {
  categoria: string;
  total: number;
  ativos: number;
}

export function useOpcoes(categoria: string, apenasAtivas: boolean = true) {
  return useQuery<Opcao[]>({
    queryKey: ['configuracao-opcoes', categoria, { ativo: apenasAtivas }],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (apenasAtivas) params.ativo = true;
      const { data } = await api.get(`/configuracao-opcoes/${categoria}`, { params });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 min
    enabled: !!categoria,
  });
}

export function useCategorias() {
  return useQuery<CategoriaResumo[]>({
    queryKey: ['configuracao-opcoes-categorias'],
    queryFn: async () => {
      const { data } = await api.get('/configuracao-opcoes');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useOpcoesMutations(categoria?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['configuracao-opcoes'] });
  };

  const criar = useMutation({
    mutationFn: async ({ categoria: cat, valor, label, ordem }: { categoria: string; valor: string; label: string; ordem?: number }) => {
      const { data } = await api.post(`/configuracao-opcoes/${cat}`, { valor, label, ordem });
      return data;
    },
    onSuccess: invalidate,
  });

  const editar = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number; valor?: string; label?: string; ordem?: number; ativo?: boolean }) => {
      const { data } = await api.put(`/configuracao-opcoes/${id}`, updates);
      return data;
    },
    onSuccess: invalidate,
  });

  const desativar = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/configuracao-opcoes/${id}`);
      return data;
    },
    onSuccess: invalidate,
  });

  const reordenar = useMutation({
    mutationFn: async ({ categoria: cat, items }: { categoria: string; items: { id: number; ordem: number }[] }) => {
      const { data } = await api.put(`/configuracao-opcoes/${cat}/reorder`, items);
      return data;
    },
    onSuccess: invalidate,
  });

  return { criar, editar, desativar, reordenar };
}
