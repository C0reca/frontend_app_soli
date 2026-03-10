import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: number;
  nome: string;
  variaveis: string[];
}

interface EmailEnviado {
  id: number;
  processo_id?: number;
  cliente_id?: number;
  template_id?: number;
  destinatario: string;
  assunto: string;
  estado: string;
  erro_detalhe?: string;
  criado_em?: string;
  processo_titulo?: string;
  cliente_nome?: string;
}

export function useEmailTemplatesList() {
  return useQuery<EmailTemplate[]>({
    queryKey: ['email-templates-list'],
    queryFn: async () => {
      const { data } = await api.get('/email-templates/templates-email');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useEmailPreview(templateId: number | null, processoId: number | null) {
  return useQuery<{ html: string; assunto_sugerido: string }>({
    queryKey: ['email-preview', templateId, processoId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('template_id', String(templateId));
      if (processoId) params.set('processo_id', String(processoId));
      const { data } = await api.post(`/email-templates/preview?${params.toString()}`);
      return data;
    },
    enabled: !!templateId,
    staleTime: 0,
  });
}

export function useEnviarEmail() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      template_id: number;
      processo_id?: number;
      destinatario: string;
      assunto: string;
      conteudo_html_override?: string;
    }) => {
      const response = await api.post('/email-templates/enviar', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails-enviados'] });
      toast({ title: 'Sucesso', description: 'Email enviado com sucesso.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao enviar email.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });
}

export function useEmailsEnviados(params: { processo_id?: number; cliente_id?: number } = {}) {
  const queryKey = ['emails-enviados', params];

  return useQuery<EmailEnviado[]>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.processo_id) searchParams.set('processo_id', String(params.processo_id));
      if (params.cliente_id) searchParams.set('cliente_id', String(params.cliente_id));
      const qs = searchParams.toString();
      const { data } = await api.get(`/email-templates/enviados${qs ? `?${qs}` : ''}`);
      return data;
    },
  });
}
