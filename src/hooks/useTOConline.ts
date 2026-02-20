import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type { TOConlineConfig } from '@/types/financeiro';

export const useTOConlineConfig = () => {
  return useQuery<TOConlineConfig>({
    queryKey: ['toconline', 'config'],
    queryFn: async () => {
      const response = await api.get('/toconline/config');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
