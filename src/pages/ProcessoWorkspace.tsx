import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Bot,
  CheckSquare,
  Clock,
  FileText,
  FolderOpen,
  ListChecks,
  Mail,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Wallet,
  X,
} from 'lucide-react';
import { Process } from '@/hooks/useProcesses';
import { useTasks, Task } from '@/hooks/useTasks';
import { AssistenteIA } from '@/components/AssistenteIA';
import { ProcessFinanceiroTab } from '@/components/ProcessFinanceiroTab';
import { ProcessChecklistTab } from '@/components/ProcessChecklistTab';
import { ProcessCorreioTab } from '@/components/ProcessCorreioTab';
import { FicheirosBrowser } from '@/components/FicheirosBrowser';
import { useAuth } from '@/contexts/AuthContext';
import { TaskDetailsModal } from '@/components/modals/TaskDetailsModal';
import { TaskModal } from '@/components/modals/TaskModal';

const estadoBadge: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
  pendente: { variant: 'secondary', label: 'Pendente' },
  em_curso: { variant: 'default', label: 'Em Curso' },
  concluido: { variant: 'outline', label: 'Concluído' },
};

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function ProcessoWorkspace() {
  const { id } = useParams<{ id: string }>();
  const processoId = id ? parseInt(id) : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const [showIA, setShowIA] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);

  // Carregar processo completo
  const { data: processo, isLoading } = useQuery<Process>({
    queryKey: ['processo-workspace', processoId],
    queryFn: async () => {
      const res = await api.get(`/processos/${processoId}`);
      return res.data;
    },
    enabled: !!processoId,
  });

  // Tarefas do processo
  const { tasks: allTasks } = useTasks();
  const processTasks = useMemo(
    () => (allTasks || []).filter((t: Task) => t.processo_id === processoId),
    [allTasks, processoId],
  );
  const pendingTasks = processTasks.filter(t => !t.concluida);
  const completedTasks = processTasks.filter(t => t.concluida);

  if (isLoading || !processo) {
    return (
      <div className="h-full flex flex-col p-4 gap-4">
        <Skeleton className="h-10 w-80" />
        <div className="flex-1 flex gap-4">
          <Skeleton className="flex-1" />
          <Skeleton className="w-[380px]" />
        </div>
      </div>
    );
  }

  const badge = estadoBadge[processo.estado] || estadoBadge.pendente;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-background shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold truncate">{processo.titulo}</h1>
            <Badge variant={badge.variant}>{badge.label}</Badge>
            {processo.estado_workflow && (
              <Badge variant="outline" className="text-xs">{processo.estado_workflow}</Badge>
            )}
            <span className="text-xs text-muted-foreground">#{processo.id}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {processo.cliente && <span>{(processo.cliente as any).nome || (processo.cliente as any).nome_empresa}</span>}
            {processo.funcionario && <span>Resp: {processo.funcionario.nome}</span>}
            <span>Criado: {formatDate(processo.criado_em)}</span>
          </div>
        </div>

        <Button
          variant={showIA ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowIA(!showIA)}
          className="shrink-0"
        >
          {showIA ? <PanelRightClose className="h-4 w-4 mr-1" /> : <PanelRightOpen className="h-4 w-4 mr-1" />}
          {showIA ? 'Fechar IA' : 'Assistente IA'}
        </Button>
      </div>

      {/* KPIs bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30 text-xs shrink-0">
        <div className="flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5 text-amber-500" />
          <span><strong>{pendingTasks.length}</strong> tarefas pendentes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5 text-green-500" />
          <span><strong>{completedTasks.length}</strong> concluídas</span>
        </div>
        {processo.tipo_processo && (
          <div className="flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5 text-primary" />
            <span>{(processo.tipo_processo as any).nome}</span>
          </div>
        )}
        {processo.valor && (
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-green-600" />
            <span>{Number(processo.valor).toFixed(2)}€</span>
          </div>
        )}
      </div>

      {/* Main content + IA panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conteúdo principal */}
        <div className="flex-1 overflow-y-auto p-4">
          <Tabs defaultValue="tarefas" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="tarefas" className="text-xs gap-1">
                <ListChecks className="h-3.5 w-3.5" /> Tarefas
              </TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs gap-1">
                <FileText className="h-3.5 w-3.5" /> Documentos
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="text-xs gap-1">
                <Wallet className="h-3.5 w-3.5" /> Financeiro
              </TabsTrigger>
              <TabsTrigger value="checklist" className="text-xs gap-1">
                <CheckSquare className="h-3.5 w-3.5" /> Checklist
              </TabsTrigger>
              <TabsTrigger value="ficheiros" className="text-xs gap-1">
                <FolderOpen className="h-3.5 w-3.5" /> Ficheiros
              </TabsTrigger>
              <TabsTrigger value="correio" className="text-xs gap-1">
                <Mail className="h-3.5 w-3.5" /> Correio
              </TabsTrigger>
              <TabsTrigger value="info" className="text-xs gap-1">
                <MessageSquare className="h-3.5 w-3.5" /> Info
              </TabsTrigger>
            </TabsList>

            {/* Tab: Tarefas */}
            <TabsContent value="tarefas" className="space-y-4 mt-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Tarefas ({processTasks.length})</h3>
                <Button size="sm" variant="outline" onClick={() => setShowNewTask(true)}>
                  + Nova Tarefa
                </Button>
              </div>

              {pendingTasks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Pendentes ({pendingTasks.length})</p>
                  {pendingTasks.map(t => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-2.5 rounded-md border hover:bg-muted/50 cursor-pointer"
                      onClick={() => { setSelectedTask(t); setShowTaskModal(true); }}
                    >
                      <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.titulo}</p>
                        {t.data_fim && (
                          <p className="text-xs text-muted-foreground">Prazo: {formatDate(t.data_fim)}</p>
                        )}
                      </div>
                      {t.prioridade && (
                        <Badge variant={t.prioridade === 'alta' ? 'destructive' : t.prioridade === 'media' ? 'default' : 'secondary'} className="text-xs shrink-0">
                          {t.prioridade}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {completedTasks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Concluídas ({completedTasks.length})</p>
                  {completedTasks.slice(0, 5).map(t => (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer opacity-60"
                      onClick={() => { setSelectedTask(t); setShowTaskModal(true); }}
                    >
                      <CheckSquare className="h-4 w-4 text-green-500 shrink-0" />
                      <p className="text-sm truncate line-through">{t.titulo}</p>
                    </div>
                  ))}
                  {completedTasks.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">+{completedTasks.length - 5} mais</p>
                  )}
                </div>
              )}

              {processTasks.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Sem tarefas neste processo.</p>
                    <p className="text-xs mt-1">Peça ao assistente IA para sugerir tarefas.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Documentos — reutiliza FicheirosBrowser para Azure Files */}
            <TabsContent value="documentos" className="mt-0">
              <p className="text-xs text-muted-foreground mb-3">Documentos do sistema associados a este processo.</p>
              {/* Placeholder — os docs do sistema são geridos pelo ProcessDetailsModal.
                  Aqui mostramos um resumo simples. */}
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Para gerir documentos completos, abra o detalhe do processo.</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate(`/processos`)}>
                    Abrir Processos
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Financeiro */}
            <TabsContent value="financeiro" className="mt-0">
              <ProcessFinanceiroTab processoId={processoId!} />
            </TabsContent>

            {/* Tab: Checklist */}
            <TabsContent value="checklist" className="mt-0">
              <ProcessChecklistTab processoId={processoId!} />
            </TabsContent>

            {/* Tab: Ficheiros Azure */}
            <TabsContent value="ficheiros" className="mt-0">
              <FicheirosBrowser
                tipo="processos"
                entityId={processoId!}
                azureFolderPath={(processo as any).azure_folder_path}
                canEdit={true}
                canConfigurePasta={isAdminOrManager}
              />
            </TabsContent>

            {/* Tab: Correio */}
            <TabsContent value="correio" className="mt-0">
              <ProcessCorreioTab processoId={processoId!} />
            </TabsContent>

            {/* Tab: Info */}
            <TabsContent value="info" className="mt-0">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Título</span>
                  <p className="font-medium">{processo.titulo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado</span>
                  <p className="font-medium capitalize">{processo.estado?.replace('_', ' ')}</p>
                </div>
                {processo.descricao && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Descrição</span>
                    <p>{processo.descricao}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Cliente</span>
                  <p className="font-medium">{(processo.cliente as any)?.nome || (processo.cliente as any)?.nome_empresa || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Responsável</span>
                  <p className="font-medium">{processo.funcionario?.nome || '—'}</p>
                </div>
                {processo.titular && (
                  <div>
                    <span className="text-muted-foreground">Titular</span>
                    <p className="font-medium">{processo.titular.nome}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Criado em</span>
                  <p>{formatDate(processo.criado_em)}</p>
                </div>
                {processo.tipo && (
                  <div>
                    <span className="text-muted-foreground">Tipo</span>
                    <p>{processo.tipo}</p>
                  </div>
                )}
                {processo.onde_estao && (
                  <div>
                    <span className="text-muted-foreground">Onde Estão</span>
                    <p>{processo.onde_estao}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Painel IA */}
        {showIA && (
          <div className="w-[380px] shrink-0 border-l flex flex-col bg-background">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bot className="h-4 w-4 text-primary" />
                Assistente IA
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowIA(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AssistenteIA processoId={processoId!} clienteId={processo.cliente_id} />
            </div>
          </div>
        )}
      </div>

      {/* Task modals */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          isOpen={showTaskModal}
          onClose={() => { setShowTaskModal(false); setSelectedTask(null); }}
        />
      )}

      {showNewTask && (
        <TaskModal
          isOpen={showNewTask}
          onClose={() => setShowNewTask(false)}
          processoId={processoId}
        />
      )}
    </div>
  );
}
