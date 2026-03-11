import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle2, Circle, XCircle, MinusCircle, AlertTriangle, ArrowRight,
  ShieldCheck, FileCheck, Lock, ChevronRight,
} from 'lucide-react';
import {
  useProcessoValidacoes,
  useWorkflowStatus,
  useProcessoValidacoesMutations,
  ProcessoValidacao,
} from '@/hooks/useProcessoValidacoes';

interface ProcessWorkflowTabProps {
  processoId: number;
}

const ESTADO_ICONS: Record<string, React.ReactNode> = {
  pendente: <Circle className="h-4 w-4 text-yellow-500" />,
  validado: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  nao_aplicavel: <MinusCircle className="h-4 w-4 text-gray-400" />,
  rejeitado: <XCircle className="h-4 w-4 text-red-500" />,
};

const ESTADO_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  validado: 'Validado',
  nao_aplicavel: 'N/A',
  rejeitado: 'Rejeitado',
};

const CATEGORIA_COLORS: Record<string, string> = {
  identidade: 'bg-blue-50 text-blue-700 border-blue-200',
  poderes: 'bg-purple-50 text-purple-700 border-purple-200',
  fiscal: 'bg-amber-50 text-amber-700 border-amber-200',
  registral: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  compliance: 'bg-red-50 text-red-700 border-red-200',
  documental: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  geral: 'bg-gray-50 text-gray-700 border-gray-200',
};

export const ProcessWorkflowTab: React.FC<ProcessWorkflowTabProps> = ({ processoId }) => {
  const { data: validacoes = [], isLoading: loadingValidacoes } = useProcessoValidacoes(processoId);
  const { data: workflow, isLoading: loadingWorkflow } = useWorkflowStatus(processoId);
  const { updateValidacao, gerarValidacoes, updateWorkflowState } = useProcessoValidacoesMutations();
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [notas, setNotas] = React.useState<Record<number, string>>({});

  const hasWorkflow = workflow && workflow.estados_disponiveis.length > 0;
  const hasValidacoes = validacoes.length > 0;

  // Agrupar validações por categoria
  const validacoesPorCategoria = validacoes.reduce((acc, v) => {
    const cat = v.categoria || 'geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(v);
    return acc;
  }, {} as Record<string, ProcessoValidacao[]>);

  const handleEstadoChange = (validacaoId: number, estado: string) => {
    updateValidacao.mutate({
      id: validacaoId,
      estado,
      notas: notas[validacaoId],
    });
  };

  if (loadingWorkflow || loadingValidacoes) {
    return <div className="text-sm text-muted-foreground p-4">A carregar...</div>;
  }

  if (!hasWorkflow && !hasValidacoes) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Este tipo de processo não tem workflow ou validações configuradas.</p>
        <p className="text-xs mt-1">Configure estados e regras no tipo de processo (Templates → Editar tipo).</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Workflow States ── */}
      {hasWorkflow && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Workflow do Processo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 flex-wrap mb-3">
              {workflow.estados_disponiveis.map((estado, idx) => {
                const isCurrent = estado === workflow.estado_workflow;
                const currentIdx = workflow.estados_disponiveis.indexOf(workflow.estado_workflow || '');
                const isPast = currentIdx >= 0 && idx < currentIdx;
                return (
                  <React.Fragment key={estado}>
                    {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    <Badge
                      variant={isCurrent ? 'default' : isPast ? 'secondary' : 'outline'}
                      className={`cursor-pointer transition-all ${isCurrent ? 'ring-2 ring-offset-1 ring-primary' : ''} ${isPast ? 'opacity-60' : ''}`}
                      onClick={() => {
                        if (!isCurrent) {
                          updateWorkflowState.mutate({ processoId, estado_workflow: estado });
                        }
                      }}
                    >
                      {isPast && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {estado}
                    </Badge>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Bloqueios ativos */}
            {workflow.bloqueios_ativos.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {workflow.bloqueios_ativos.map((b, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-md p-2">
                    <Lock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span>{b.mensagem}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Resumo */}
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              {workflow.validacoes_resumo.total > 0 && (
                <span>
                  Validações: {workflow.validacoes_resumo.validado}/{workflow.validacoes_resumo.total}
                </span>
              )}
              {workflow.checklist_resumo.total > 0 && (
                <span>
                  Checklist: {workflow.checklist_resumo.concluido}/{workflow.checklist_resumo.total}
                </span>
              )}
              {workflow.docs_obrigatorios_resumo.total > 0 && (
                <span>
                  Docs: {workflow.docs_obrigatorios_resumo.presentes}/{workflow.docs_obrigatorios_resumo.total}
                </span>
              )}
            </div>

            {/* Docs em falta */}
            {workflow.docs_obrigatorios_resumo.em_falta && workflow.docs_obrigatorios_resumo.em_falta.length > 0 && (
              <div className="mt-2 space-y-1">
                {workflow.docs_obrigatorios_resumo.em_falta.map((doc: string, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-amber-600">
                    <FileCheck className="h-3 w-3" />
                    <span>Em falta: {doc}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Validações ── */}
      {hasValidacoes && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Validações ({validacoes.filter(v => v.estado === 'validado').length}/{validacoes.filter(v => v.estado !== 'nao_aplicavel').length})
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => gerarValidacoes.mutate(processoId)}
              disabled={gerarValidacoes.isPending}
              className="text-xs h-7"
            >
              Regenerar Validações
            </Button>
          </div>

          {Object.entries(validacoesPorCategoria).map(([categoria, items]) => (
            <Card key={categoria}>
              <CardHeader className="pb-1 pt-3 px-3">
                <Badge variant="outline" className={`text-xs w-fit ${CATEGORIA_COLORS[categoria] || CATEGORIA_COLORS.geral}`}>
                  {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                </Badge>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-1">
                {items.map((v) => (
                  <div
                    key={v.id}
                    className={`flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer hover:bg-muted/50 ${expandedId === v.id ? 'bg-muted/50' : ''}`}
                    onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
                  >
                    {ESTADO_ICONS[v.estado]}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm">{v.nome}</span>
                      {v.descricao && <p className="text-xs text-muted-foreground truncate">{v.descricao}</p>}
                    </div>
                    <Select
                      value={v.estado}
                      onValueChange={(val) => { handleEstadoChange(v.id, val); }}
                    >
                      <SelectTrigger className="h-7 w-28 text-xs" onClick={(e) => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="validado">Validado</SelectItem>
                        <SelectItem value="nao_aplicavel">N/A</SelectItem>
                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                {/* Expandido: notas */}
                {items.map((v) => expandedId === v.id && (
                  <div key={`notes-${v.id}`} className="pl-8 pb-2 space-y-2">
                    <Textarea
                      placeholder="Notas..."
                      value={notas[v.id] ?? v.notas ?? ''}
                      onChange={(e) => setNotas({ ...notas, [v.id]: e.target.value })}
                      className="text-xs min-h-[60px]"
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {v.validado_por_nome && (
                        <span>Validado por: {v.validado_por_nome}</span>
                      )}
                      {v.validado_em && (
                        <span>em {new Date(v.validado_em).toLocaleDateString('pt-PT')}</span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs ml-auto"
                        onClick={() => updateValidacao.mutate({ id: v.id, estado: v.estado, notas: notas[v.id] ?? v.notas })}
                      >
                        Guardar notas
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
