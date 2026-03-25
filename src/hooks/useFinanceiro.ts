import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useMeeting } from '@/contexts/MeetingContext';
import type {
  TransacaoFinanceira,
  TransacaoFinanceiraCreate,
  TransacaoFinanceiraUpdate,
} from '@/types/financeiro';

interface ListTransacoesParams {
  processo_id?: number;
  cliente_id?: number;
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
  estado_reconciliacao?: string;
  sem_processo?: boolean;
  skip?: number;
  limit?: number;
}

export const useTransacoes = (params: ListTransacoesParams = {}) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { trackItem } = useMeeting();

  const queryKey = ['transacoes', params];

  const { data: transacoes = [], isLoading, error } = useQuery<TransacaoFinanceira[]>({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.processo_id) searchParams.set('processo_id', String(params.processo_id));
      if (params.cliente_id) searchParams.set('cliente_id', String(params.cliente_id));
      if (params.tipo) searchParams.set('tipo', params.tipo);
      if (params.data_inicio) searchParams.set('data_inicio', params.data_inicio);
      if (params.data_fim) searchParams.set('data_fim', params.data_fim);
      if (params.estado_reconciliacao) searchParams.set('estado_reconciliacao', params.estado_reconciliacao);
      if (params.sem_processo) searchParams.set('sem_processo', 'true');
      if (params.skip) searchParams.set('skip', String(params.skip));
      if (params.limit) searchParams.set('limit', String(params.limit));
      const qs = searchParams.toString();
      const response = await api.get(`/financeiro/transacoes${qs ? `?${qs}` : ''}`);
      return response.data;
    },
  });

  const createTransacao = useMutation({
    mutationFn: async (data: TransacaoFinanceiraCreate) => {
      const response = await api.post('/financeiro/transacao', data);
      return response.data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['conta-corrente'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['caixa'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-dashboard'] });
      if (data?.id) trackItem('transacao', data.id, 'criado', data.descricao);
      toast({ title: 'Transação criada', description: 'A transação foi registada com sucesso.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Não foi possível criar a transação. Verifique os dados e tente novamente.';
      toast({ title: 'Erro ao criar transação', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  const updateTransacao = useMutation({
    mutationFn: async ({ id, ...data }: TransacaoFinanceiraUpdate & { id: number }) => {
      const response = await api.put(`/financeiro/transacao/${id}`, data);
      return response.data;
    },
    onSuccess: (data: any, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['conta-corrente'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] });
      trackItem('transacao', variables.id, 'atualizado', data?.descricao);
      toast({ title: 'Transação atualizada', description: 'As alterações foram guardadas.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Não foi possível atualizar a transação.';
      toast({ title: 'Erro ao atualizar transação', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  const deleteTransacao = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/financeiro/transacao/${id}`);
      return id;
    },
    onSuccess: (_data: any, id: number) => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['conta-corrente'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] });
      queryClient.invalidateQueries({ queryKey: ['caixa'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro-dashboard'] });
      trackItem('transacao', id, 'eliminado');
      toast({ title: 'Transação eliminada', description: 'A transação foi removida com sucesso.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Não foi possível eliminar a transação.';
      toast({ title: 'Erro ao eliminar transação', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  const uploadAnexo = useMutation({
    mutationFn: async ({ transacaoId, file }: { transacaoId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/financeiro/transacao/${transacaoId}/anexo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      toast({ title: 'Anexo adicionado', description: 'O ficheiro foi anexado à transação.' });
    },
    onError: () => {
      toast({ title: 'Erro ao anexar ficheiro', description: 'Não foi possível carregar o ficheiro. Verifique o tamanho e formato.', variant: 'destructive' });
    },
  });

  const deleteAnexo = useMutation({
    mutationFn: async ({ transacaoId, anexoId }: { transacaoId: number; anexoId: number }) => {
      await api.delete(`/financeiro/transacao/${transacaoId}/anexo/${anexoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      toast({ title: 'Anexo removido', description: 'O ficheiro foi eliminado.' });
    },
    onError: () => {
      toast({ title: 'Erro ao remover anexo', description: 'Não foi possível remover o ficheiro.', variant: 'destructive' });
    },
  });

  const enviarParaCaixa = useMutation({
    mutationFn: async (transacaoId: number) => {
      const response = await api.post(`/financeiro/transacao/${transacaoId}/enviar-caixa`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-financeiro'] });
      toast({ title: 'Sucesso', description: 'Movimento de caixa criado.' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao enviar para caixa.';
      toast({ title: 'Erro', description: typeof msg === 'string' ? msg : JSON.stringify(msg), variant: 'destructive' });
    },
  });

  return {
    transacoes,
    isLoading,
    error,
    createTransacao,
    updateTransacao,
    deleteTransacao,
    uploadAnexo,
    deleteAnexo,
    enviarParaCaixa,
  };
};

export const useTransacaoDetalhe = (id: number | null) => {
  return useQuery<TransacaoFinanceira>({
    queryKey: ['transacao', id],
    queryFn: async () => {
      const response = await api.get(`/financeiro/transacao/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};
