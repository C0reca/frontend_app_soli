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
}

const DEFAULT_PAGE_SIZE = 25;
/** Limite alto para listagens que precisam de muitos itens (ex.: dropdowns noutras páginas) */
const DEFAULT_LIMIT_FULL = 500;

export interface UseProcessesOptions {
  skip?: number;
  limit?: number;
  search?: string;
}

export const useProcesses = (options: UseProcessesOptions = {}) => {
  const { skip = 0, limit = DEFAULT_LIMIT_FULL, search } = options;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: rawData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['processes', skip, limit, search ?? ''],
    queryFn: async () => {
      const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
      if (search != null && search.trim()) params.set('search', search.trim());
      const response = await api.get(`/processos?${params.toString()}`);
      const data = response?.data;
      if (data && typeof data === 'object' && 'items' in data) {
        return { items: (data as { items: Process[] }).items ?? [], total: (data as { total?: number }).total ?? 0 };
      }
      if (Array.isArray(data)) return { items: data, total: data.length };
      return { items: [], total: 0 };
    },
  });
  const processes = Array.isArray(rawData?.items) ? rawData.items : [];
  const processesTotal = typeof rawData?.total === 'number' ? rawData.total : processes.length;

  const createProcess = useMutation({
    mutationFn: async (process: { titulo: string; descricao?: string; tipo?: string; cliente_id?: number; dossie_id?: number; funcionario_id?: number; estado: 'pendente' | 'em_curso' | 'concluido' }) => {
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

  return {
    processes,
    processesTotal,
    isLoading,
    error,
    createProcess,
    updateProcess,
    deleteProcess,
    getArchived,
    unarchiveProcess,
  };
};