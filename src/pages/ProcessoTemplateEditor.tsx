import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Archive, ArrowLeft, CheckCircle, Eye, FileText, GripVertical, ListChecks,
  Loader2, Plus, Save, Settings, Trash2,
} from 'lucide-react';
import {
  useTemplate, useTemplateMutations,
  TemplatePasso, TemplateCampo, TemplateTarefa, TemplateDocumento,
} from '@/hooks/useProcessoTemplates';

const CAMPO_TIPOS = [
  { value: 'texto', label: 'Texto' },
  { value: 'numero', label: 'Número' },
  { value: 'data', label: 'Data' },
  { value: 'selecao', label: 'Seleção' },
  { value: 'multi_selecao', label: 'Multi-Seleção' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'nif', label: 'NIF' },
  { value: 'iban', label: 'IBAN' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'email', label: 'Email' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'ficheiro', label: 'Ficheiro' },
];

// ── Sortable Item ───────────────────────────────────────────────────────

function SortableItem({ id, children }: { id: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" {...attributes} {...listeners} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export function ProcessoTemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const templateId = id ? parseInt(id) : null;
  const navigate = useNavigate();

  const { data: template, isLoading } = useTemplate(templateId);
  const mutations = useTemplateMutations();

  const [selectedPassoId, setSelectedPassoId] = useState<number | null>(null);
  const [selectedCampoId, setSelectedCampoId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number; name: string } | null>(null);

  // Auto-select first passo
  useEffect(() => {
    if (template?.passos?.length && !selectedPassoId) {
      setSelectedPassoId(template.passos[0].id);
    }
  }, [template?.passos, selectedPassoId]);

  const selectedPasso = useMemo(
    () => template?.passos?.find(p => p.id === selectedPassoId),
    [template?.passos, selectedPassoId],
  );
  const selectedCampo = useMemo(
    () => selectedPasso?.campos?.find(c => c.id === selectedCampoId),
    [selectedPasso?.campos, selectedCampoId],
  );

  // Debounced save
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const debouncedSave = useCallback((fn: () => void) => {
    setSaveStatus('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fn();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  }, []);

  const handleUpdateTemplate = (field: string, value: string) => {
    if (!templateId) return;
    debouncedSave(() => mutations.update.mutate({ id: templateId, data: { [field]: value } }));
  };

  // Campo keys disponíveis para variáveis
  const allCampoKeys = useMemo(
    () => (template?.passos || []).flatMap(p => p.campos.map(c => c.campo_key)),
    [template?.passos],
  );

  if (isLoading || !template) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  const estadoBadge = template.estado === 'ativo'
    ? { variant: 'default' as const, label: 'Ativo' }
    : template.estado === 'arquivado'
      ? { variant: 'outline' as const, label: 'Arquivado' }
      : { variant: 'secondary' as const, label: 'Rascunho' };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/processo-templates')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Input
          className="text-lg font-bold border-none shadow-none h-auto p-0 focus-visible:ring-0 max-w-md"
          defaultValue={template.nome}
          onBlur={(e) => handleUpdateTemplate('nome', e.target.value)}
        />
        <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
        <span className="text-xs text-muted-foreground">v{template.versao}</span>

        <div className="ml-auto flex items-center gap-2">
          {saveStatus === 'saving' && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />A guardar...</span>}
          {saveStatus === 'saved' && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Guardado</span>}

          {template.estado === 'rascunho' && (
            <Button size="sm" variant="outline" onClick={() => mutations.ativar.mutate(templateId!)}>
              <CheckCircle className="h-4 w-4 mr-1" /> Ativar
            </Button>
          )}
          {template.estado === 'ativo' && (
            <Button size="sm" variant="outline" onClick={() => mutations.arquivar.mutate(templateId!)}>
              <Archive className="h-4 w-4 mr-1" /> Arquivar
            </Button>
          )}
        </div>
      </div>

      {/* Tipo de processo */}
      <div className="flex items-center gap-4">
        <Label className="text-sm text-muted-foreground">Tipo de processo:</Label>
        <Input
          className="max-w-xs"
          defaultValue={template.tipo_processo}
          onBlur={(e) => handleUpdateTemplate('tipo_processo', e.target.value)}
        />
        <Label className="text-sm text-muted-foreground ml-4">Descrição:</Label>
        <Input
          className="flex-1"
          defaultValue={template.descricao || ''}
          placeholder="Descrição do template..."
          onBlur={(e) => handleUpdateTemplate('descricao', e.target.value)}
        />
      </div>

      <Separator />

      {/* Main tabs */}
      <Tabs defaultValue="passos" className="w-full">
        <TabsList>
          <TabsTrigger value="passos"><ListChecks className="h-4 w-4 mr-1" />Passos e Campos</TabsTrigger>
          <TabsTrigger value="tarefas"><Settings className="h-4 w-4 mr-1" />Tarefas Automáticas</TabsTrigger>
          <TabsTrigger value="documentos"><FileText className="h-4 w-4 mr-1" />Documentos Automáticos</TabsTrigger>
          <TabsTrigger value="preview"><Eye className="h-4 w-4 mr-1" />Pré-visualizar</TabsTrigger>
        </TabsList>

        {/* ── PASSOS E CAMPOS ────────────────────────────────────── */}
        <TabsContent value="passos" className="mt-4">
          <div className="grid grid-cols-[250px_1fr_300px] gap-4 min-h-[500px]">
            {/* Left: Passos list */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Passos</CardTitle>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                    mutations.createPasso.mutate({
                      tid: templateId!,
                      data: { titulo: `Passo ${(template.passos?.length || 0) + 1}`, ordem: template.passos?.length || 0 },
                    });
                  }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <DndContext collisionDetection={closestCenter} onDragEnd={(e: DragEndEvent) => {
                  const { active, over } = e;
                  if (over && active.id !== over.id) {
                    const ids = (template.passos || []).map(p => p.id);
                    const oldIndex = ids.indexOf(Number(active.id));
                    const newIndex = ids.indexOf(Number(over.id));
                    const newOrder = arrayMove(ids, oldIndex, newIndex);
                    mutations.reordenarPassos.mutate({ tid: templateId!, ordem: newOrder });
                  }
                }}>
                  <SortableContext items={(template.passos || []).map(p => p.id)} strategy={verticalListSortingStrategy}>
                    {(template.passos || []).map(passo => (
                      <SortableItem key={passo.id} id={passo.id}>
                        <button
                          className={`w-full text-left text-sm p-2 rounded-md ${selectedPassoId === passo.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                          onClick={() => { setSelectedPassoId(passo.id); setSelectedCampoId(null); }}
                        >
                          {passo.titulo}
                          {passo.opcional && <span className="text-xs text-muted-foreground ml-1">(opcional)</span>}
                          <span className="text-xs text-muted-foreground block">{passo.campos.length} campos</span>
                        </button>
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>

            {/* Center: Campos do passo selecionado */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {selectedPasso ? `Campos — ${selectedPasso.titulo}` : 'Selecione um passo'}
                  </CardTitle>
                  {selectedPasso && (
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                        mutations.createCampo.mutate({
                          tid: templateId!, pid: selectedPasso.id,
                          data: { campo_key: `campo_${Date.now()}`, label: 'Novo Campo', tipo: 'texto', ordem: selectedPasso.campos.length },
                        });
                      }}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() =>
                        setDeleteTarget({ type: 'passo', id: selectedPasso.id, name: selectedPasso.titulo })
                      }>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {selectedPasso && (
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      className="text-sm h-8"
                      defaultValue={selectedPasso.titulo}
                      onBlur={(e) => debouncedSave(() => mutations.updatePasso.mutate({
                        tid: templateId!, pid: selectedPasso.id, data: { titulo: e.target.value },
                      }))}
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch
                        checked={selectedPasso.opcional}
                        onCheckedChange={(v) => mutations.updatePasso.mutate({
                          tid: templateId!, pid: selectedPasso.id, data: { opcional: v },
                        })}
                      />
                      <span className="text-xs text-muted-foreground">Opcional</span>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedPasso && (
                  <DndContext collisionDetection={closestCenter} onDragEnd={(e: DragEndEvent) => {
                    const { active, over } = e;
                    if (over && active.id !== over.id) {
                      const ids = selectedPasso.campos.map(c => c.id);
                      const oldIndex = ids.indexOf(Number(active.id));
                      const newIndex = ids.indexOf(Number(over.id));
                      const newOrder = arrayMove(ids, oldIndex, newIndex);
                      mutations.reordenarCampos.mutate({ tid: templateId!, pid: selectedPasso.id, ordem: newOrder });
                    }
                  }}>
                    <SortableContext items={selectedPasso.campos.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      {selectedPasso.campos.map(campo => (
                        <SortableItem key={campo.id} id={campo.id}>
                          <button
                            className={`w-full text-left p-2 rounded-md border text-sm ${selectedCampoId === campo.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}
                            onClick={() => setSelectedCampoId(campo.id)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{campo.label}</span>
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">{campo.tipo}</Badge>
                                {campo.obrigatorio && <span className="text-red-500 text-xs">*</span>}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">{campo.campo_key}</span>
                          </button>
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
                {selectedPasso && !selectedPasso.campos.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">Sem campos. Adicione um campo com o botão +.</p>
                )}
              </CardContent>
            </Card>

            {/* Right: Campo editor */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {selectedCampo ? 'Editar Campo' : 'Selecione um campo'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedCampo && selectedPasso && (
                  <>
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input defaultValue={selectedCampo.label} onBlur={(e) => debouncedSave(() =>
                        mutations.updateCampo.mutate({ tid: templateId!, pid: selectedPasso.id, cid: selectedCampo.id, data: { label: e.target.value } })
                      )} />
                    </div>
                    <div>
                      <Label className="text-xs">Chave (campo_key)</Label>
                      <Input defaultValue={selectedCampo.campo_key} onBlur={(e) => debouncedSave(() =>
                        mutations.updateCampo.mutate({ tid: templateId!, pid: selectedPasso.id, cid: selectedCampo.id, data: { campo_key: e.target.value } })
                      )} />
                    </div>
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <Select defaultValue={selectedCampo.tipo} onValueChange={(v) =>
                        mutations.updateCampo.mutate({ tid: templateId!, pid: selectedPasso.id, cid: selectedCampo.id, data: { tipo: v } })
                      }>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CAMPO_TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Placeholder</Label>
                      <Input defaultValue={selectedCampo.placeholder || ''} onBlur={(e) => debouncedSave(() =>
                        mutations.updateCampo.mutate({ tid: templateId!, pid: selectedPasso.id, cid: selectedCampo.id, data: { placeholder: e.target.value || null } })
                      )} />
                    </div>
                    <div>
                      <Label className="text-xs">Tooltip</Label>
                      <Input defaultValue={selectedCampo.tooltip || ''} onBlur={(e) => debouncedSave(() =>
                        mutations.updateCampo.mutate({ tid: templateId!, pid: selectedPasso.id, cid: selectedCampo.id, data: { tooltip: e.target.value || null } })
                      )} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={selectedCampo.obrigatorio} onCheckedChange={(v) =>
                        mutations.updateCampo.mutate({ tid: templateId!, pid: selectedPasso.id, cid: selectedCampo.id, data: { obrigatorio: v } })
                      } />
                      <Label className="text-xs">Obrigatório</Label>
                    </div>
                    <Separator />
                    <Button size="sm" variant="destructive" className="w-full" onClick={() =>
                      setDeleteTarget({ type: 'campo', id: selectedCampo.id, name: selectedCampo.label })
                    }>
                      <Trash2 className="h-4 w-4 mr-1" /> Apagar campo
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAREFAS AUTOMÁTICAS ─────────────────────────────── */}
        <TabsContent value="tarefas" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Tarefas criadas automaticamente</CardTitle>
                <Button size="sm" variant="outline" onClick={() => {
                  mutations.createTarefa.mutate({
                    tid: templateId!,
                    data: { titulo_template: 'Nova tarefa', prioridade: 'normal', ordem: template.tarefas_automaticas?.length || 0 },
                  });
                }}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(template.tarefas_automaticas || []).map(tarefa => (
                <div key={tarefa.id} className="p-3 rounded-md border space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      className="flex-1"
                      defaultValue={tarefa.titulo_template}
                      placeholder="Título (use {{campo_key}} para variáveis)"
                      onBlur={(e) => debouncedSave(() =>
                        mutations.updateTarefa.mutate({ tid: templateId!, tarefaId: tarefa.id, data: { titulo_template: e.target.value } })
                      )}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() =>
                      setDeleteTarget({ type: 'tarefa', id: tarefa.id, name: tarefa.titulo_template })
                    }>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <Label className="text-xs">Prazo (dias)</Label>
                      <Input type="number" className="w-20 h-8" defaultValue={tarefa.prazo_dias ?? ''} onBlur={(e) => debouncedSave(() =>
                        mutations.updateTarefa.mutate({ tid: templateId!, tarefaId: tarefa.id, data: { prazo_dias: e.target.value ? parseInt(e.target.value) : null } })
                      )} />
                    </div>
                    <div>
                      <Label className="text-xs">Prioridade</Label>
                      <Select defaultValue={tarefa.prioridade} onValueChange={(v) =>
                        mutations.updateTarefa.mutate({ tid: templateId!, tarefaId: tarefa.id, data: { prioridade: v } })
                      }>
                        <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {allCampoKeys.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Variáveis: {allCampoKeys.map(k => `{{${k}}}`).join(', ')}
                    </p>
                  )}
                </div>
              ))}
              {!(template.tarefas_automaticas || []).length && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa automática configurada.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── DOCUMENTOS AUTOMÁTICOS ──────────────────────────── */}
        <TabsContent value="documentos" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Documentos gerados automaticamente</CardTitle>
                <Button size="sm" variant="outline" onClick={() => {
                  mutations.createDoc.mutate({
                    tid: templateId!,
                    data: { nome_ficheiro_template: 'Novo documento', ordem: template.documentos_automaticos?.length || 0 },
                  });
                }}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(template.documentos_automaticos || []).map(doc => (
                <div key={doc.id} className="p-3 rounded-md border space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      className="flex-1"
                      defaultValue={doc.nome_ficheiro_template}
                      placeholder="Nome do ficheiro (use {{campo_key}} para variáveis)"
                      onBlur={(e) => debouncedSave(() =>
                        mutations.updateDoc.mutate({ tid: templateId!, docId: doc.id, data: { nome_ficheiro_template: e.target.value } })
                      )}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive shrink-0" onClick={() =>
                      setDeleteTarget({ type: 'documento', id: doc.id, name: doc.nome_ficheiro_template })
                    }>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Pasta destino Azure</Label>
                      <Input defaultValue={doc.pasta_destino_azure || ''} placeholder="subpasta/" onBlur={(e) => debouncedSave(() =>
                        mutations.updateDoc.mutate({ tid: templateId!, docId: doc.id, data: { pasta_destino_azure: e.target.value || null } })
                      )} />
                    </div>
                    <div>
                      <Label className="text-xs">Template DOCX path</Label>
                      <Input defaultValue={doc.docx_template_path || ''} placeholder="templates/modelo.docx" onBlur={(e) => debouncedSave(() =>
                        mutations.updateDoc.mutate({ tid: templateId!, docId: doc.id, data: { docx_template_path: e.target.value || null } })
                      )} />
                    </div>
                  </div>
                </div>
              ))}
              {!(template.documentos_automaticos || []).length && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum documento automático configurado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PRÉ-VISUALIZAÇÃO ────────────────────────────────── */}
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pré-visualização do Wizard</CardTitle>
            </CardHeader>
            <CardContent>
              {(template.passos || []).map((passo, i) => (
                <div key={passo.id} className="mb-6">
                  <h3 className="font-medium text-sm mb-3">
                    Passo {i + 1}: {passo.titulo}
                    {passo.opcional && <span className="text-muted-foreground ml-1">(opcional)</span>}
                  </h3>
                  {passo.descricao && <p className="text-xs text-muted-foreground mb-3">{passo.descricao}</p>}
                  <div className="grid grid-cols-2 gap-3">
                    {passo.campos.map(campo => (
                      <div key={campo.id}>
                        <Label className="text-xs">
                          {campo.label}
                          {campo.obrigatorio && <span className="text-red-500 ml-0.5">*</span>}
                        </Label>
                        {campo.tipo === 'textarea' ? (
                          <Textarea placeholder={campo.placeholder || ''} disabled className="mt-1" />
                        ) : campo.tipo === 'checkbox' ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Switch disabled />
                            <span className="text-sm text-muted-foreground">{campo.label}</span>
                          </div>
                        ) : campo.tipo === 'selecao' ? (
                          <Select disabled>
                            <SelectTrigger className="mt-1"><SelectValue placeholder={campo.placeholder || 'Selecionar...'} /></SelectTrigger>
                            <SelectContent>
                              {(campo.opcoes || []).map((o, idx) => (
                                <SelectItem key={idx} value={o.valor}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            className="mt-1"
                            type={campo.tipo === 'numero' ? 'number' : campo.tipo === 'data' ? 'date' : campo.tipo === 'email' ? 'email' : 'text'}
                            placeholder={campo.placeholder || ''}
                            disabled
                          />
                        )}
                        {campo.tooltip && <p className="text-xs text-muted-foreground mt-0.5">{campo.tooltip}</p>}
                      </div>
                    ))}
                  </div>
                  {i < (template.passos || []).length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
              {!(template.passos || []).length && (
                <p className="text-sm text-muted-foreground text-center py-8">Adicione passos e campos para ver a pré-visualização.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar {deleteTarget?.type}</AlertDialogTitle>
            <AlertDialogDescription>Tem a certeza que quer apagar "{deleteTarget?.name}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => {
              if (!deleteTarget) return;
              const { type, id: targetId } = deleteTarget;
              if (type === 'passo') {
                mutations.deletePasso.mutate({ tid: templateId!, pid: targetId });
                if (selectedPassoId === targetId) setSelectedPassoId(null);
              } else if (type === 'campo' && selectedPasso) {
                mutations.deleteCampo.mutate({ tid: templateId!, pid: selectedPasso.id, cid: targetId });
                if (selectedCampoId === targetId) setSelectedCampoId(null);
              } else if (type === 'tarefa') {
                mutations.deleteTarefa.mutate({ tid: templateId!, tarefaId: targetId });
              } else if (type === 'documento') {
                mutations.deleteDoc.mutate({ tid: templateId!, docId: targetId });
              }
              setDeleteTarget(null);
            }}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
