import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface ErroReportAnexo {
  id: number;
  nome_original: string;
  tipo: string | null;
  criado_em: string;
}

export interface ErroReportHistorico {
  id: number;
  estado_anterior: string | null;
  estado_novo: string;
  comentario: string | null;
  funcionario_nome: string | null;
  criado_em: string;
}

export interface ErroReportListItem {
  id: number;
  funcionario_nome: string | null;
  descricao: string;
  pagina: string | null;
  estado: string;
  prioridade: string | null;
  criado_em: string;
  num_anexos: number;
}

export interface ErroReport {
  id: number;
  funcionario_id: number | null;
  funcionario_nome: string | null;
  descricao: string;
  passos_reproduzir: string | null;
  mensagem_erro: string | null;
  stack_trace: string | null;
  pagina: string | null;
  browser_info: string | null;
  app_versao: string | null;
  estado: string;
  prioridade: string | null;
  notas_internas: string | null;
  resolvido_por_id: number | null;
  resolvido_por_nome: string | null;
  resolvido_em: string | null;
  criado_em: string;
  atualizado_em: string;
  anexos: ErroReportAnexo[];
  historico: ErroReportHistorico[];
}

export interface ErroReportCreateData {
  descricao: string;
  passos_reproduzir?: string;
  mensagem_erro?: string;
  stack_trace?: string;
  pagina?: string;
  browser_info?: string;
  app_versao?: string;
}

export interface ErroReportUpdateEstadoData {
  estado: string;
  comentario?: string;
  notas_internas?: string;
  prioridade?: string;
}

export function useErroReports(estado?: string) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return useQuery<{ total: number; items: ErroReportListItem[] } | ErroReportListItem[]>({
    queryKey: ['erro-reports', { estado, isAdmin }],
    queryFn: async () => {
      if (isAdmin) {
        const params: Record<string, string> = {};
        if (estado) params.estado = estado;
        const { data } = await api.get('/erro-reports', { params });
        return data;
      } else {
        const { data } = await api.get('/erro-reports/meus');
        return data;
      }
    },
    staleTime: 30_000,
  });
}

export function useErroReport(id: number | null) {
  return useQuery<ErroReport>({
    queryKey: ['erro-reports', id],
    queryFn: async () => {
      const { data } = await api.get(`/erro-reports/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useErroReportMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createReport = useMutation({
    mutationFn: async (payload: ErroReportCreateData) => {
      const { data } = await api.post('/erro-reports', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erro-reports'] });
      toast({ title: 'Reporte enviado com sucesso' });
    },
    onError: () => {
      toast({ title: 'Erro ao enviar reporte', variant: 'destructive' });
    },
  });

  const uploadAnexo = useMutation({
    mutationFn: async ({ reportId, file }: { reportId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post(`/erro-reports/${reportId}/anexos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erro-reports'] });
    },
    onError: () => {
      toast({ title: 'Erro ao enviar anexo', variant: 'destructive' });
    },
  });

  const updateEstado = useMutation({
    mutationFn: async ({ reportId, payload }: { reportId: number; payload: ErroReportUpdateEstadoData }) => {
      const { data } = await api.put(`/erro-reports/${reportId}/estado`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['erro-reports'] });
      toast({ title: 'Estado atualizado' });
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar estado', variant: 'destructive' });
    },
  });

  return { createReport, uploadAnexo, updateEstado };
}
