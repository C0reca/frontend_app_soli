import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface CabecalhoTemplate {
  id: number;
  nome: string;
  descricao?: string;
  conteudo_html: string;
  criado_em: string;
  atualizado_em: string;
}

export interface CabecalhoTemplateListItem {
  id: number;
  nome: string;
  descricao?: string;
  criado_em: string;
  atualizado_em: string;
}

export const useCabecalhoTemplates = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: cabecalhos = [],
    isLoading,
    error,
  } = useQuery<CabecalhoTemplateListItem[]>({
    queryKey: ['cabecalho-templates'],
    queryFn: async () => {
      const response = await api.get('/cabecalho-templates');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const createCabecalho = useMutation({
    mutationFn: async (data: { nome: string; descricao?: string; conteudo_html: string }) => {
      const response = await api.post('/cabecalho-templates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabecalho-templates'] });
      toast({ title: 'Sucesso', description: 'Cabeçalho criado com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar cabeçalho.', variant: 'destructive' });
    },
  });

  const updateCabecalho = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; nome?: string; descricao?: string; conteudo_html?: string }) => {
      const response = await api.put(`/cabecalho-templates/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabecalho-templates'] });
      toast({ title: 'Sucesso', description: 'Cabeçalho atualizado com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar cabeçalho.', variant: 'destructive' });
    },
  });

  const deleteCabecalho = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/cabecalho-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabecalho-templates'] });
      toast({ title: 'Sucesso', description: 'Cabeçalho eliminado com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao eliminar cabeçalho.', variant: 'destructive' });
    },
  });

  return {
    cabecalhos,
    isLoading,
    error,
    createCabecalho,
    updateCabecalho,
    deleteCabecalho,
  };
};

export const useCabecalhoTemplate = (id: number | null) => {
  return useQuery<CabecalhoTemplate>({
    queryKey: ['cabecalho-templates', id],
    queryFn: async () => {
      const response = await api.get(`/cabecalho-templates/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
};
