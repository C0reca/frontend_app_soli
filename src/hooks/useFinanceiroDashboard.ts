import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export interface FinanceiroDashboard {
  total_custos: number;
  total_pagamentos: number;
  total_reembolsos: number;
  saldo_total: number;
  total_clientes_com_saldo: number;
  saldo_caixa: number;
  entradas_periodo: number;
  saidas_periodo: number;
  auto_financeiro: {
    total_registos: number;
    valor_pago: number;
    valor_pendente: number;
  };
}

export function useFinanceiroDashboard(dataInicio?: string, dataFim?: string) {
  return useQuery<FinanceiroDashboard>({
    queryKey: ['financeiro-dashboard', dataInicio, dataFim],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (dataInicio) params.data_inicio = dataInicio;
      if (dataFim) params.data_fim = dataFim;
      const { data } = await api.get('/financeiro/dashboard', { params });
      return data;
    },
    staleTime: 30_000,
  });
}
