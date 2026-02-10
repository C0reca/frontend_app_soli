import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface LogProcesso {
  id: number;
  processo_id: number;
  funcionario_id: number | null;
  tipo: 'criacao' | 'alteracao' | 'tarefa_criada' | 'tarefa_concluida' | 'estado_alterado' | 'telefone' | 'reuniao' | 'email' | 'documento' | 'observacao';
  titulo: string;
  descricao: string | null;
  data_hora: string;
  dados_extras: string | null;
  funcionario_nome: string | null;
  is_automatico: boolean;
  tarefa_id?: number;
}

export interface LogProcessoCreate {
  processo_id: number;
  funcionario_id?: number | null;
  tipo: LogProcesso['tipo'];
  titulo: string;
  descricao?: string | null;
  dados_extras?: string | null;
}

export const useLogsProcesso = (processoId?: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: logs = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['logs-processo', processoId],
    queryFn: async () => {
      if (!processoId) return [];
      const response = await api.get(`/logs-processo/processo/${processoId}`);
      return response.data;
    },
    enabled: !!processoId,
  });

  const createLog = useMutation({
    mutationFn: async (logData: LogProcessoCreate) => {
      const response = await api.post('/logs-processo/', logData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs-processo'] });
      toast({
        title: "Sucesso",
        description: "Log criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar log.",
        variant: "destructive",
      });
    },
  });

  const updateLog = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<LogProcessoCreate> }) => {
      const response = await api.put(`/logs-processo/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs-processo'] });
      toast({
        title: "Sucesso",
        description: "Log atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar log.",
        variant: "destructive",
      });
    },
  });

  const deleteLog = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/logs-processo/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs-processo'] });
      toast({
        title: "Sucesso",
        description: "Log excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir log.",
        variant: "destructive",
      });
    },
  });

  const getTiposLog = useQuery({
    queryKey: ['tipos-log'],
    queryFn: async () => {
      const response = await api.get('/logs-processo/tipos/');
      return response.data;
    },
  });

  return {
    logs,
    isLoading,
    error,
    createLog,
    updateLog,
    deleteLog,
    getTiposLog,
  };
};
