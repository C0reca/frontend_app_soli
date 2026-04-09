import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface ChecklistItem {
  id?: number;
  titulo: string;
  descricao?: string;
  ordem: number;
}

export interface OrcamentoItem {
  id?: number;
  descricao: string;
  valor?: number;
  ordem: number;
}

export interface DocTemplateItem {
  id?: number;
  documento_template_id: number;
  nome_template?: string;
  ordem: number;
}

export interface TarefaItem {
  id?: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  prioridade?: string;
  prazo_dias?: number;
  tipo?: string;
}

export interface WizardFieldConfig {
  key: string;
  required: boolean;
}

export interface CustomFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  options?: string[]; // para type=select
  placeholder?: string;
}

export interface WizardStepConfig {
  id: string;
  title: string;
  fields: WizardFieldConfig[];
}

export interface WizardConfig {
  steps: WizardStepConfig[];
  custom_fields?: CustomFieldDef[];
}

export interface RegraValidacao {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string; // identidade, fiscal, registral, poderes, compliance, geral
  campo_condicao?: string; // campo que ativa a regra
  valor_condicao?: string | string[]; // valor(es) que ativam a regra
}

export interface DocObrigatorio {
  id: string;
  nome: string;
  descricao?: string;
  keyword?: string; // keyword para verificar no nome do documento
  obrigatorio_para_estado?: string; // estado workflow que exige este doc
}

export interface BloqueioConfig {
  id: string;
  tipo: 'checklist_completa' | 'validacoes_completas' | 'docs_obrigatorios';
  bloqueia_estado: string; // estado que fica bloqueado
  mensagem: string;
}

export interface TipoProcesso {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  wizard_config?: WizardConfig | null;
  estados_workflow?: string[] | null;
  regras_validacao?: RegraValidacao[] | null;
  docs_obrigatorios?: DocObrigatorio[] | null;
  bloqueios?: BloqueioConfig[] | null;
  checklist_items: ChecklistItem[];
  orcamento_items: OrcamentoItem[];
  documento_templates: DocTemplateItem[];
  tarefas: TarefaItem[];
  processo_template_id?: number | null;
}

export interface TipoProcessoSimple {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  wizard_config?: WizardConfig | null;
  estados_workflow?: string[] | null;
  processo_template_id?: number | null;
}

export const useTiposProcesso = (ativo?: boolean) => {
  return useQuery<TipoProcessoSimple[]>({
    queryKey: ['tipos-processo', { ativo }],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (ativo !== undefined) params.ativo = ativo;
      const res = await api.get('/tipos-processo', { params });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useTipoProcesso = (id: number | null) => {
  return useQuery<TipoProcesso>({
    queryKey: ['tipos-processo', id],
    queryFn: async () => {
      const res = await api.get(`/tipos-processo/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useTiposProcessoMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createTipo = useMutation({
    mutationFn: async (data: Omit<TipoProcesso, 'id' | 'ativo'>) => {
      const res = await api.post('/tipos-processo', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-processo'] });
      toast({ title: 'Sucesso', description: 'Tipo de processo criado.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error?.response?.data?.detail ?? 'Erro ao criar tipo de processo.', variant: 'destructive' });
    },
  });

  const updateTipo = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TipoProcesso> & { id: number }) => {
      const res = await api.put(`/tipos-processo/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-processo'] });
      toast({ title: 'Sucesso', description: 'Tipo de processo atualizado.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error?.response?.data?.detail ?? 'Erro ao atualizar tipo de processo.', variant: 'destructive' });
    },
  });

  const deleteTipo = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/tipos-processo/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-processo'] });
      toast({ title: 'Sucesso', description: 'Tipo de processo eliminado.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error?.response?.data?.detail ?? 'Erro ao eliminar tipo de processo.', variant: 'destructive' });
    },
  });

  return { createTipo, updateTipo, deleteTipo };
};
