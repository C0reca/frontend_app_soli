import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface ProcessoValidacao {
  id: number;
  processo_id: number;
  regra_id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  estado: 'pendente' | 'validado' | 'nao_aplicavel' | 'rejeitado';
  validado_por_id?: number;
  validado_por_nome?: string;
  validado_em?: string;
  notas?: string;
  documento_id?: number;
}

export interface WorkflowStatus {
  estado_workflow: string | null;
  estados_disponiveis: string[];
  bloqueios_ativos: { id: string; tipo: string; mensagem: string }[];
  pode_avancar: boolean;
  validacoes_resumo: { total: number; pendente: number; validado: number; nao_aplicavel: number; rejeitado: number };
  checklist_resumo: { total: number; concluido: number };
  docs_obrigatorios_resumo: { total: number; presentes: number; em_falta: string[] };
}

export const useProcessoValidacoes = (processoId?: number) => {
  return useQuery<ProcessoValidacao[]>({
    queryKey: ['processo-validacoes', processoId],
    queryFn: async () => {
      const res = await api.get(`/processo-validacoes/processo/${processoId}`);
      return res.data;
    },
    enabled: !!processoId,
  });
};

export const useWorkflowStatus = (processoId?: number) => {
  return useQuery<WorkflowStatus>({
    queryKey: ['processo-workflow', processoId],
    queryFn: async () => {
      const res = await api.get(`/processo-validacoes/processo/${processoId}/workflow`);
      return res.data;
    },
    enabled: !!processoId,
  });
};

export const useProcessoValidacoesMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateValidacao = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; estado: string; notas?: string; documento_id?: number }) => {
      const res = await api.patch(`/processo-validacoes/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['processo-validacoes'] });
      queryClient.invalidateQueries({ queryKey: ['processo-workflow'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error?.response?.data?.detail ?? 'Erro ao atualizar validação.', variant: 'destructive' });
    },
  });

  const gerarValidacoes = useMutation({
    mutationFn: async (processoId: number) => {
      const res = await api.post(`/processo-validacoes/processo/${processoId}/gerar`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processo-validacoes'] });
      queryClient.invalidateQueries({ queryKey: ['processo-workflow'] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error?.response?.data?.detail ?? 'Erro ao gerar validações.', variant: 'destructive' });
    },
  });

  const updateWorkflowState = useMutation({
    mutationFn: async ({ processoId, estado_workflow }: { processoId: number; estado_workflow: string }) => {
      const res = await api.put(`/processo-validacoes/processo/${processoId}/workflow`, { estado_workflow });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processo-workflow'] });
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({ title: 'Sucesso', description: 'Estado do workflow atualizado.' });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      if (detail && typeof detail === 'object' && detail.bloqueios) {
        const msgs = detail.bloqueios.map((b: any) => b.mensagem).join('\n');
        toast({ title: 'Bloqueado', description: msgs, variant: 'destructive' });
      } else {
        toast({ title: 'Erro', description: typeof detail === 'string' ? detail : 'Erro ao alterar estado.', variant: 'destructive' });
      }
    },
  });

  return { updateValidacao, gerarValidacoes, updateWorkflowState };
};
