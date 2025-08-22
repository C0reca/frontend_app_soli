import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface RegistoPredial {
  id: string;
  numero_processo: string;
  cliente_id: number;
  predio: string;
  freguesia: string;
  registo: string;
  conservatoria: string;
  requisicao: string;
  apresentacao: string;
  data: string;
  apresentacao_complementar?: string;
  data_criacao: string;
  outras_observacoes?: string;
  estado: 'Concluído' | 'Desistência' | 'Recusado' | 'Provisórios';
  cliente?: {
    id: number;
    nome: string;
  };
}

export const useRegistosPrediais = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: registos = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['registos-prediais'],
    queryFn: async () => {
      const response = await api.get('/registos/');
      return response.data;
    },
  });

  const createRegisto = useMutation({
    mutationFn: async (registo: Omit<RegistoPredial, 'id' | 'data_criacao'>) => {
      const response = await api.post('/registos/', registo);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registos-prediais'] });
      toast({
        title: "Sucesso",
        description: "Registo predial criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar registo predial.",
        variant: "destructive",
      });
    },
  });

  const updateRegisto = useMutation({
    mutationFn: async ({ id, ...registo }: Partial<RegistoPredial> & { id: string }) => {
      const response = await api.put(`/registos/${id}`, registo);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registos-prediais'] });
      toast({
        title: "Sucesso",
        description: "Registo predial atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar registo predial.",
        variant: "destructive",
      });
    },
  });

  const deleteRegisto = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/registos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registos-prediais'] });
      toast({
        title: "Sucesso",
        description: "Registo predial excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir registo predial.",
        variant: "destructive",
      });
    },
  });

  return {
    registos,
    isLoading,
    error,
    createRegisto,
    updateRegisto,
    deleteRegisto,
  };
};