import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface AgregadoFamiliar {
  id: number;
  cliente_id: number;
  cliente_relacionado_id: number;
  tipo_relacao: 'conjuge' | 'filho' | 'filha' | 'pai' | 'mae' | 'irmao' | 'irma';
  criado_em: string;
  atualizado_em: string;
  cliente_relacionado?: {
    id: number;
    nome?: string;
    nome_empresa?: string;
    nif?: string;
    nif_empresa?: string;
    data_nascimento?: string;
    tipo?: string;
    senha_financas?: string;
  };
}

export interface AgregadoFamiliarCreate {
  cliente_id: number;
  cliente_relacionado_id: number;
  tipo_relacao: 'conjuge' | 'filho' | 'filha' | 'pai' | 'mae' | 'irmao' | 'irma';
}

export interface AgregadoFamiliarUpdate {
  tipo_relacao?: 'conjuge' | 'filho' | 'filha' | 'pai' | 'mae' | 'irmao' | 'irma';
}

export const useAgregadoFamiliar = (clienteId?: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: agregado = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['agregado-familiar', clienteId],
    queryFn: async () => {
      if (!clienteId) return [];
      const response = await api.get(`/agregado-familiar/cliente/${clienteId}`);
      return response.data as AgregadoFamiliar[];
    },
    enabled: !!clienteId,
  });

  const createRelacao = useMutation({
    mutationFn: async (data: AgregadoFamiliarCreate) => {
      const response = await api.post('/agregado-familiar', data);
      return response.data as AgregadoFamiliar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agregado-familiar'] });
      toast({
        title: 'Sucesso',
        description: 'Relação adicionada ao agregado familiar.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao adicionar relação.',
        variant: 'destructive',
      });
    },
  });

  const updateRelacao = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AgregadoFamiliarUpdate }) => {
      const response = await api.put(`/agregado-familiar/${id}`, data);
      return response.data as AgregadoFamiliar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agregado-familiar'] });
      toast({
        title: 'Sucesso',
        description: 'Relação atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao atualizar relação.',
        variant: 'destructive',
      });
    },
  });

  const deleteRelacao = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/agregado-familiar/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agregado-familiar'] });
      toast({
        title: 'Sucesso',
        description: 'Relação eliminada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao eliminar relação.',
        variant: 'destructive',
      });
    },
  });

  return {
    agregado,
    isLoading,
    error,
    createRelacao,
    updateRelacao,
    deleteRelacao,
  };
};
