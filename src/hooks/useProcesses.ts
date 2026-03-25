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
  titular_id?: number;
  titular?: {
    id: number;
    nome: string;
  };
  tipo_processo_id?: number;
  tipo_processo?: {
    id: number;
    nome: string;
  };
  parent_processo_id?: number;
  subprocessos?: { id: number; titulo: string; estado?: string }[];
  privado?: boolean;
  autorizados?: { id: number; nome: string }[];
  valor?: number | null;
  estado_workflow?: string | null;
  entidades_secundarias?: {
    id: number;
    cliente_id?: number;
    entidade_externa_id?: number;
    tipo_participacao?: string;
    nome?: string;
  }[];
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
    mutationFn: async (process: {
      titulo: string;
      descricao?: string;
      tipo?: string;
      onde_estao?: string;
      cliente_id?: number;
      dossie_id?: number;
      funcionario_id?: number;
      titular_id?: number | null;
      tipo_processo_id?: number | null;
      parent_processo_id?: number | null;
      estado: 'pendente' | 'em_curso' | 'concluido';
      valor?: number | null;
      campos_personalizados?: Record<string, any>;
    }) => {
      const response = await api.post('/processos', process);
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({
        title: "Processo criado",
        description: data?.referencia ? `Ref: ${data.referencia} — ${data.titulo || ''}` : "O processo foi criado com sucesso.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || 
                          error?.response?.data?.message || 
                          error?.message || 
                          "Erro ao criar processo.";
      toast({
        title: "Erro ao criar processo",
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
        title: "Processo atualizado",
        description: "As alterações foram guardadas.",
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
        title: "Erro ao atualizar processo",
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
        title: "Processo arquivado",
        description: "O processo foi movido para arquivo.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao arquivar processo",
        description: "Não foi possível arquivar o processo.",
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
      toast({ title: 'Processo restaurado', description: 'O processo foi desarquivado com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro ao desarquivar processo', description: 'Não foi possível restaurar o processo.', variant: 'destructive' });
    }
  });

  const duplicateProcess = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/processos/${id}/duplicar`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({ title: 'Processo duplicado', description: 'A cópia do processo foi criada.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail ?? 'Erro ao duplicar processo.';
      toast({ title: 'Erro ao duplicar processo', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  const updateProcessVisibility = useMutation({
    mutationFn: async ({ processoId, privado, autorizados_ids }: { processoId: number; privado: boolean; autorizados_ids?: number[] }) => {
      const res = await api.put(`/processos/${processoId}/visibilidade`, { privado, autorizados_ids: autorizados_ids ?? [] });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      queryClient.invalidateQueries({ queryKey: ['processo', variables.processoId] });
      toast({ title: 'Visibilidade atualizada', description: 'As permissões de acesso ao processo foram alteradas.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail ?? 'Erro ao atualizar visibilidade.';
      toast({ title: 'Erro ao alterar visibilidade', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  return {
    processes,
    isLoading,
    error,
    createProcess,
    updateProcess,
    duplicateProcess,
    updateProcessVisibility,
    deleteProcess,
    getArchived,
    unarchiveProcess,
  };
};