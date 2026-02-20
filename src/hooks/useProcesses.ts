import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface Process {
  id: number;
  titulo: string;
  descricao?: string;
  tipo?: string;
  onde_estao?: string;
  estado: 'pendente' | 'em_curso' | 'concluido';
  criado_em: string;
  cliente_id?: number; // Mantido para compatibilidade
  dossie_id?: number; // Nova relação com dossiê
  numero_no_dossie?: number;
  referencia?: string;
  funcionario_id?: number;
  arquivado?: boolean;
  cliente?: {
    id: number;
    nome: string;
  };
  dossie?: {
    id: number;
    nome?: string;
    numero?: string;
    entidade?: { nome?: string; nome_empresa?: string };
  };
  funcionario?: {
    id: number;
    nome: string;
  };
  privado?: boolean;
  autorizados?: { id: number; nome: string }[];
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
    mutationFn: async (process: { titulo: string; descricao?: string; tipo?: string; onde_estao?: string; cliente_id?: number; dossie_id?: number; funcionario_id?: number; estado: 'pendente' | 'em_curso' | 'concluido' }) => {
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
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || 
                          error?.response?.data?.message || 
                          error?.message || 
                          "Erro ao criar processo.";
      toast({
        title: "Erro",
        description: errorMessage,
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
    onError: (error: any) => {
      let errorMessage = "Erro ao atualizar processo.";
      
      if (error?.response?.data) {
        // Se for um array de erros de validação do Pydantic
        if (Array.isArray(error.response.data)) {
          const errors = error.response.data.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ');
          errorMessage = errors || errorMessage;
        } else if (error.response.data.detail) {
          // Se for uma string ou objeto com detail
          const detail = error.response.data.detail;
          errorMessage = typeof detail === 'string' ? detail : JSON.stringify(detail);
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteProcess = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/processos/${id}/arquivar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({
        title: "Sucesso",
        description: "Processo arquivado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao arquivar processo.",
        variant: "destructive",
      });
    },
  });

  const getArchived = async (): Promise<Process[]> => {
    const res = await api.get('/processos/arquivados');
    return res.data;
  };

  const unarchiveProcess = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.patch(`/processos/${id}/desarquivar`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({ title: 'Sucesso', description: 'Processo desarquivado.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao desarquivar processo.', variant: 'destructive' });
    }
  });

  const updateProcessVisibility = useMutation({
    mutationFn: async ({ processoId, privado, autorizados_ids }: { processoId: number; privado: boolean; autorizados_ids?: number[] }) => {
      const res = await api.put(`/processos/${processoId}/visibilidade`, { privado, autorizados_ids: autorizados_ids ?? [] });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      queryClient.invalidateQueries({ queryKey: ['processo', variables.processoId] });
      toast({ title: 'Sucesso', description: 'Visibilidade do processo atualizada.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail ?? 'Erro ao atualizar visibilidade.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  return {
    processes,
    isLoading,
    error,
    createProcess,
    updateProcess,
    updateProcessVisibility,
    deleteProcess,
    getArchived,
    unarchiveProcess,
  };
};