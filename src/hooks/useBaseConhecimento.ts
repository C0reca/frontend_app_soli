import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

// ── Types ──────────────────────────────────────────────

export interface Pasta {
  id: number;
  nome: string;
  parent_id: number | null;
  criado_em: string;
  criado_por: number;
}

export interface Nota {
  id: number;
  titulo: string;
  conteudo: string;
  pasta_id: number | null;
  criado_em: string;
  atualizado_em: string;
  criado_por: number;
}

// ── Hook ───────────────────────────────────────────────

export const useBaseConhecimento = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ── Pastas ─────────────────────────────────────────

  const { data: pastas = [], isLoading: isLoadingPastas } = useQuery<Pasta[]>({
    queryKey: ['base-conhecimento', 'pastas'],
    queryFn: async () => {
      const res = await api.get('/base-conhecimento/pastas');
      return res.data;
    },
  });

  const criarPasta = useMutation({
    mutationFn: async (data: { nome: string; parent_id?: number | null }) => {
      const res = await api.post('/base-conhecimento/pastas', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-conhecimento', 'pastas'] });
      toast({ title: 'Pasta criada com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar pasta', variant: 'destructive' });
    },
  });

  const atualizarPasta = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; nome?: string; parent_id?: number | null }) => {
      const res = await api.put(`/base-conhecimento/pastas/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-conhecimento', 'pastas'] });
      toast({ title: 'Pasta atualizada' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar pasta', variant: 'destructive' });
    },
  });

  const apagarPasta = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/base-conhecimento/pastas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-conhecimento'] });
      toast({ title: 'Pasta apagada' });
    },
    onError: () => {
      toast({ title: 'Erro ao apagar pasta', variant: 'destructive' });
    },
  });

  // ── Notas ──────────────────────────────────────────

  const useNotas = (pastaId?: number | null) => {
    return useQuery<Nota[]>({
      queryKey: ['base-conhecimento', 'notas', pastaId ?? 'all'],
      queryFn: async () => {
        const url = pastaId != null
          ? `/base-conhecimento/notas?pasta_id=${pastaId}`
          : '/base-conhecimento/notas';
        const res = await api.get(url);
        return res.data;
      },
    });
  };

  const useNota = (id: number | null) => {
    return useQuery<Nota>({
      queryKey: ['base-conhecimento', 'nota', id],
      queryFn: async () => {
        const res = await api.get(`/base-conhecimento/notas/${id}`);
        return res.data;
      },
      enabled: id != null,
    });
  };

  const criarNota = useMutation({
    mutationFn: async (data: { titulo: string; conteudo?: string; pasta_id?: number | null }) => {
      const res = await api.post('/base-conhecimento/notas', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-conhecimento', 'notas'] });
      toast({ title: 'Nota criada com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro ao criar nota', variant: 'destructive' });
    },
  });

  const atualizarNota = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; titulo?: string; conteudo?: string; pasta_id?: number | null }) => {
      const res = await api.put(`/base-conhecimento/notas/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['base-conhecimento', 'notas'] });
      queryClient.invalidateQueries({ queryKey: ['base-conhecimento', 'nota', variables.id] });
      toast({ title: 'Nota guardada' });
    },
    onError: () => {
      toast({ title: 'Erro ao guardar nota', variant: 'destructive' });
    },
  });

  const apagarNota = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/base-conhecimento/notas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['base-conhecimento'] });
      toast({ title: 'Nota apagada' });
    },
    onError: () => {
      toast({ title: 'Erro ao apagar nota', variant: 'destructive' });
    },
  });

  return {
    pastas,
    isLoadingPastas,
    criarPasta,
    atualizarPasta,
    apagarPasta,
    useNotas,
    useNota,
    criarNota,
    atualizarNota,
    apagarNota,
  };
};
