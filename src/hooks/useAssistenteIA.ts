import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface MensagemChat {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  criado_em?: string;
}

export interface ConversaIA {
  id: number;
  titulo: string;
  processo_id: number | null;
  cliente_id: number | null;
  criado_em: string;
  atualizado_em: string;
  num_mensagens?: number;
  mensagens?: MensagemChat[];
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

export function useConversasIA(processoId?: number, clienteId?: number) {
  return useQuery({
    queryKey: ['conversas-ia', processoId, clienteId],
    queryFn: async () => {
      const params: Record<string, number> = {};
      if (processoId) params.processo_id = processoId;
      if (clienteId) params.cliente_id = clienteId;
      const { data } = await api.get('/assistente-ia/conversas', { params });
      return data as ConversaIA[];
    },
    staleTime: 30_000,
  });
}

export function useConversaIA(conversaId: number | null) {
  return useQuery({
    queryKey: ['conversa-ia', conversaId],
    queryFn: async () => {
      const { data } = await api.get(`/assistente-ia/conversas/${conversaId}`);
      return data as ConversaIA;
    },
    enabled: !!conversaId,
    staleTime: 10_000,
  });
}

export function useConversaIAMutations() {
  const qc = useQueryClient();

  const criar = useMutation({
    mutationFn: async (req: { titulo?: string; processo_id?: number; cliente_id?: number }) => {
      const { data } = await api.post('/assistente-ia/conversas', req);
      return data as ConversaIA;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversas-ia'] }),
  });

  const renomear = useMutation({
    mutationFn: async ({ id, titulo }: { id: number; titulo: string }) => {
      const { data } = await api.put(`/assistente-ia/conversas/${id}`, { titulo });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversas-ia'] }),
  });

  const apagar = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/assistente-ia/conversas/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversas-ia'] }),
  });

  return { criar, renomear, apagar };
}

export function useIAChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: { mensagem: string; processo_id?: number; cliente_id?: number; historico?: MensagemChat[]; conversa_id?: number }) => {
      const { data } = await api.post('/assistente-ia/chat', req);
      return data as { resposta: string; conversa_id: number | null };
    },
    onSuccess: (_data, vars) => {
      if (vars.conversa_id) {
        qc.invalidateQueries({ queryKey: ['conversa-ia', vars.conversa_id] });
        qc.invalidateQueries({ queryKey: ['conversas-ia'] });
      }
    },
  });
}

export interface TarefaSugerida {
  titulo: string;
  descricao?: string;
  prioridade?: 'baixa' | 'media' | 'alta';
}

export interface SugestoesResult {
  proximos_passos?: string[];
  documentos_em_falta?: string[];
  tarefas_sugeridas?: (string | TarefaSugerida)[];
  alertas?: string[];
  estimativa_conclusao?: string;
  resposta_texto?: string;
}

export function useIASugestoes() {
  return useMutation({
    mutationFn: async (processo_id: number) => {
      const { data } = await api.post('/assistente-ia/sugestoes', { processo_id });
      return data as SugestoesResult;
    },
  });
}

export function useCriarTarefasIA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: { processo_id: number; cliente_id?: number; tarefas: TarefaSugerida[] }) => {
      const { data } = await api.post('/assistente-ia/criar-tarefas', req);
      return data as { criadas: { id: number; titulo: string }[]; total: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
