import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Solicitador {
  id: number;
  nome: string;
  titulo: string;
  cedula: string | null;
  ativo: boolean;
  ordem: number;
  criado_em?: string;
  atualizado_em?: string;
}

export function useSolicitadores() {
  return useQuery<Solicitador[]>({
    queryKey: ['solicitadores'],
    queryFn: async () => {
      const { data } = await api.get('/solicitadores');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSolicitadoresAtivos() {
  return useQuery<Solicitador[]>({
    queryKey: ['solicitadores', 'ativos'],
    queryFn: async () => {
      const { data } = await api.get('/solicitadores/ativos');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSolicitadorMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['solicitadores'] });
  };

  const criar = useMutation({
    mutationFn: async (data: { nome: string; titulo: string; cedula?: string }) => {
      const { data: result } = await api.post('/solicitadores', data);
      return result;
    },
    onSuccess: invalidate,
  });

  const editar = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number; nome?: string; titulo?: string; cedula?: string; ativo?: boolean; ordem?: number }) => {
      const { data } = await api.put(`/solicitadores/${id}`, updates);
      return data;
    },
    onSuccess: invalidate,
  });

  const desativar = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/solicitadores/${id}`);
      return data;
    },
    onSuccess: invalidate,
  });

  return { criar, editar, desativar };
}
