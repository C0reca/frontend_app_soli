import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface AutoFinanceiroDashboard {
  total_registos: number;
  total_pagos: number;
  total_pendentes: number;
  valor_total_pago: number;
  valor_total_pendente: number;
  por_stand: { entidade_id: number; nome: string; total_registos: number; valor_total: number }[];
  ultimas_semanas: { id: number; stand_nome: string | null; semana_inicio: string | null; semana_fim: string | null; estado: string; total: number; registos_count: number }[];
}

export function useAutoFinanceiroDashboard(standEntidadeId?: number) {
  return useQuery<AutoFinanceiroDashboard>({
    queryKey: ['auto-financeiro-dashboard', standEntidadeId],
    queryFn: async () => {
      const params: any = {};
      if (standEntidadeId) params.stand_entidade_id = standEntidadeId;
      const { data } = await api.get('/auto-financeiro/dashboard', { params });
      return data;
    },
  });
}

export function useAutoFinanceiroMutations() {
  const qc = useQueryClient();

  const gerarTransacaoRegisto = useMutation({
    mutationFn: async (registoId: number) => {
      const { data } = await api.post(`/auto-financeiro/registo/${registoId}/gerar-transacao`);
      return data as { transacao_id: number; valor: number; descricao: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auto-financeiro-dashboard'] });
      qc.invalidateQueries({ queryKey: ['financeiro'] });
    },
  });

  const gerarTransacoesSemana = useMutation({
    mutationFn: async (semanaId: number) => {
      const { data } = await api.post(`/auto-financeiro/semana/${semanaId}/gerar-transacoes`);
      return data as { semana_id: number; transacoes_criadas: number; total_valor: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auto-financeiro-dashboard'] });
      qc.invalidateQueries({ queryKey: ['financeiro'] });
    },
  });

  return { gerarTransacaoRegisto, gerarTransacoesSemana };
}
