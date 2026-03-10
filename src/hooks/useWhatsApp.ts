import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface WhatsAppMensagem {
  id: number;
  wa_message_id?: string;
  processo_id?: number;
  cliente_id?: number;
  telefone_destino: string;
  direcao: string;
  tipo: string;
  template_nome?: string;
  conteudo?: string;
  estado: string;
  erro_detalhe?: string;
  enviado_por_id?: number;
  criado_em?: string;
}

export interface WhatsAppConversa {
  telefone: string;
  total_msgs: number;
  recebidas: number;
  enviadas: number;
  ultima_msg_em?: string;
  ultima_msg_conteudo?: string;
  ultima_msg_direcao?: string;
  cliente_nome?: string;
  cliente_id?: number;
}

export function useWhatsAppStatus() {
  return useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      const { data } = await api.get('/whatsapp/status');
      return data as { configurado: boolean; phone_number_id: string | null };
    },
    staleTime: 60_000 * 10,
  });
}

export function useWhatsAppConversas(search?: string) {
  return useQuery({
    queryKey: ['whatsapp-conversas', search],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      const { data } = await api.get('/whatsapp/conversas', { params });
      return data as { total: number; items: WhatsAppConversa[] };
    },
  });
}

export function useWhatsAppConversa(telefone?: string) {
  return useQuery({
    queryKey: ['whatsapp-conversa', telefone],
    queryFn: async () => {
      const { data } = await api.get(`/whatsapp/conversa/${telefone}`, { params: { limit: 200 } });
      return data as { total: number; telefone: string; items: WhatsAppMensagem[] };
    },
    enabled: !!telefone,
    refetchInterval: 15_000, // poll every 15s for new messages
  });
}

export function useWhatsAppMensagens(processoId?: number, clienteId?: number, limit = 50) {
  return useQuery({
    queryKey: ['whatsapp-msgs', processoId, clienteId],
    queryFn: async () => {
      const params: any = { limit };
      if (processoId) params.processo_id = processoId;
      if (clienteId) params.cliente_id = clienteId;
      const { data } = await api.get('/whatsapp/mensagens', { params });
      return data as { total: number; items: WhatsAppMensagem[] };
    },
  });
}

export function useWhatsAppNaoLidas() {
  return useQuery({
    queryKey: ['whatsapp-nao-lidas'],
    queryFn: async () => {
      const { data } = await api.get('/whatsapp/nao-lidas');
      return data as { nao_lidas: number };
    },
    refetchInterval: 60_000,
  });
}

export function useWhatsAppMutations() {
  const qc = useQueryClient();

  const enviarTexto = useMutation({
    mutationFn: async (dados: { telefone: string; mensagem: string; processo_id?: number; cliente_id?: number }) => {
      const { data } = await api.post('/whatsapp/enviar-texto', dados);
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['whatsapp-msgs'] });
      qc.invalidateQueries({ queryKey: ['whatsapp-conversas'] });
      qc.invalidateQueries({ queryKey: ['whatsapp-conversa', variables.telefone] });
    },
  });

  const enviarTemplate = useMutation({
    mutationFn: async (dados: { telefone: string; template_nome: string; parametros?: string[]; processo_id?: number; cliente_id?: number }) => {
      const { data } = await api.post('/whatsapp/enviar-template', dados);
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['whatsapp-msgs'] });
      qc.invalidateQueries({ queryKey: ['whatsapp-conversas'] });
      qc.invalidateQueries({ queryKey: ['whatsapp-conversa', variables.telefone] });
    },
  });

  return { enviarTexto, enviarTemplate };
}
