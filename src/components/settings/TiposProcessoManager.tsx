import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, GripVertical, CheckSquare, DollarSign, FileText, ListTodo, Layers } from 'lucide-react';
import {
  useTiposProcesso,
  useTipoProcesso,
  useTiposProcessoMutations,
  TipoProcesso,
  ChecklistItem,
  OrcamentoItem,
  DocTemplateItem,
  TarefaItem,
  WizardConfig,
} from '@/hooks/useTiposProcesso';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { WizardBlockEditor } from './WizardBlockEditor';

interface DocTemplate {
  id: number;
  nome: string;
  categoria?: string;
}

export const TiposProcessoManager: React.FC = () => {
  const { data: tipos = [], isLoading } = useTiposProcesso();
  const { createTipo, updateTipo, deleteTipo } = useTiposProcessoMutations();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Tipos de Processo</h2>
          <p className="text-sm text-muted-foreground">
            Configure os tipos de processo disponíveis, cada um com checklist, orçamento base, tarefas e templates de documentos.
          </p>
        </div>
        <Button onClick={() => { setEditingId(null); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">A carregar...</p>
      ) : tipos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum tipo de processo configurado. Crie o primeiro clicando em "Novo Tipo".
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tipos.map((tipo) => (
            <Card key={tipo.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{tipo.nome}</span>
                    {!tipo.ativo && <Badge variant="secondary">Inativo</Badge>}
                  </div>
                  {tipo.descricao && (
                    <p className="text-sm text-muted-foreground mt-1">{tipo.descricao}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingId(tipo.id); setIsFormOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600"
                    onClick={() => {
                      if (confirm(`Eliminar tipo "${tipo.nome}"? Esta ação é irreversível.`)) {
                        deleteTipo.mutate(tipo.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isFormOpen && (
        <TipoProcessoFormModal
          tipoId={editingId}
          onClose={() => { setIsFormOpen(false); setEditingId(null); }}
          onCreate={(data) => createTipo.mutateAsync(data as any).then(() => { setIsFormOpen(false); setEditingId(null); })}
          onUpdate={(id, data) => updateTipo.mutateAsync({ id, ...data } as any).then(() => { setIsFormOpen(false); setEditingId(null); })}
        />
      )}
    </div>
  );
};

// ── Form Modal ──────────────────────────────────────────────────────────

interface TipoProcessoFormModalProps {
  tipoId: number | null;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
  onUpdate: (id: number, data: any) => Promise<void>;
}

const TipoProcessoFormModal: React.FC<TipoProcessoFormModalProps> = ({ tipoId, onClose, onCreate, onUpdate }) => {
  const { data: existing } = useTipoProcesso(tipoId);
  const { data: docTemplates = [] } = useQuery<DocTemplate[]>({
    queryKey: ['documento-templates-list'],
    queryFn: async () => {
      const res = await api.get('/documento-templates');
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [orcamento, setOrcamento] = useState<OrcamentoItem[]>([]);
  const [docTemplateItems, setDocTemplateItems] = useState<DocTemplateItem[]>([]);
  const [tarefas, setTarefas] = useState<TarefaItem[]>([]);
  const [wizardConfig, setWizardConfig] = useState<WizardConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate when editing
  React.useEffect(() => {
    if (existing && tipoId) {
      setNome(existing.nome);
      setDescricao(existing.descricao || '');
      setAtivo(existing.ativo);
      setChecklist(existing.checklist_items || []);
      setOrcamento(existing.orcamento_items || []);
      setDocTemplateItems(existing.documento_templates || []);
      setTarefas(existing.tarefas || []);
      setWizardConfig(existing.wizard_config || null);
    }
  }, [existing, tipoId]);

  const handleSubmit = async () => {
    if (!nome.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        ativo,
        wizard_config: wizardConfig,
        checklist_items: checklist.map((c, i) => ({ titulo: c.titulo, descricao: c.descricao, ordem: i })),
        orcamento_items: orcamento.map((o, i) => ({ descricao: o.descricao, valor: o.valor, ordem: i })),
        documento_templates: docTemplateItems.map((d, i) => ({ documento_template_id: d.documento_template_id, ordem: i })),
        tarefas: tarefas.map((t, i) => ({ titulo: t.titulo, descricao: t.descricao, ordem: i, prioridade: t.prioridade, prazo_dias: t.prazo_dias, tipo: t.tipo })),
      };
      if (tipoId) {
        await onUpdate(tipoId, payload);
      } else {
        await onCreate(payload);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tipoId ? 'Editar Tipo de Processo' : 'Novo Tipo de Processo'}</DialogTitle>
        </DialogHeader>

        {/* Nome e Descrição - sempre visível */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Escritura" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição opcional" />
          </div>
        </div>

        <Tabs defaultValue="wizard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="wizard" className="text-xs gap-1">
              <Layers className="h-3.5 w-3.5" />
              Wizard
            </TabsTrigger>
            <TabsTrigger value="checklist-tarefas" className="text-xs gap-1">
              <CheckSquare className="h-3.5 w-3.5" />
              Checklist / Tarefas
            </TabsTrigger>
            <TabsTrigger value="orcamento" className="text-xs gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              Orcamento
            </TabsTrigger>
            <TabsTrigger value="documentos" className="text-xs gap-1">
              <FileText className="h-3.5 w-3.5" />
              Documentos
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Wizard ─────────────────────────────────────────── */}
          <TabsContent value="wizard" className="mt-4">
            <WizardBlockEditor value={wizardConfig} onChange={setWizardConfig} />
          </TabsContent>

          {/* ── Tab: Checklist & Tarefas ────────────────────────────── */}
          <TabsContent value="checklist-tarefas" className="mt-4 space-y-6">
            {/* Checklist */}
            <CollectionEditor
              title="Checklist"
              icon={<CheckSquare className="h-4 w-4" />}
              items={checklist}
              onAdd={() => setChecklist([...checklist, { titulo: '', ordem: checklist.length }])}
              onRemove={(i) => setChecklist(checklist.filter((_, idx) => idx !== i))}
              onUpdate={(i, field, value) => {
                const next = [...checklist];
                (next[i] as any)[field] = value;
                setChecklist(next);
              }}
              fields={[
                { key: 'titulo', label: 'Item', placeholder: 'Ex: Verificar documentação' },
              ]}
            />

            {/* Tarefas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ListTodo className="h-4 w-4" />
                  Tarefas
                  {tarefas.length > 0 && <Badge variant="secondary">{tarefas.length}</Badge>}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setTarefas([...tarefas, { titulo: '', ordem: tarefas.length }])}>
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              {tarefas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tarefa.</p>
              ) : (
                <div className="space-y-3">
                  {tarefas.map((t, i) => (
                    <div key={i} className="rounded-md border p-3 space-y-2 bg-muted/20">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Titulo da tarefa *"
                          value={t.titulo}
                          onChange={(e) => { const next = [...tarefas]; next[i] = { ...next[i], titulo: e.target.value }; setTarefas(next); }}
                          className="flex-1"
                        />
                        <Button variant="ghost" size="sm" className="text-red-500 shrink-0" onClick={() => setTarefas(tarefas.filter((_, idx) => idx !== i))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Descrição (opcional)"
                        value={t.descricao || ''}
                        onChange={(e) => { const next = [...tarefas]; next[i] = { ...next[i], descricao: e.target.value }; setTarefas(next); }}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Prioridade</Label>
                          <select
                            className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
                            value={t.prioridade || ''}
                            onChange={(e) => { const next = [...tarefas]; next[i] = { ...next[i], prioridade: e.target.value || undefined }; setTarefas(next); }}
                          >
                            <option value="">—</option>
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="baixa">Baixa</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Prazo (dias)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Ex: 7"
                            value={t.prazo_dias ?? ''}
                            onChange={(e) => { const next = [...tarefas]; next[i] = { ...next[i], prazo_dias: e.target.value ? Number(e.target.value) : undefined }; setTarefas(next); }}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Tipo</Label>
                          <Input
                            placeholder="Ex: Diligencia"
                            value={t.tipo || ''}
                            onChange={(e) => { const next = [...tarefas]; next[i] = { ...next[i], tipo: e.target.value || undefined }; setTarefas(next); }}
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Tab: Orcamento ──────────────────────────────────────── */}
          <TabsContent value="orcamento" className="mt-4">
            <CollectionEditor
              title="Orcamento Base"
              icon={<DollarSign className="h-4 w-4" />}
              items={orcamento}
              onAdd={() => setOrcamento([...orcamento, { descricao: '', valor: undefined, ordem: orcamento.length }])}
              onRemove={(i) => setOrcamento(orcamento.filter((_, idx) => idx !== i))}
              onUpdate={(i, field, value) => {
                const next = [...orcamento];
                (next[i] as any)[field] = field === 'valor' ? (value ? Number(value) : undefined) : value;
                setOrcamento(next);
              }}
              fields={[
                { key: 'descricao', label: 'Descrição', placeholder: 'Ex: Emolumentos' },
                { key: 'valor', label: 'Valor (EUR)', placeholder: '0.00', type: 'number' },
              ]}
            />
          </TabsContent>

          {/* ── Tab: Documentos ─────────────────────────────────────── */}
          <TabsContent value="documentos" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Templates de Documento
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDocTemplateItems([...docTemplateItems, { documento_template_id: 0, ordem: docTemplateItems.length }])}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              {docTemplateItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum template associado.</p>
              ) : (
                <div className="space-y-2">
                  {docTemplateItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={item.documento_template_id || ''}
                        onChange={(e) => {
                          const next = [...docTemplateItems];
                          next[i] = { ...next[i], documento_template_id: Number(e.target.value) };
                          setDocTemplateItems(next);
                        }}
                      >
                        <option value="">Selecione um template...</option>
                        {docTemplates.map((dt) => (
                          <option key={dt.id} value={dt.id}>{dt.nome}</option>
                        ))}
                      </select>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setDocTemplateItems(docTemplateItems.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !nome.trim()}>
            {isSubmitting ? 'A guardar...' : tipoId ? 'Guardar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Collection Editor ───────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  type?: string;
  optional?: boolean;
}

interface CollectionEditorProps {
  title: string;
  icon: React.ReactNode;
  items: any[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, field: string, value: any) => void;
  fields: FieldDef[];
}

const CollectionEditor: React.FC<CollectionEditorProps> = ({ title, icon, items, onAdd, onRemove, onUpdate, fields }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
        {items.length > 0 && <Badge variant="secondary">{items.length}</Badge>}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-3 w-3 mr-1" />
        Adicionar
      </Button>
    </div>
    {items.length === 0 ? (
      <p className="text-sm text-muted-foreground">Nenhum item.</p>
    ) : (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            {fields.map((f) => (
              <Input
                key={f.key}
                type={f.type || 'text'}
                step={f.type === 'number' ? '0.01' : undefined}
                placeholder={f.placeholder}
                value={item[f.key] ?? ''}
                onChange={(e) => onUpdate(i, f.key, e.target.value)}
                className="flex-1"
              />
            ))}
            <Button variant="ghost" size="sm" className="text-red-500 shrink-0" onClick={() => onRemove(i)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    )}
  </div>
);
