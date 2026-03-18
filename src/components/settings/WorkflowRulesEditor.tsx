import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, ShieldCheck, FileCheck, Lock } from 'lucide-react';
import { RegraValidacao, DocObrigatorio, BloqueioConfig } from '@/hooks/useTiposProcesso';

interface WorkflowRulesEditorProps {
  estadosWorkflow: string[];
  onEstadosChange: (estados: string[]) => void;
  regrasValidacao: RegraValidacao[];
  onRegrasChange: (regras: RegraValidacao[]) => void;
  docsObrigatorios: DocObrigatorio[];
  onDocsChange: (docs: DocObrigatorio[]) => void;
  bloqueios: BloqueioConfig[];
  onBloqueiosChange: (bloqueios: BloqueioConfig[]) => void;
  customFields?: { key: string; label: string }[];
}

const CATEGORIAS_VALIDACAO = [
  { value: 'identidade', label: 'Identidade' },
  { value: 'poderes', label: 'Poderes/Representação' },
  { value: 'fiscal', label: 'Fiscal' },
  { value: 'registral', label: 'Registral' },
  { value: 'compliance', label: 'Compliance/AML' },
  { value: 'documental', label: 'Documental' },
  { value: 'geral', label: 'Geral' },
];

export const WorkflowRulesEditor: React.FC<WorkflowRulesEditorProps> = ({
  estadosWorkflow, onEstadosChange,
  regrasValidacao, onRegrasChange,
  docsObrigatorios, onDocsChange,
  bloqueios, onBloqueiosChange,
  customFields = [],
}) => {
  const [newEstado, setNewEstado] = useState('');
  const [activeSection, setActiveSection] = useState<'estados' | 'regras' | 'docs' | 'bloqueios'>('estados');

  // ── Estados Workflow ─────────────────────────────────────
  const addEstado = () => {
    if (!newEstado.trim()) return;
    onEstadosChange([...estadosWorkflow, newEstado.trim()]);
    setNewEstado('');
  };

  const removeEstado = (idx: number) => {
    onEstadosChange(estadosWorkflow.filter((_, i) => i !== idx));
  };

  const moveEstado = (idx: number, dir: -1 | 1) => {
    const arr = [...estadosWorkflow];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    onEstadosChange(arr);
  };

  // ── Regras Validação ─────────────────────────────────────
  const addRegra = () => {
    const id = `regra_${Date.now()}`;
    onRegrasChange([...regrasValidacao, { id, nome: '', categoria: 'geral' }]);
  };

  const updateRegra = (idx: number, patch: Partial<RegraValidacao>) => {
    const arr = [...regrasValidacao];
    arr[idx] = { ...arr[idx], ...patch };
    onRegrasChange(arr);
  };

  const removeRegra = (idx: number) => {
    onRegrasChange(regrasValidacao.filter((_, i) => i !== idx));
  };

  // ── Docs Obrigatórios ────────────────────────────────────
  const addDoc = () => {
    const id = `doc_${Date.now()}`;
    onDocsChange([...docsObrigatorios, { id, nome: '', obrigatorio_para_estado: estadosWorkflow[1] || '' }]);
  };

  const updateDoc = (idx: number, patch: Partial<DocObrigatorio>) => {
    const arr = [...docsObrigatorios];
    arr[idx] = { ...arr[idx], ...patch };
    onDocsChange(arr);
  };

  const removeDoc = (idx: number) => {
    onDocsChange(docsObrigatorios.filter((_, i) => i !== idx));
  };

  // ── Bloqueios ────────────────────────────────────────────
  const addBloqueio = () => {
    const id = `bloq_${Date.now()}`;
    onBloqueiosChange([...bloqueios, { id, tipo: 'checklist_completa', bloqueia_estado: estadosWorkflow[1] || '', mensagem: '' }]);
  };

  const updateBloqueio = (idx: number, patch: Partial<BloqueioConfig>) => {
    const arr = [...bloqueios];
    arr[idx] = { ...arr[idx], ...patch };
    onBloqueiosChange(arr);
  };

  const removeBloqueio = (idx: number) => {
    onBloqueiosChange(bloqueios.filter((_, i) => i !== idx));
  };

  const sections = [
    { key: 'estados' as const, label: 'Estados Workflow', icon: GripVertical, count: estadosWorkflow.length },
    { key: 'regras' as const, label: 'Regras de Validação', icon: ShieldCheck, count: regrasValidacao.length },
    { key: 'docs' as const, label: 'Docs Obrigatórios', icon: FileCheck, count: docsObrigatorios.length },
    { key: 'bloqueios' as const, label: 'Bloqueios', icon: Lock, count: bloqueios.length },
  ];

  return (
    <div className="space-y-4">
      {/* Section tabs */}
      <div className="flex gap-2 flex-wrap">
        {sections.map(s => (
          <Button
            key={s.key}
            variant={activeSection === s.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection(s.key)}
            className="gap-1.5"
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
            {s.count > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{s.count}</Badge>}
          </Button>
        ))}
      </div>

      {/* ── Estados Workflow ── */}
      {activeSection === 'estados' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Estados do Workflow</CardTitle>
            <p className="text-xs text-muted-foreground">
              Define os estados pelos quais um processo passa (ex: Rascunho → Validado → Autenticado → Registado)
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {estadosWorkflow.map((estado, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Badge variant={idx === 0 ? 'default' : 'outline'} className="min-w-[24px] justify-center">{idx + 1}</Badge>
                <Input
                  value={estado}
                  onChange={(e) => {
                    const arr = [...estadosWorkflow];
                    arr[idx] = e.target.value;
                    onEstadosChange(arr);
                  }}
                  className="flex-1 h-8 text-sm"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveEstado(idx, -1)} disabled={idx === 0}>
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveEstado(idx, 1)} disabled={idx === estadosWorkflow.length - 1}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeEstado(idx)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="Novo estado..."
                value={newEstado}
                onChange={(e) => setNewEstado(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEstado()}
                className="h-8 text-sm"
              />
              <Button size="sm" onClick={addEstado} disabled={!newEstado.trim()}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Regras de Validação ── */}
      {activeSection === 'regras' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Regras de Validação</CardTitle>
            <p className="text-xs text-muted-foreground">
              Itens que devem ser validados antes de avançar (ex: identidade verificada, certidão permanente obtida)
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {regrasValidacao.map((regra, idx) => (
              <div key={regra.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Nome da validação (ex: Identidade do outorgante verificada)"
                      value={regra.nome}
                      onChange={(e) => updateRegra(idx, { nome: e.target.value })}
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Select value={regra.categoria || 'geral'} onValueChange={(v) => updateRegra(idx, { categoria: v })}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIAS_VALIDACAO.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        placeholder="Descrição (opcional)"
                        value={regra.descricao || ''}
                        onChange={(e) => updateRegra(idx, { descricao: e.target.value })}
                        className="h-8 text-xs flex-[2]"
                      />
                    </div>
                    {/* Condição opcional */}
                    {customFields.length > 0 && (
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">Só se</span>
                        <Select
                          value={regra.campo_condicao || 'sempre'}
                          onValueChange={(v) => updateRegra(idx, { campo_condicao: v === 'sempre' ? undefined : v, valor_condicao: v === 'sempre' ? undefined : regra.valor_condicao })}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Sempre" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sempre">Sempre aplicável</SelectItem>
                            {customFields.map(f => (
                              <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {regra.campo_condicao && (
                          <>
                            <span className="text-xs text-muted-foreground">=</span>
                            <Input
                              placeholder="valor..."
                              value={typeof regra.valor_condicao === 'string' ? regra.valor_condicao : ''}
                              onChange={(e) => updateRegra(idx, { valor_condicao: e.target.value })}
                              className="h-7 text-xs w-32"
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive mt-0.5" onClick={() => removeRegra(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={addRegra} className="w-full">
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Regra
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Docs Obrigatórios ── */}
      {activeSection === 'docs' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Documentos Obrigatórios</CardTitle>
            <p className="text-xs text-muted-foreground">
              Documentos que devem estar anexados antes de avançar para um estado (verificação por nome)
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {docsObrigatorios.map((doc, idx) => (
              <div key={doc.id} className="flex items-center gap-2 border rounded-lg p-2">
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="Nome do documento (ex: Certidão Predial)"
                    value={doc.nome}
                    onChange={(e) => updateDoc(idx, { nome: e.target.value })}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Keyword para verificar (ex: certidão)"
                      value={doc.keyword || ''}
                      onChange={(e) => updateDoc(idx, { keyword: e.target.value })}
                      className="h-7 text-xs flex-1"
                    />
                    <Select
                      value={doc.obrigatorio_para_estado || ''}
                      onValueChange={(v) => updateDoc(idx, { obrigatorio_para_estado: v })}
                    >
                      <SelectTrigger className="h-7 text-xs w-40">
                        <SelectValue placeholder="Para estado..." />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosWorkflow.map(e => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeDoc(idx)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={addDoc} className="w-full">
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Documento Obrigatório
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Bloqueios ── */}
      {activeSection === 'bloqueios' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Bloqueios de Avanço</CardTitle>
            <p className="text-xs text-muted-foreground">
              Condições que impedem avançar para um estado (ex: checklist 100% completa antes de autenticar)
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {bloqueios.map((bloq, idx) => (
              <div key={bloq.id} className="flex items-center gap-2 border rounded-lg p-2">
                <div className="flex-1 space-y-1">
                  <div className="flex gap-2">
                    <Select
                      value={bloq.tipo}
                      onValueChange={(v) => updateBloqueio(idx, { tipo: v as BloqueioConfig['tipo'] })}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checklist_completa">Checklist 100% completa</SelectItem>
                        <SelectItem value="validacoes_completas">Todas as validações concluídas</SelectItem>
                        <SelectItem value="docs_obrigatorios">Docs obrigatórios anexados</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={bloq.bloqueia_estado}
                      onValueChange={(v) => updateBloqueio(idx, { bloqueia_estado: v })}
                    >
                      <SelectTrigger className="h-8 text-xs w-40">
                        <SelectValue placeholder="Bloqueia estado..." />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosWorkflow.map(e => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Mensagem de bloqueio..."
                    value={bloq.mensagem}
                    onChange={(e) => updateBloqueio(idx, { mensagem: e.target.value })}
                    className="h-7 text-xs"
                  />
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeBloqueio(idx)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={addBloqueio} className="w-full">
              <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Bloqueio
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
