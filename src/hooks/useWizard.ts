import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { processoTemplates } from '@/services/api';
import { ProcessoTemplateCompleto } from '@/hooks/useProcessoTemplates';

/**
 * Verifica se existe um template ativo para um tipo de processo.
 * Retorna o template completo ou undefined se não existir.
 */
export function useTemplateAtivo(tipo_processo: string | null | undefined) {
  return useQuery<ProcessoTemplateCompleto | null>({
    queryKey: ['processo-templates', 'ativo', tipo_processo],
    queryFn: async () => {
      if (!tipo_processo) return null;
      try {
        const res = await processoTemplates.getAtivo(tipo_processo);
        return res.data;
      } catch (e: any) {
        if (e?.response?.status === 404) return null;
        throw e;
      }
    },
    enabled: !!tipo_processo,
    staleTime: 60_000,
    retry: false,
  });
}

/**
 * Carrega o rascunho do wizard para um processo.
 */
export function useRascunhoWizard(processoId: number | null) {
  return useQuery({
    queryKey: ['wizard-rascunho', processoId],
    queryFn: async () => {
      if (!processoId) return null;
      try {
        const res = await processoTemplates.getRascunho(processoId);
        return res.data;
      } catch (e: any) {
        if (e?.response?.status === 404) return null;
        throw e;
      }
    },
    enabled: !!processoId,
    retry: false,
  });
}

/**
 * Mutation para guardar o rascunho do wizard.
 */
export function useSalvarRascunho(processoId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { dados_parciais?: any; passo_atual?: number }) => {
      if (!processoId) throw new Error('processo_id não definido');
      return processoTemplates.salvarRascunho(processoId, data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wizard-rascunho', processoId] }),
  });
}

/**
 * Mutation para apagar o rascunho após conclusão.
 */
export function useApagarRascunho(processoId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!processoId) return;
      return processoTemplates.apagarRascunho(processoId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wizard-rascunho', processoId] }),
  });
}
