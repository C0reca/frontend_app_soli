import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface IRS {
  id: number;
  cliente_id: number;
  ano: number;
  fase: 1 | 2;
  estado: 'Por Pagar' | 'Pago' | 'Isento';
  estado_entrega?: 'Enviado' | 'Levantado Pelo Cliente' | 'Aguarda Documentos' | 'Contencioso Administrativo' | 'Em Análise' | 'Verificado' | 'Concluído';
  numero_recibo?: string;
  levantar_irs_apos_dia?: string;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
  cliente?: {
    id: number;
    nome?: string;
    telefone?: string;
    morada?: string;
    codigo_postal?: string;
    localidade?: string;
  };
}

export interface IRSCreate {
  cliente_id: number;
  ano: number;
  fase: 1 | 2;
  estado?: 'Por Pagar' | 'Pago' | 'Isento' | 'Aguarda Documentos' | 'Contencioso Administrativo' | 'Em Análise' | 'Verificado' | 'Concluído';
  estado_entrega?: 'Enviado' | 'Levantado Pelo Cliente';
  levantar_irs_apos_dia?: string;
  observacoes?: string;
}

export interface IRSUpdate {
  fase?: 1 | 2;
  estado?: 'Por Pagar' | 'Pago' | 'Isento' | 'Aguarda Documentos' | 'Contencioso Administrativo' | 'Em Análise' | 'Verificado' | 'Concluído';
  estado_entrega?: 'Enviado' | 'Levantado Pelo Cliente';
  levantar_irs_apos_dia?: string;
  observacoes?: string;
}

export const useIRS = (emAberto?: boolean) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: irsList = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['irs', emAberto],
    queryFn: async () => {
      const params: any = {};
      if (emAberto !== undefined) {
        params.em_aberto = emAberto;
      }
      const response = await api.get('/irs/', { params });
      return response.data as IRS[];
    }
  });

  const createIRS = useMutation({
    mutationFn: async (data: IRSCreate) => {
      const response = await api.post('/irs/', data);
      return response.data as IRS;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['irs'] });
      toast({
        title: 'Sucesso',
        description: 'IRS criado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao criar IRS.',
        variant: 'destructive',
      });
    },
  });

  const updateIRS = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: IRSUpdate }) => {
      const response = await api.put(`/irs/${id}`, data);
      return response.data as IRS;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['irs'] });
      toast({
        title: 'Sucesso',
        description: 'IRS atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao atualizar IRS.',
        variant: 'destructive',
      });
    },
  });

  const deleteIRS = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/irs/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['irs'] });
      toast({
        title: 'Sucesso',
        description: 'IRS eliminado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao eliminar IRS.',
        variant: 'destructive',
      });
    },
  });

  const generateRecibo = async (id: number) => {
    try {
      const response = await api.post(`/irs/${id}/recibo`, {}, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo_irs_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Sucesso',
        description: 'Recibo gerado com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao gerar recibo.',
        variant: 'destructive',
      });
    }
  };

  const registrarHistorico = async (
    irsId: number,
    acao: string,
    campoAlterado?: string,
    valorAnterior?: string,
    valorNovo?: string,
    detalhes?: string
  ) => {
    try {
      await api.post(`/irs/${irsId}/historico`, {
        acao,
        campo_alterado: campoAlterado,
        valor_anterior: valorAnterior,
        valor_novo: valorNovo,
        detalhes,
      });
    } catch (error: any) {
      // Não mostrar erro ao usuário, apenas logar
      console.error('Erro ao registrar histórico:', error);
    }
  };

  return {
    irsList,
    isLoading,
    error,
    createIRS,
    updateIRS,
    deleteIRS,
    generateRecibo,
    registrarHistorico,
  };
};

