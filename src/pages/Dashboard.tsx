
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  FolderOpen,
  ListChecks,
  Plus,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useTasks, Task } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { TaskDetailsModal } from '@/components/modals/TaskDetailsModal';

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}

function daysUntil(d: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function prazoLabel(d: string): { text: string; className: string } {
  const days = daysUntil(d);
  if (days < 0) return { text: `${Math.abs(days)}d atraso`, className: 'bg-red-100 text-red-700' };
  if (days === 0) return { text: 'Hoje', className: 'bg-amber-100 text-amber-700' };
  if (days === 1) return { text: 'Amanhã', className: 'bg-yellow-100 text-yellow-700' };
  if (days <= 3) return { text: `${days} dias`, className: 'bg-orange-100 text-orange-700' };
  if (days <= 7) return { text: `${days} dias`, className: 'bg-blue-100 text-blue-700' };
  return { text: formatDate(d), className: 'bg-muted text-muted-foreground' };
}

export const Dashboard: React.FC = () => {
  const { kpis, isLoading } = useDashboard();
  const { tasks } = useTasks();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  // Tarefas categorizadas
  const { atrasadas, paraHoje, proximos7Dias, minhasTarefas } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const semana = new Date(now);
    semana.setDate(semana.getDate() + 7);

    const pendentes = (tasks || []).filter((t: Task) => !t.concluida && t.data_fim);
    const atrasadas = pendentes
      .filter(t => new Date(t.data_fim!) < now)
      .sort((a, b) => new Date(a.data_fim!).getTime() - new Date(b.data_fim!).getTime());

    const paraHoje = pendentes.filter(t => {
      const d = new Date(t.data_fim!);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === now.getTime();
    });

    const proximos7Dias = pendentes
      .filter(t => {
        const d = new Date(t.data_fim!);
        d.setHours(0, 0, 0, 0);
        return d > now && d <= semana;
      })
      .sort((a, b) => new Date(a.data_fim!).getTime() - new Date(b.data_fim!).getTime());

    const userId = user?.id;
    const minhasTarefas = pendentes
      .filter(t => t.responsavel_id === userId)
      .sort((a, b) => new Date(a.data_fim!).getTime() - new Date(b.data_fim!).getTime())
      .slice(0, 10);

    return { atrasadas, paraHoje, proximos7Dias, minhasTarefas };
  }, [tasks, user?.id]);

  const completionRate = kpis && kpis.total_processos > 0
    ? Math.round((kpis.concluidos / kpis.total_processos) * 100) : 0;
  const taskCompletionRate = kpis && (kpis.tarefas_concluidas + kpis.tarefas_pendentes) > 0
    ? Math.round((kpis.tarefas_concluidas / (kpis.tarefas_concluidas + kpis.tarefas_pendentes)) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header com saudação */}
      <div>
        <h1 className="text-2xl font-bold">
          Bom dia{user?.nome ? `, ${user.nome.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
      </div>

      {/* Alertas urgentes */}
      {atrasadas.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <span className="text-sm font-medium text-red-700">
              {atrasadas.length} tarefa{atrasadas.length > 1 ? 's' : ''} em atraso
            </span>
            <Button size="sm" variant="outline" className="ml-auto border-red-300 text-red-700 hover:bg-red-100" onClick={() => navigate('/tarefas')}>
              Ver todas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI compactos — 4 colunas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tarefas')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-medium">Para Hoje</span>
              <ListChecks className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold">{paraHoje.length}</div>
            <p className="text-xs text-muted-foreground">{atrasadas.length > 0 ? `+${atrasadas.length} em atraso` : 'tarefas'}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tarefas')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-medium">Esta Semana</span>
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{proximos7Dias.length}</div>
            <p className="text-xs text-muted-foreground">nos próximos 7 dias</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/processos')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-medium">Processos Ativos</span>
              <FolderOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{kpis?.ativos ?? 0}</div>
            <div className="mt-1">
              <Progress value={completionRate} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-0.5">{completionRate}% concluídos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/tarefas')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-medium">Tarefas</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{kpis?.tarefas_pendentes ?? 0}</div>
            <div className="mt-1">
              <Progress value={taskCompletionRate} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-0.5">{taskCompletionRate}% concluídas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secção principal — 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Coluna esquerda — Tarefas do dia (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          {/* As minhas tarefas */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">As Minhas Tarefas</CardTitle>
                  <CardDescription>Atribuídas a mim, por prazo</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/tarefas')}>
                  Ver todas <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {minhasTarefas.length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sem tarefas pendentes!</p>
                </div>
              ) : (
                minhasTarefas.map(t => {
                  const prazo = prazoLabel(t.data_fim!);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => { setSelectedTask(t); setIsTaskModalOpen(true); }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.titulo}</p>
                        {t.processo_id && (
                          <p className="text-xs text-muted-foreground truncate">Processo #{t.processo_id}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={`shrink-0 text-xs ${prazo.className}`}>
                        {prazo.text}
                      </Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Tarefas em atraso (se houver) */}
          {atrasadas.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Em Atraso ({atrasadas.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {atrasadas.slice(0, 5).map(t => {
                  const days = Math.abs(daysUntil(t.data_fim!));
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-red-50 cursor-pointer"
                      onClick={() => { setSelectedTask(t); setIsTaskModalOpen(true); }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.titulo}</p>
                      </div>
                      <span className="text-xs text-red-600 font-medium shrink-0">{days}d atraso</span>
                    </div>
                  );
                })}
                {atrasadas.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full text-red-600" onClick={() => navigate('/tarefas')}>
                    +{atrasadas.length - 5} mais
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna direita — Resumo e ações (2/5) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Próximos 7 dias */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Próximos 7 Dias</CardTitle>
              <CardDescription>{proximos7Dias.length} tarefas a vencer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {proximos7Dias.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Semana tranquila!</p>
              ) : (
                proximos7Dias.slice(0, 6).map(t => {
                  const prazo = prazoLabel(t.data_fim!);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1"
                      onClick={() => { setSelectedTask(t); setIsTaskModalOpen(true); }}
                    >
                      <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate flex-1">{t.titulo}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${prazo.className}`}>{prazo.text}</span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Resumo processos por estado */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Processos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {kpis?.por_estado && Object.entries(kpis.por_estado).map(([estado, count]) => (
                <div key={estado} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{estado.replace('_', ' ')}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Total</span>
                <span className="font-bold">{kpis?.total_processos ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Ações rápidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-auto py-2.5 justify-start gap-2" onClick={() => navigate('/processos')}>
                  <Plus className="h-4 w-4" />
                  <span className="text-xs">Novo Processo</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto py-2.5 justify-start gap-2" onClick={() => navigate('/tarefas')}>
                  <ListChecks className="h-4 w-4" />
                  <span className="text-xs">Tarefas</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto py-2.5 justify-start gap-2" onClick={() => navigate('/clientes')}>
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Entidades</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto py-2.5 justify-start gap-2" onClick={() => navigate('/calendario')}>
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Calendário</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto py-2.5 justify-start gap-2" onClick={() => navigate('/financeiro')}>
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs">Financeiro</span>
                </Button>
                <Button variant="outline" size="sm" className="h-auto py-2.5 justify-start gap-2" onClick={() => navigate('/documentos')}>
                  <FileText className="h-4 w-4" />
                  <span className="text-xs">Documentos</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskDetailsModal
        task={selectedTask}
        isOpen={isTaskModalOpen && !!selectedTask}
        onClose={() => { setIsTaskModalOpen(false); setSelectedTask(null); }}
      />
    </div>
  );
};
