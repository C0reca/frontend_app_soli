import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface PermissaoModulo {
  id: number;
  funcionario_id: number;
  modulo: string;
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
}

export interface FuncionarioPermissoes {
  funcionario_id: number;
  funcionario_nome?: string;
  permissoes: PermissaoModulo[];
}

export interface PermissaoModuloItem {
  modulo: string;
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
}

export function useMyPermissions() {
  return useQuery<FuncionarioPermissoes>({
    queryKey: ['permissoes', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/permissoes/modulos/me');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserPermissions(funcionarioId: number | null) {
  return useQuery<FuncionarioPermissoes>({
    queryKey: ['permissoes', 'user', funcionarioId],
    queryFn: async () => {
      const { data } = await api.get(`/permissoes/modulos/${funcionarioId}`);
      return data;
    },
    enabled: !!funcionarioId,
    staleTime: 60 * 1000,
  });
}

export function useUpdatePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ funcionarioId, permissoes }: { funcionarioId: number; permissoes: PermissaoModuloItem[] }) => {
      const { data } = await api.put(`/permissoes/modulos/${funcionarioId}`, { permissoes });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permissoes', 'user', variables.funcionarioId] });
      queryClient.invalidateQueries({ queryKey: ['permissoes', 'me'] });
    },
  });
}

// ── Restrições de processos por funcionário (processo, tipo, entidade) ──

export interface RestricaoProcessosResponse {
  funcionario_id: number;
  processo_ids: number[];
  tipo_processos: string[];
  entidade_ids: number[];
}

export function useUserProcessRestrictions(funcionarioId: number | null) {
  return useQuery<RestricaoProcessosResponse>({
    queryKey: ['permissoes', 'processos', funcionarioId],
    queryFn: async () => {
      const { data } = await api.get(`/permissoes/processos/${funcionarioId}`);
      return data;
    },
    enabled: !!funcionarioId,
    staleTime: 60 * 1000,
  });
}

export function useUpdateProcessRestrictions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      funcionarioId,
      processoIds,
      tipoProcessos,
      entidadeIds,
    }: {
      funcionarioId: number;
      processoIds: number[];
      tipoProcessos: string[];
      entidadeIds: number[];
    }) => {
      const { data } = await api.put(`/permissoes/processos/${funcionarioId}`, {
        processo_ids: processoIds,
        tipo_processos: tipoProcessos,
        entidade_ids: entidadeIds,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['permissoes', 'processos', variables.funcionarioId] });
    },
  });
}

export function useDeleteProcessRestrictions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (funcionarioId: number) => {
      const { data } = await api.delete(`/permissoes/processos/${funcionarioId}`);
      return data;
    },
    onSuccess: (_data, funcionarioId) => {
      queryClient.invalidateQueries({ queryKey: ['permissoes', 'processos', funcionarioId] });
    },
  });
}
