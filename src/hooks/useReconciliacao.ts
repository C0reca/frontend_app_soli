import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { MovimentoBancario, TransacaoFinanceira } from '@/types/financeiro';

interface ListMovimentosParams {
  fecho_id?: number;
  reconciliado?: boolean;
  data_inicio?: string;
  data_fim?: string;
  skip?: number;
  limit?: number;
}

export const useMovimentosBancarios = (params: ListMovimentosParams = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ['movimentos-bancarios', params];

  const { data: movimentos = [], isLoading, error } = useQuery<MovimentoBancario[]>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.fecho_id) searchParams.set('fecho_id', String(params.fecho_id));
      if (params.reconciliado !== undefined) searchParams.set('reconciliado', String(params.reconciliado));
      if (params.data_inicio) searchParams.set('data_inicio', params.data_inicio);
      if (params.data_fim) searchParams.set('data_fim', params.data_fim);
      if (params.skip) searchParams.set('skip', String(params.skip));
      if (params.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      const response = await api.get(`/reconciliacao/movimentos-bancarios${qs ? `?${qs}` : ''}`);
      return response.data;
    },
  });

  const importarExtrato = useMutation({
    mutationFn: async ({ file, fechoId }: { file: File; fechoId?: number }) => {
      const formData = new FormData();
      formData.append('file', file);
      const qs = fechoId ? `?fecho_id=${fechoId}` : '';
      const response = await api.post(`/reconciliacao/importar${qs}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data as MovimentoBancario[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movimentos-bancarios'] });
      toast({ title: 'Sucesso', description: `${data.length} movimentos importados.` });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao importar extrato.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  const reconciliar = useMutation({
    mutationFn: async ({ movimentoBancarioId, transacaoId }: { movimentoBancarioId: number; transacaoId: number }) => {
      const response = await api.post('/reconciliacao/reconciliar', {
        movimento_bancario_id: movimentoBancarioId,
        transacao_id: transacaoId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentos-bancarios'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      toast({ title: 'Sucesso', description: 'Movimento reconciliado.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao reconciliar.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  const desreconciliar = useMutation({
    mutationFn: async (movimentoBancarioId: number) => {
      const response = await api.delete(`/reconciliacao/desreconciliar/${movimentoBancarioId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimentos-bancarios'] });
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      toast({ title: 'Sucesso', description: 'Reconciliacao removida.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao desreconciliar.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  return {
    movimentos,
    isLoading,
    error,
    importarExtrato,
    reconciliar,
    desreconciliar,
  };
};

export const useSugestoesReconciliacao = (movimentoBancarioId: number | null) => {
  return useQuery<TransacaoFinanceira[]>({
    queryKey: ['sugestoes-reconciliacao', movimentoBancarioId],
    queryFn: async () => {
      const response = await api.get(`/reconciliacao/sugestoes/${movimentoBancarioId}`);
      return response.data;
    },
    enabled: !!movimentoBancarioId,
  });
};
