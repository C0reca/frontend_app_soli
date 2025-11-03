
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface DashboardResponse {
  total_processos: number;
  ativos: number;
  concluidos: number;
  total_clientes: number;
  tarefas_concluidas: number;
  tarefas_pendentes: number;
  por_tipo: Record<string, number>;
  por_estado: Record<string, number>;
  por_funcionario: Record<string, number>;
  evolucao_mensal: { ano: number; mes: number; total: number; label: string }[];
}

export const useDashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async (): Promise<DashboardResponse> => {
      const res = await api.get('/dashboard/kpis');
      return res.data;
    },
  });

  return {
    kpis: data,
    isLoading,
    error,
  };
};
