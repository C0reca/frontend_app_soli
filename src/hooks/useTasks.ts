import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  titulo: string;
  descricao: string;
  processo_id: number;
  responsavel_id: number | null;
  prioridade: 'baixa' | 'media' | 'alta' | null;
  concluida: boolean;
  data_fim: string | null;
  criado_em: string;
}

export const useTasks = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: tasks = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.get('/tarefas');
      return response.data;
    },
  });

  const createTask = useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'criado_em'>) => {
      const response = await api.post('/tarefas', task);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa.",
        variant: "destructive",
      });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...task }: Partial<Task> & { id: string }) => {
      const response = await api.put(`/tarefas/${id}`, task);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Sucesso",
        description: "Tarefa atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa.",
        variant: "destructive",
      });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tarefas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Sucesso",
        description: "Tarefa excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir tarefa.",
        variant: "destructive",
      });
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ id, concluida }: { id: string; concluida: boolean }) => {
      const response = await api.patch(`/tarefas/${id}/status`, { concluida });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Sucesso",
        description: "Status da tarefa atualizado.",
      });
    },
  });

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
  };
};