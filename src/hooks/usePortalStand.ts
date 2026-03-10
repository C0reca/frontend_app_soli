import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// --- Admin hooks (manage stand users from backoffice) ---

export interface StandUser {
  id: number;
  stand_entidade_id: number;
  nome: string;
  email: string;
  ativo: boolean;
  stand_nome?: string;
  last_login?: string;
  criado_em?: string;
}

export function useStandUsers() {
  return useQuery<StandUser[]>({
    queryKey: ['stand-users'],
    queryFn: async () => {
      const { data } = await api.get('/portal-stand/admin/users');
      return data;
    },
  });
}

export function useStandUserMutations() {
  const qc = useQueryClient();

  const criar = useMutation({
    mutationFn: async (dados: { stand_entidade_id: number; nome: string; email: string; password: string }) => {
      const { data } = await api.post('/portal-stand/admin/users', dados);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stand-users'] }),
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, ...dados }: { id: number; nome?: string; email?: string; password?: string; ativo?: boolean }) => {
      const { data } = await api.put(`/portal-stand/admin/users/${id}`, dados);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stand-users'] }),
  });

  const apagar = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/portal-stand/admin/users/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stand-users'] }),
  });

  return { criar, atualizar, apagar };
}
