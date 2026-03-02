import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface StandSemana {
  id: number;
  stand_entidade_id: number;
  semana_inicio: string;
  semana_fim: string;
  estado: string;
  total?: number;
  data_fecho?: string;
  observacoes?: string;
  data_criacao?: string;
  stand_entidade?: { id: number; nome: string };
  registos?: any[];
  registos_count?: number;
}

export const useStandSemanas = (params?: {
  stand_entidade_id?: number;
  estado?: string;
}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: semanas = [], isLoading, error } = useQuery({
    queryKey: ['stand-semanas', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.stand_entidade_id) queryParams.set('stand_entidade_id', params.stand_entidade_id.toString());
      if (params?.estado) queryParams.set('estado', params.estado);
      const qs = queryParams.toString();
      const response = await api.get(`/stand-semanas${qs ? `?${qs}` : ''}`);
      return response.data || [];
    },
  });

  const createSemana = useMutation({
    mutationFn: async (semana: Partial<StandSemana>) => {
      const response = await api.post('/stand-semanas', semana);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stand-semanas'] });
      toast({ title: "Sucesso", description: "Semana criada com sucesso." });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail || "Erro ao criar semana.";
      toast({ title: "Erro", description: detail, variant: "destructive" });
    },
  });

  const fecharSemana = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.put(`/stand-semanas/${id}/fechar`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stand-semanas'] });
      queryClient.invalidateQueries({ queryKey: ['registos-automoveis'] });
      toast({ title: "Sucesso", description: "Semana fechada com sucesso. Todos os registos foram marcados como pagos." });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail || "Erro ao fechar semana.";
      toast({ title: "Erro", description: detail, variant: "destructive" });
    },
  });

  const deleteSemana = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/stand-semanas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stand-semanas'] });
      toast({ title: "Sucesso", description: "Semana eliminada com sucesso." });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail || "Erro ao eliminar semana.";
      toast({ title: "Erro", description: detail, variant: "destructive" });
    },
  });

  return {
    semanas,
    isLoading,
    error,
    createSemana,
    fecharSemana,
    deleteSemana,
  };
};

export const useStandSemanaDetails = (id?: number) => {
  return useQuery({
    queryKey: ['stand-semana', id],
    queryFn: async () => {
      const response = await api.get(`/stand-semanas/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};
