import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { EmailCobranca, EmailCobrancaCreate, CobrancaPreview } from '@/types/financeiro';

export const useHistoricoCobrancas = () => {
  return useQuery<EmailCobranca[]>({
    queryKey: ['cobrancas', 'historico'],
    queryFn: async () => {
      const response = await api.get('/cobranca/historico');
      return response.data;
    },
  });
};

export const useCobrancaPreview = (clienteId: number | null) => {
  return useQuery<CobrancaPreview>({
    queryKey: ['cobranca', 'preview', clienteId],
    queryFn: async () => {
      const response = await api.get(`/cobranca/preview/${clienteId}`);
      return response.data;
    },
    enabled: !!clienteId,
  });
};

export const useCobrancaActions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const enviarCobranca = useMutation({
    mutationFn: async (data: EmailCobrancaCreate) => {
      const response = await api.post('/cobranca/enviar', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      toast({ title: 'Sucesso', description: 'Email de cobranca enviado.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao enviar email de cobranca.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  const enviarCobrancaBulk = useMutation({
    mutationFn: async (clienteIds: number[]) => {
      const response = await api.post('/cobranca/enviar-bulk', { cliente_ids: clienteIds });
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['cobrancas'] });
      const enviados = data.enviados ?? 0;
      const erros = data.erros ?? 0;
      toast({
        title: 'Cobrancas enviadas',
        description: `${enviados} enviado(s), ${erros} erro(s).`,
        variant: erros > 0 ? 'destructive' : 'default',
      });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao enviar cobrancas em massa.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  return {
    enviarCobranca,
    enviarCobrancaBulk,
  };
};
