import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface ChangelogEntry {
  id: number;
  versao: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  data_lancamento: string;
  publicado: boolean;
  criado_por_nome: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface ChangelogEntryCreateData {
  versao: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  data_lancamento?: string;
  publicado?: boolean;
}

export interface ChangelogEntryUpdateData {
  versao?: string;
  tipo?: string;
  titulo?: string;
  descricao?: string;
  data_lancamento?: string;
  publicado?: boolean;
}

export function useChangelog() {
  return useQuery<ChangelogEntry[]>({
    queryKey: ['changelog'],
    queryFn: async () => {
      const { data } = await api.get('/changelog');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useChangelogNaoLidas() {
  return useQuery<{ nao_lidas: number }>({
    queryKey: ['changelog-nao-lidas'],
    queryFn: async () => {
      const { data } = await api.get('/changelog/nao-lidas');
      return data;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useChangelogMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createEntry = useMutation({
    mutationFn: async (payload: ChangelogEntryCreateData) => {
      const { data } = await api.post('/changelog', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelog'] });
      queryClient.invalidateQueries({ queryKey: ['changelog-nao-lidas'] });
      toast({ title: 'Entrada criada com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar entrada', variant: 'destructive' });
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ChangelogEntryUpdateData }) => {
      const { data } = await api.put(`/changelog/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelog'] });
      toast({ title: 'Entrada atualizada' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar entrada', variant: 'destructive' });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/changelog/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelog'] });
      queryClient.invalidateQueries({ queryKey: ['changelog-nao-lidas'] });
      toast({ title: 'Entrada apagada' });
    },
    onError: () => {
      toast({ title: 'Erro ao apagar entrada', variant: 'destructive' });
    },
  });

  const marcarLidas = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/changelog/marcar-lidas');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelog-nao-lidas'] });
    },
  });

  return { createEntry, updateEntry, deleteEntry, marcarLidas };
}
