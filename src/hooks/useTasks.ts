import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface Adiamento {
  id: number;
  tarefa_id: number;
  data_anterior: string | null;
  data_nova: string;
  motivo: string | null;
  criado_em: string;
}

export interface Task {
  id: string;
  titulo: string;
  descricao: string;
  cliente_id?: number | null;
  processo_id: number | null;
  responsavel_id: number | null;
  autor_id?: number | null;
  prioridade: 'baixa' | 'media' | 'alta' | null;
  concluida: boolean;
  notas_conclusao?: string | null;
  motivo_adiamento?: string | null;
  data_antes_adiamento?: string | null;
  servico_externo?: boolean;
  data_fim: string | null;
  criado_em: string;
  tipo?: 'reuniao' | 'telefonema' | 'tarefa' | 'correspondencia_ctt' | null;
  parent_id?: number | null;
  subtarefas_count?: number;
  onde_estao?: string | null;
  custo?: number | null;
  despesa_criada?: boolean;
  adiamentos?: Adiamento[];
}

function formatApiErrorDetail(detail: unknown, fallback: string): string {
  if (Array.isArray(detail)) {
    return detail.map((e: { msg?: string }) => e?.msg || JSON.stringify(e)).join(" ") || fallback;
  }
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "msg" in detail) return (detail as { msg: string }).msg;
  return fallback;
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
      toast({
        title: "Erro",
        description: formatApiErrorDetail(error?.response?.data?.detail, "Erro ao criar tarefa."),
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
      toast({
        title: "Erro",
        description: formatApiErrorDetail(error?.response?.data?.detail, "Erro ao atualizar tarefa."),
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
    mutationFn: async ({ id, concluida, notas_conclusao }: { id: string; concluida: boolean; notas_conclusao?: string }) => {
      const payload: { concluida: boolean; notas_conclusao?: string } = { concluida };
      if (notas_conclusao != null && notas_conclusao.trim() !== '') payload.notas_conclusao = notas_conclusao.trim();
      const response = await api.patch(`/tarefas/status/${id}`, payload);
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
      toast({
        title: "Não foi possível concluir",
        description: formatApiErrorDetail(error?.response?.data?.detail, "Erro ao atualizar status da tarefa."),
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
        description: variables.servico_externo ? 'Movido para Diligência Externa.' : 'Removido de Diligência Externa.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: formatApiErrorDetail(error?.response?.data?.detail, 'Erro ao mover para Diligência Externa.'),
        variant: 'destructive',
      });
    }
  });

  const criarDespesa = useMutation({
    mutationFn: async (tarefaId: string | number) => {
      const response = await api.post(`/tarefas/${tarefaId}/criar-despesa`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['conta-corrente'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] });
      toast({
        title: "Sucesso",
        description: "Despesa criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: formatApiErrorDetail(error?.response?.data?.detail, "Erro ao criar despesa."),
        variant: "destructive",
      });
    },
  });

  const getTasksByProcess = useCallback(async (processoId: number) => {
    const response = await api.get(`/tarefas/processo/${processoId}`);
    return response.data;
  }, []);

  const getTaskById = useCallback(async (taskId: string): Promise<Task | null> => {
    try {
      const response = await api.get(`/tarefas/${taskId}`);
      return response.data;
    } catch {
      return null;
    }
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
        description: formatApiErrorDetail(error?.response?.data?.detail, "Erro ao gerar PDF da tarefa."),
        variant: "destructive",
      });
    }
  };

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    setExternal,
    criarDespesa,
    getTasksByProcess,
    getTaskById,
    generateTaskPDF,
  };
};