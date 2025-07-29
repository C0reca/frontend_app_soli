import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface Process {
  id: number;
  titulo: string;
  descricao?: string;
  tipo?: string;
  estado: 'pendente' | 'em_curso' | 'concluido';
  criado_em: string;
  cliente_id: number;
  funcionario_id?: number;
  cliente?: {
    id: number;
    nome: string;
  };
  funcionario?: {
    id: number;
    nome: string;
  };
}

export const useProcesses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: processes = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['processes'],
    queryFn: async () => {
      const response = await api.get('/processos');
      return response.data;
    },
  });

  const createProcess = useMutation({
    mutationFn: async (process: { titulo: string; descricao?: string; tipo?: string; cliente_id: number; funcionario_id?: number; estado: 'pendente' | 'em_curso' | 'concluido' }) => {
      const response = await api.post('/processos', process);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({
        title: "Sucesso",
        description: "Processo criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar processo.",
        variant: "destructive",
      });
    },
  });

  const updateProcess = useMutation({
    mutationFn: async ({ id, ...process }: Partial<Process> & { id: number }) => {
      const response = await api.put(`/processos/${id}`, process);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({
        title: "Sucesso",
        description: "Processo atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar processo.",
        variant: "destructive",
      });
    },
  });

  const deleteProcess = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/processos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({
        title: "Sucesso",
        description: "Processo excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir processo.",
        variant: "destructive",
      });
    },
  });

  return {
    processes,
    isLoading,
    error,
    createProcess,
    updateProcess,
    deleteProcess,
  };
};