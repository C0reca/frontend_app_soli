import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';

export interface MensagemChat {
  role: 'user' | 'assistant';
  content: string;
}

export function useIAStatus() {
  return useQuery({
    queryKey: ['ia-status'],
    queryFn: async () => {
      const { data } = await api.get('/assistente-ia/status');
      return data as { habilitada: boolean; provider: string | null; modelo: string | null };
    },
    staleTime: 60_000 * 10,
  });
}

export function useIAChat() {
  return useMutation({
    mutationFn: async (req: { mensagem: string; processo_id?: number; cliente_id?: number; historico?: MensagemChat[] }) => {
      const { data } = await api.post('/assistente-ia/chat', req);
      return data as { resposta: string };
    },
  });
}

export function useIASugestoes() {
  return useMutation({
    mutationFn: async (processo_id: number) => {
      const { data } = await api.post('/assistente-ia/sugestoes', { processo_id });
      return data as {
        proximos_passos?: string[];
        documentos_em_falta?: string[];
        tarefas_sugeridas?: string[];
        alertas?: string[];
        estimativa_conclusao?: string;
        resposta_texto?: string;
      };
    },
  });
}
