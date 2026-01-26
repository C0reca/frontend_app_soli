import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface IRSTimelineEntry {
  id: number;
  irs_id: number;
  funcionario_id?: number;
  acao: string;
  campo_alterado?: string;
  valor_anterior?: string;
  valor_novo?: string;
  detalhes?: string;
  data_hora: string;
  funcionario?: {
    id: number;
    nome?: string;
    email?: string;
  };
}

export const useIRSTimeline = (irsId: number | undefined) => {
  return useQuery({
    queryKey: ['irs-timeline', irsId],
    queryFn: async () => {
      if (!irsId) return [];
      const response = await api.get(`/irs/${irsId}/historico`);
      return response.data as IRSTimelineEntry[];
    },
    enabled: !!irsId,
  });
};
