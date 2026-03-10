import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface ChecklistItem {
  id: number;
  processo_id: number;
  titulo: string;
  descricao?: string | null;
  ordem: number;
  concluido: boolean;
  concluido_em?: string | null;
  concluido_por_id?: number | null;
  concluido_por_nome?: string | null;
}

export function useProcessoChecklist(processoId: number | undefined) {
  const queryClient = useQueryClient();

  const queryKey = ['processo-checklist', processoId];

  const { data: items = [], isLoading } = useQuery<ChecklistItem[]>({
    queryKey,
    queryFn: async () => {
      const res = await api.get(`/processo-checklist/processo/${processoId}`);
      return res.data;
    },
    enabled: !!processoId,
  });

  const toggleItem = useMutation({
    mutationFn: (itemId: number) => api.patch(`/processo-checklist/${itemId}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const createItem = useMutation({
    mutationFn: (data: { titulo: string; descricao?: string }) =>
      api.post(`/processo-checklist/processo/${processoId}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, ...data }: { id: number; titulo?: string; descricao?: string; ordem?: number }) =>
      api.put(`/processo-checklist/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteItem = useMutation({
    mutationFn: (itemId: number) => api.delete(`/processo-checklist/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const progress = items.length > 0
    ? Math.round((items.filter(i => i.concluido).length / items.length) * 100)
    : 0;

  return {
    items,
    isLoading,
    progress,
    toggleItem,
    createItem,
    updateItem,
    deleteItem,
  };
}
