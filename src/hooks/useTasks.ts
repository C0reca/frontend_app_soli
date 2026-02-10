import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  titulo: string;
  descricao: string;
  processo_id: number | null;
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
  onde_estao?: string | null;
}

const DEFAULT_PAGE_SIZE = 25;
const LIMIT_FULL = 2000;

export interface UseTasksOptions {
  skip?: number;
  limit?: number;
  search?: string;
}

export const useTasks = (options: UseTasksOptions = {}) => {
  const { skip = 0, limit = LIMIT_FULL, search } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: rawData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['tasks', skip, limit, search ?? ''],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
        if (search != null && search.trim()) params.set('search', search.trim());
        const response = await api.get(`/tarefas/with_counts?${params.toString()}`);
        const data = response?.data;
        if (data && typeof data === 'object' && 'items' in data) {
          const items = Array.isArray((data as { items?: unknown }).items) ? (data as { items: Task[] }).items : [];
          const total = typeof (data as { total?: number }).total === 'number' ? (data as { total: number }).total : items.length;
          return { items, total };
        }
        if (Array.isArray(data)) return { items: data, total: data.length };
        return { items: [], total: 0 };
      } catch (e) {
        try {
          const fallback = await api.get('/tarefas');
          const arr = Array.isArray(fallback?.data) ? fallback.data : [];
          return { items: arr, total: arr.length };
        } catch {
          return { items: [], total: 0 };
        }
      }
    },
  });
  const tasks = Array.isArray(rawData?.items) ? rawData.items : [];
  const tasksTotal = typeof rawData?.total === 'number' ? rawData.total : tasks.length;

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

  const generateTaskPDF = async (taskId: string) => {
    try {
      const response = await api.get(`/tarefas/${taskId}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tarefa_${taskId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "PDF gerado e download iniciado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.response?.data?.detail || "Erro ao gerar PDF da tarefa.",
        variant: "destructive",
      });
    }
  };

  return {
    tasks,
    tasksTotal,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    setExternal,
    getTasksByProcess,
    generateTaskPDF,
  };
};