import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

export interface MovimentoCaixa {
  id: number;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  data: string;
  hora?: string | null;
  processo_id?: number | null;
  tipo_transferencia: 'mb' | 'dinheiro' | 'transferencia';
}

export interface MovimentoExtrato extends MovimentoCaixa {
  saldo_antes: number;
  saldo_apos: number;
}

export interface FechoCaixaExtrato {
  id: number;
  data: string;
  saldo_inicial: number;
  total_entradas: number;
  total_saidas: number;
  saldo_final: number;
  saldo_moedas: number;
  total_entradas_dinheiro: number;
  total_saidas_dinheiro: number;
  total_entradas_mb: number;
  total_saidas_mb: number;
  total_entradas_transferencia: number;
  total_saidas_transferencia: number;
  saldo_dinheiro_estimado: number;
  movimentos: MovimentoExtrato[];
}

export interface ResumoDia {
  data: string;
  saldo_inicial: number;
  total_entradas: number;
  total_saidas: number;
  saldo_final: number;
  total_entradas_dinheiro: number;
  total_saidas_dinheiro: number;
  total_entradas_mb: number;
  total_saidas_mb: number;
  total_entradas_transferencia: number;
  total_saidas_transferencia: number;
  saldo_dinheiro_estimado: number;
}

export interface CreateMovimentoData {
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  data: string;
  hora?: string;
  associado_a_processo: boolean;
  processo_id?: string | number | null;
  tipo_transferencia: 'mb' | 'dinheiro' | 'transferencia';
}

export interface UpdateMovimentoData extends Partial<CreateMovimentoData> {}

const normalizarMovimento = (movimento: any): MovimentoCaixa => ({
  id: movimento.id,
  tipo: movimento.tipo,
  valor: Number(movimento.valor ?? 0),
  descricao: movimento.descricao,
  data: movimento.data,
  hora: movimento.hora ?? (movimento.data ? new Date(movimento.data).toISOString().split('T')[1]?.slice(0, 5) : null),
  processo_id: movimento.processo_id ?? null,
  tipo_transferencia: movimento.tipo_transferencia ?? 'dinheiro',
});

const normalizarExtrato = (extrato: any): FechoCaixaExtrato => ({
  id: extrato.id,
  data: extrato.data,
  saldo_inicial: Number(extrato.saldo_inicial ?? 0),
  total_entradas: Number(extrato.total_entradas ?? 0),
  total_saidas: Number(extrato.total_saidas ?? 0),
  saldo_final: Number(extrato.saldo_final ?? 0),
  saldo_moedas: Number(extrato.saldo_moedas ?? 0),
  total_entradas_dinheiro: Number(extrato.total_entradas_dinheiro ?? 0),
  total_saidas_dinheiro: Number(extrato.total_saidas_dinheiro ?? 0),
  total_entradas_mb: Number(extrato.total_entradas_mb ?? 0),
  total_saidas_mb: Number(extrato.total_saidas_mb ?? 0),
  total_entradas_transferencia: Number(extrato.total_entradas_transferencia ?? 0),
  total_saidas_transferencia: Number(extrato.total_saidas_transferencia ?? 0),
  saldo_dinheiro_estimado: Number(extrato.saldo_dinheiro_estimado ?? 0),
  movimentos: Array.isArray(extrato.movimentos)
    ? extrato.movimentos.map((mov: any) => ({
        ...normalizarMovimento(mov),
        saldo_antes: Number(mov.saldo_antes ?? 0),
        saldo_apos: Number(mov.saldo_apos ?? 0),
      }))
    : [],
});

export const useCaixa = () => {
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [fechos, setFechos] = useState<FechoCaixaExtrato[]>([]);
  const [resumoDia, setResumoDia] = useState<ResumoDia | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovimentos = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/caixa/movimentos');
      const data = Array.isArray(response.data) ? response.data.map(normalizarMovimento) : [];
      setMovimentos(data);
    } catch (error) {
      setError('Erro ao carregar movimentos');
      console.error('Erro ao carregar movimentos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFechos = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/caixa/fechos');
      const data = Array.isArray(response.data) ? response.data.map(normalizarExtrato) : [];
      setFechos(data);
    } catch (error) {
      setError('Erro ao carregar fechos');
      console.error('Erro ao carregar fechos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFechoById = useCallback(async (fechoId: number) => {
    try {
      const response = await api.get(`/caixa/fechos/${fechoId}`);
      const extrato = normalizarExtrato(response.data);
      setFechos((prev) => {
        const outros = prev.filter((fecho) => fecho.id !== extrato.id);
        return [extrato, ...outros].sort((a, b) => (a.data < b.data ? 1 : -1));
      });
      return extrato;
    } catch (error) {
      setError('Erro ao carregar fecho selecionado');
      console.error('Erro ao carregar fecho por id:', error);
      throw error;
    }
  }, []);

  const fetchResumoDia = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/caixa/resumo/${today}`);
      const data = response.data ?? {};
      const entradas = Number((data.total_entradas ?? 0)) || 0;
      const saidas = Number((data.total_saidas ?? 0)) || 0;
      const entradasDinheiro = Number((data.total_entradas_dinheiro ?? 0)) || 0;
      const saidasDinheiro = Number((data.total_saidas_dinheiro ?? 0)) || 0;
      const entradasMb = Number((data.total_entradas_mb ?? 0)) || 0;
      const saidasMb = Number((data.total_saidas_mb ?? 0)) || 0;
      const entradasTransferencia = Number((data.total_entradas_transferencia ?? 0)) || 0;
      const saidasTransferencia = Number((data.total_saidas_transferencia ?? 0)) || 0;
      const saldoInicial = Number(data.saldo_inicial ?? 0);
      const saldoFinal = Number(data.saldo ?? saldoInicial + entradas - saidas);
      const saldoDinheiroEstimado = Number(
        data.saldo_dinheiro_estimado ?? saldoInicial + entradasDinheiro - saidasDinheiro
      );
      setResumoDia({
        data: today,
        saldo_inicial: saldoInicial,
        total_entradas: entradas,
        total_saidas: saidas,
        saldo_final: saldoFinal,
        total_entradas_dinheiro: entradasDinheiro,
        total_saidas_dinheiro: saidasDinheiro,
        total_entradas_mb: entradasMb,
        total_saidas_mb: saidasMb,
        total_entradas_transferencia: entradasTransferencia,
        total_saidas_transferencia: saidasTransferencia,
        saldo_dinheiro_estimado: saldoDinheiroEstimado,
      });
    } catch (error) {
      console.error('Erro ao carregar resumo do dia:', error);
      const today = new Date().toISOString().split('T')[0];
      setResumoDia({
        data: today,
        saldo_inicial: 0,
        total_entradas: 0,
        total_saidas: 0,
        saldo_final: 0,
        total_entradas_dinheiro: 0,
        total_saidas_dinheiro: 0,
        total_entradas_mb: 0,
        total_saidas_mb: 0,
        total_entradas_transferencia: 0,
        total_saidas_transferencia: 0,
        saldo_dinheiro_estimado: 0,
      });
    }
  }, []);

  const createMovimento = useCallback(async (data: CreateMovimentoData): Promise<void> => {
    try {
      await api.post('/caixa/movimento', data);
      await Promise.all([fetchMovimentos(), fetchFechos(), fetchResumoDia()]);
    } catch (error) {
      setError('Erro ao criar movimento');
      throw error;
    }
  }, [fetchMovimentos, fetchFechos, fetchResumoDia]);

  const updateMovimento = useCallback(
    async (movimentoId: number, data: UpdateMovimentoData): Promise<void> => {
      try {
        await api.put(`/caixa/movimento/${movimentoId}`, data);
        await Promise.all([fetchMovimentos(), fetchFechos(), fetchResumoDia()]);
      } catch (error) {
        setError('Erro ao atualizar movimento');
        throw error;
      }
    },
    [fetchMovimentos, fetchFechos, fetchResumoDia]
  );

  const deleteMovimento = useCallback(
    async (movimentoId: number): Promise<void> => {
      try {
        await api.delete(`/caixa/movimento/${movimentoId}`);
        await Promise.all([fetchMovimentos(), fetchFechos(), fetchResumoDia()]);
      } catch (error) {
        setError('Erro ao apagar movimento');
        throw error;
      }
    },
    [fetchMovimentos, fetchFechos, fetchResumoDia]
  );

  const fecharCaixa = useCallback(async (saldoMoedas: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.post('/caixa/fecho', { data: today, saldo_moedas: saldoMoedas });
      const extrato = normalizarExtrato(response.data);
      await Promise.all([fetchFechos(), fetchResumoDia()]);
      return extrato;
    } catch (error) {
      setError('Erro ao fechar caixa');
      throw error;
    }
  }, [fetchFechos, fetchResumoDia]);

  const refetch = useCallback(async () => {
    await Promise.all([fetchMovimentos(), fetchFechos(), fetchResumoDia()]);
  }, [fetchMovimentos, fetchFechos, fetchResumoDia]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    movimentos,
    fechos,
    resumoDia,
    isLoading,
    error,
    createMovimento,
    updateMovimento,
    deleteMovimento,
    fecharCaixa,
    refetch,
    fetchFechoById,
  };
};