import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  titulo: string;
  descricao: string;
  processo_id: number;
  responsavel_id: number | null;
  autor_id?: number | null;
  prioridade: 'baixa' | 'media' | 'alta' | null;
  concluida: boolean;
  servico_externo?: boolean;
  data_fim: string | null;
  criado_em: string;
  tipo?: 'reuniao' | 'telefonema' | 'tarefa' | null;
  parent_id?: number | null;
  subtarefas_count?: number;
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
      try {
        const response = await api.get('/tarefas/with_counts');
        return response.data;
      } catch (e) {
        const fallback = await api.get('/tarefas');
        return fallback.data;
      }
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
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || "Erro ao criar tarefa.";
      toast({
        title: "Erro",
        description: errorMessage,
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
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || "Erro ao atualizar tarefa.";
      toast({
        title: "Erro",
        description: errorMessage,
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
      const response = await api.patch(`/tarefas/status/${id}`, { concluida });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: "Sucesso",
        description: "Status da tarefa atualizado.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || "Erro ao atualizar status da tarefa.";
      toast({
        title: "Não foi possível concluir",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const setExternal = useMutation({
    mutationFn: async ({ id, servico_externo }: { id: string; servico_externo: boolean }) => {
      const response = await api.patch(`/tarefas/externo/${id}`, { servico_externo });
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({
        title: 'Sucesso',
        description: variables.servico_externo ? 'Movido para Serviço Externo.' : 'Removido de Serviço Externo.',
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || 'Erro ao mover para Serviço Externo.';
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' });
    }
  });

  const getTasksByProcess = useCallback(async (processoId: number) => {
    const response = await api.get(`/tarefas/processo/${processoId}`);
    return response.data;
  }, []);

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    setExternal,
    getTasksByProcess,
  };
};