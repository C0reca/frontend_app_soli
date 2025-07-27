
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface DashboardKPIs {
  totalClients: number;
  activeProcesses: number;
  completedTasks: number;
  pendingTasks: number;
  activeTemplates: number;
  processCompletionRate: number;
}

export const useDashboard = () => {
  const {
    data: kpis,
    isLoading,
    error
  } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      // Mock data for development
      const { mockDashboardKPIs } = await import('@/data/mockData');
      return mockDashboardKPIs;
    },
  });

  return {
    kpis,
    isLoading,
    error,
  };
};
