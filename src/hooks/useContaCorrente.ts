import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import type {
  ContaCorrenteCliente,
  ResumoFinanceiroProcesso,
  ResumoGeral,
} from '@/types/financeiro';

export const useContaCorrenteCliente = (clienteId: number | null) => {
  return useQuery<ContaCorrenteCliente>({
    queryKey: ['conta-corrente', 'cliente', clienteId],
    queryFn: async () => {
      const response = await api.get(`/conta-corrente/cliente/${clienteId}`);
      return response.data;
    },
    enabled: !!clienteId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useResumoFinanceiroProcesso = (processoId: number | null) => {
  return useQuery<ResumoFinanceiroProcesso>({
    queryKey: ['resumo-financeiro', 'processo', processoId],
    queryFn: async () => {
      const response = await api.get(`/conta-corrente/processo/${processoId}`);
      return response.data;
    },
    enabled: !!processoId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useClientesComSaldo = () => {
  return useQuery<any[]>({
    queryKey: ['conta-corrente', 'clientes-com-saldo'],
    queryFn: async () => {
      const response = await api.get('/conta-corrente/clientes-com-saldo');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useResumoGeral = () => {
  return useQuery<ResumoGeral>({
    queryKey: ['conta-corrente', 'resumo-geral'],
    queryFn: async () => {
      const response = await api.get('/conta-corrente/resumo-geral');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
