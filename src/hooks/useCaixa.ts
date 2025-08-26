import { useState, useEffect } from 'react';
import api from '@/services/api';

export interface MovimentoCaixa {
  id: number;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  data: string;
  processo_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FechoCaixa {
  id: number;
  data: string;
  saldo_inicial: number;
  total_entradas: number;
  total_saidas: number;
  saldo_final: number;
  created_at: string;
}

export interface ResumoDia {
  data: string;
  saldo_inicial: number;
  total_entradas: number;
  total_saidas: number;
  saldo_final: number;
}

export interface CreateMovimentoData {
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  data: string;
  associado_a_processo: boolean;
  processo_id?: string;
}

export const useCaixa = () => {
  const [movimentos, setMovimentos] = useState<MovimentoCaixa[]>([]);
  const [fechos, setFechos] = useState<FechoCaixa[]>([]);
  const [resumoDia, setResumoDia] = useState<ResumoDia | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovimentos = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/caixa/movimentos');
      setMovimentos(response.data);
    } catch (error) {
      setError('Erro ao carregar movimentos');
      console.error('Erro ao carregar movimentos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFechos = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/caixa/fechos');
      setFechos(response.data);
    } catch (error) {
      setError('Erro ao carregar fechos');
      console.error('Erro ao carregar fechos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResumoDia = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/caixa/resumo/${today}`);
      setResumoDia(response.data);
    } catch (error) {
      console.error('Erro ao carregar resumo do dia:', error);
      // Se não existir resumo para hoje, criar um vazio
      setResumoDia({
        data: new Date().toISOString().split('T')[0],
        saldo_inicial: 0,
        total_entradas: 0,
        total_saidas: 0,
        saldo_final: 0,
      });
    }
  };

  const createMovimento = async (data: CreateMovimentoData) => {
    try {
      const response = await api.post('/caixa/movimento', data);
      await fetchMovimentos();
      await fetchResumoDia();
      return response.data;
    } catch (error) {
      setError('Erro ao criar movimento');
      throw error;
    }
  };

  const fecharCaixa = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.post('/caixa/fecho', { data: today });
      await fetchFechos();
      await fetchResumoDia();
      return response.data;
    } catch (error) {
      setError('Erro ao fechar caixa');
      throw error;
    }
  };

  const refetch = async () => {
    await Promise.all([
      fetchMovimentos(),
      fetchFechos(),
      fetchResumoDia(),
    ]);
  };

  useEffect(() => {
    refetch();
  }, []);

  return {
    movimentos,
    fechos,
    resumoDia,
    isLoading,
    error,
    createMovimento,
    fecharCaixa,
    refetch,
  };
};