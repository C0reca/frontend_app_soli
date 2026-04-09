import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { processoTemplates } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

// ── Types ───────────────────────────────────────────────────────────────

export interface TemplateCampo {
  id: number;
  passo_id: number;
  campo_key: string;
  label: string;
  tipo: string;
  ordem: number;
  obrigatorio: boolean;
  placeholder?: string | null;
  default_value?: string | null;
  tooltip?: string | null;
  opcoes?: { valor: string; label: string }[] | null;
  validacao?: { regex?: string; mensagem_erro?: string } | null;
}

export interface TemplatePasso {
  id: number;
  template_id: number;
  titulo: string;
  descricao?: string | null;
  ordem: number;
  opcional: boolean;
  campos: TemplateCampo[];
}

export interface TemplateTarefa {
  id: number;
  template_id: number;
  titulo_template: string;
  descricao_template?: string | null;
  ordem: number;
  prazo_dias?: number | null;
  responsavel_id?: number | null;
  prioridade: string;
}

export interface TemplateDocumento {
  id: number;
  template_id: number;
  nome_ficheiro_template: string;
  ordem: number;
  docx_template_id?: number | null;
  docx_template_path?: string | null;
  pasta_destino_azure?: string | null;
  mapeamento_variaveis?: Record<string, string> | null;
}

export interface ProcessoTemplate {
  id: number;
  nome: string;
  tipo_processo: string;
  descricao?: string | null;
  estado: string;
  versao: number;
  criado_por_id?: number | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
}

export interface ProcessoTemplateCompleto extends ProcessoTemplate {
  passos: TemplatePasso[];
  tarefas_automaticas: TemplateTarefa[];
  documentos_automaticos: TemplateDocumento[];
}

const QK = 'processo-templates';

// ── Queries ─────────────────────────────────────────────────────────────

export function useTemplatesList(filtros?: { tipo_processo?: string; estado?: string }) {
  return useQuery<ProcessoTemplate[]>({
    queryKey: [QK, 'list', filtros],
    queryFn: async () => (await processoTemplates.list(filtros)).data,
  });
}

export function useTemplate(id: number | null) {
  return useQuery<ProcessoTemplateCompleto>({
    queryKey: [QK, 'detail', id],
    queryFn: async () => (await processoTemplates.get(id!)).data,
    enabled: !!id,
  });
}

// ── Mutations ───────────────────────────────────────────────────────────

export function useTemplateMutations() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const invalidate = () => qc.invalidateQueries({ queryKey: [QK] });

  const create = useMutation({
    mutationFn: (data: any) => processoTemplates.create(data).then(r => r.data),
    onSuccess: () => { invalidate(); toast({ title: 'Template criado' }); },
    onError: () => toast({ title: 'Erro ao criar template', variant: 'destructive' }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => processoTemplates.update(id, data).then(r => r.data),
    onSuccess: () => invalidate(),
  });

  const ativar = useMutation({
    mutationFn: (id: number) => processoTemplates.ativar(id).then(r => r.data),
    onSuccess: () => { invalidate(); toast({ title: 'Template activado' }); },
    onError: (e: any) => toast({ title: 'Erro', description: e?.response?.data?.detail, variant: 'destructive' }),
  });

  const arquivar = useMutation({
    mutationFn: (id: number) => processoTemplates.arquivar(id).then(r => r.data),
    onSuccess: () => { invalidate(); toast({ title: 'Template arquivado' }); },
  });

  const duplicar = useMutation({
    mutationFn: (id: number) => processoTemplates.duplicar(id).then(r => r.data),
    onSuccess: () => { invalidate(); toast({ title: 'Template duplicado' }); },
  });

  const remove = useMutation({
    mutationFn: (id: number) => processoTemplates.delete(id),
    onSuccess: () => { invalidate(); toast({ title: 'Template apagado' }); },
    onError: (e: any) => toast({ title: 'Erro', description: e?.response?.data?.detail, variant: 'destructive' }),
  });

  // Passos
  const createPasso = useMutation({
    mutationFn: ({ tid, data }: { tid: number; data: any }) => processoTemplates.createPasso(tid, data).then(r => r.data),
    onSuccess: () => invalidate(),
  });
  const updatePasso = useMutation({
    mutationFn: ({ tid, pid, data }: { tid: number; pid: number; data: any }) => processoTemplates.updatePasso(tid, pid, data).then(r => r.data),
    onSuccess: () => invalidate(),
  });
  const deletePasso = useMutation({
    mutationFn: ({ tid, pid }: { tid: number; pid: number }) => processoTemplates.deletePasso(tid, pid),
    onSuccess: () => invalidate(),
  });
  const reordenarPassos = useMutation({
    mutationFn: ({ tid, ordem }: { tid: number; ordem: number[] }) => processoTemplates.reordenarPassos(tid, ordem),
    onSuccess: () => invalidate(),
  });

  // Campos
  const createCampo = useMutation({
    mutationFn: ({ tid, pid, data }: { tid: number; pid: number; data: any }) => processoTemplates.createCampo(tid, pid, data).then(r => r.data),
    onSuccess: () => invalidate(),
  });
  const updateCampo = useMutation({
    mutationFn: ({ tid, pid, cid, data }: { tid: number; pid: number; cid: number; data: any }) => processoTemplates.updateCampo(tid, pid, cid, data).then(r => r.data),
    onSuccess: () => invalidate(),
  });
  const deleteCampo = useMutation({
    mutationFn: ({ tid, pid, cid }: { tid: number; pid: number; cid: number }) => processoTemplates.deleteCampo(tid, pid, cid),
    onSuccess: () => invalidate(),
  });
  const reordenarCampos = useMutation({
    mutationFn: ({ tid, pid, ordem }: { tid: number; pid: number; ordem: number[] }) => processoTemplates.reordenarCampos(tid, pid, ordem),
    onSuccess: () => invalidate(),
  });

  // Tarefas
  const createTarefa = useMutation({
    mutationFn: ({ tid, data }: { tid: number; data: any }) => processoTemplates.createTarefa(tid, data).then(r => r.data),
    onSuccess: () => invalidate(),
  });
  const updateTarefa = useMutation({
    mutationFn: ({ tid, tarefaId, data }: { tid: number; tarefaId: number; data: any }) => processoTemplates.updateTarefa(tid, tarefaId, data).then(r => r.data),
    onSuccess: () => invalidate(),
  });
  const deleteTarefa = useMutation({
    mutationFn: ({ tid, tarefaId }: { tid: number; tarefaId: number }) => processoTemplates.deleteTarefa(tid, tarefaId),
    onSuccess: () => invalidate(),
  });

  // Documentos
  const createDoc = useMutation({
    mutationFn: ({ tid, data }: { tid: number; data: any }) => processoTemplates.createDoc(tid, data).then(r => r.data),
    onSuccess: () => invalidate(),
  });
  const updateDoc = useMutation({
    mutationFn: ({ tid, docId, data }: { tid: number; docId: number; data: any }) => processoTemplates.updateDoc(tid, docId, data).then(r => r.data),
    onSuccess: () => invalidate(),
  });
  const deleteDoc = useMutation({
    mutationFn: ({ tid, docId }: { tid: number; docId: number }) => processoTemplates.deleteDoc(tid, docId),
    onSuccess: () => invalidate(),
  });

  return {
    create, update, ativar, arquivar, duplicar, remove,
    createPasso, updatePasso, deletePasso, reordenarPassos,
    createCampo, updateCampo, deleteCampo, reordenarCampos,
    createTarefa, updateTarefa, deleteTarefa,
    createDoc, updateDoc, deleteDoc,
  };
}
