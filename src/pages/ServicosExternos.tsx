import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckSquare, Clock, AlertCircle, Search, Filter, X, Eye } from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useEmployeeList } from '@/hooks/useEmployees';
import { useProcesses } from '@/hooks/useProcesses';
import { Task } from '@/hooks/useTasks';
import { TaskDetailsModal } from '@/components/modals/TaskDetailsModal';
import { normalizeString } from '@/lib/utils';
import type { Process } from '@/hooks/useProcesses';

export const ServicosExternos: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const { data: employees = [] } = useEmployeeList();
  const { processes } = useProcesses();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInFullContent, setSearchInFullContent] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    responsavel: 'all',
    prioridade: 'all',
    tipo: 'all',
    atrasadas: false,
    showConcluidas: false,
  });

  const employeeNameById = useMemo(() => {
    const map = new Map<number, string>();
    employees.forEach(e => map.set(e.id, e.nome));
    return map;
  }, [employees]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tarefas/externos');
      setItems(res.data);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao carregar diligências externas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Helpers
  const isOverdue = (dataFim: string | null, concluida: boolean) => {
    if (!dataFim || concluida) return false;
    const today = new Date();
    const dueDate = new Date(dataFim);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const isLastDay = (dataFim: string | null, concluida: boolean) => {
    if (!dataFim || concluida) return false;
    const today = new Date();
    const dueDate = new Date(dataFim);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  };

  const getProcessForTask = (task: Task): Process | undefined =>
    task.processo_id ? processes.find((p) => p.id === task.processo_id) : undefined;

  const getSearchableText = (task: Task): string => {
    const processo = getProcessForTask(task);
    const parts: string[] = [
      task.titulo ?? '',
      processo?.titulo ?? '',
      processo?.referencia ?? '',
      processo?.cliente?.nome ?? '',
      processo?.dossie?.entidade?.nome ?? '',
      processo?.dossie?.entidade?.nome_empresa ?? '',
      processo?.dossie?.numero ?? '',
      task.responsavel_id ? (employeeNameById.get(task.responsavel_id) ?? '') : '',
    ];
    if (searchInFullContent && task.descricao?.trim()) {
      parts.push(task.descricao);
    }
    return parts.join(' ');
  };

  // Stats
  const pendingCount = items.filter(t => !t.concluida).length;
  const overdueCount = items.filter(t => isOverdue(t.data_fim, t.concluida)).length;
  const completedCount = items.filter(t => t.concluida).length;

  // Filter logic
  const filteredItems = useMemo(() => {
    return items.filter(task => {
      // Search
      const matchesSearch = !searchTerm.trim() ||
        normalizeString(getSearchableText(task)).includes(normalizeString(searchTerm));

      // Status / concluidas
      const isConcluida = task.concluida;
      const shouldShowConcluidas = filters.showConcluidas || filters.status === 'concluidas';
      if (isConcluida && !shouldShowConcluidas) return false;

      const matchesStatus = filters.status === 'all' ||
        (filters.status === 'concluidas' && task.concluida) ||
        (filters.status === 'pendentes' && !task.concluida);

      const matchesResponsavel = filters.responsavel === 'all' ||
        task.responsavel_id?.toString() === filters.responsavel;

      const matchesPrioridade = filters.prioridade === 'all' ||
        task.prioridade === filters.prioridade;

      const matchesTipo = filters.tipo === 'all' ||
        task.tipo === filters.tipo;

      const matchesAtrasadas = !filters.atrasadas ||
        isOverdue(task.data_fim, task.concluida);

      return matchesSearch && matchesStatus && matchesResponsavel &&
        matchesPrioridade && matchesTipo && matchesAtrasadas;
    });
  }, [items, searchTerm, searchInFullContent, filters, processes, employees]);

  const clearFilters = () => {
    setSearchTerm('');
    setSearchInFullContent(false);
    setFilters({
      status: 'all',
      responsavel: 'all',
      prioridade: 'all',
      tipo: 'all',
      atrasadas: false,
      showConcluidas: false,
    });
  };

  const getPriorityColor = (prioridade: string | null) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-orange-100 text-orange-800';
      case 'baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (prioridade: string | null) => {
    switch (prioridade) {
      case 'alta': return 'Alta';
      case 'media': return 'Média';
      case 'baixa': return 'Baixa';
      default: return 'Sem prioridade';
    }
  };

  const getBackgroundColor = (task: Task) => {
    if (task.concluida) return 'border-green-200 bg-green-50';
    if (isOverdue(task.data_fim, task.concluida)) return 'border-red-200 bg-red-50';
    return 'border-yellow-200 bg-yellow-50';
  };

  const handleView = async (task: Task) => {
    try {
      const res = await api.get(`/tarefas/${task.id}`);
      setSelectedTask(res.data as Task);
      setIsDetailsOpen(true);
    } catch {
      // ignore
    }
  };

  const downloadReport = async () => {
    try {
      const rows = filteredItems.map(it => {
        const processo = getProcessForTask(it);
        return `
        <tr>
          <td style="padding:6px;border:1px solid #ddd;">${it.id}</td>
          <td style="padding:6px;border:1px solid #ddd;">${it.titulo}</td>
          <td style="padding:6px;border:1px solid #ddd;">${it.descricao || ''}</td>
          <td style="padding:6px;border:1px solid #ddd;">${it.data_fim ? new Date(it.data_fim).toLocaleDateString('pt-PT') : ''}</td>
          <td style="padding:6px;border:1px solid #ddd;">${processo ? (processo.referencia ? `${processo.referencia} - ${processo.titulo}` : processo.titulo) : ''}</td>
          <td style="padding:6px;border:1px solid #ddd;">${it.responsavel_id ? (employeeNameById.get(it.responsavel_id) || '') : ''}</td>
          <td style="padding:6px;border:1px solid #ddd;">${getPriorityLabel(it.prioridade)}</td>
          <td style="padding:6px;border:1px solid #ddd;">${it.concluida ? 'Concluída' : 'Pendente'}</td>
        </tr>`;
      }).join('');
      const html = `
        <html>
          <head>
            <title>Diligências Externas</title>
            <meta charset="utf-8" />
            <style>
              body { font-family: ui-sans-serif, system-ui; padding: 16px; }
              h1 { font-size: 18px; margin-bottom: 12px; }
              table { border-collapse: collapse; width: 100%; }
              th { text-align: left; padding: 8px; border:1px solid #ddd; background:#f3f4f6; }
            </style>
          </head>
          <body>
            <h1>Diligências Externas - Relatório</h1>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Descrição</th>
                  <th>Prazo</th>
                  <th>Processo</th>
                  <th>Responsável</th>
                  <th>Prioridade</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </body>
        </html>`;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        iframe.onload = () => {
          setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            document.body.removeChild(iframe);
          }, 150);
        };
      }
    } catch {
      toast({ title: 'Erro', description: 'Falha ao gerar PDF', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diligências Externas</h1>
          <p className="text-gray-600">Diligências externas dos processos</p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={load} disabled={loading}>{loading ? 'A atualizar...' : 'Atualizar'}</Button>
          <Button onClick={downloadReport}>Exportar PDF</Button>
        </div>
      </div>

      {/* Stats + Search + Filters */}
      <Card className="overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
            <button
              type="button"
              onClick={() => setFilters({ status: 'pendentes', responsavel: 'all', prioridade: 'all', tipo: 'all', atrasadas: false, showConcluidas: true })}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow"
            >
              <span className="text-xs sm:text-sm font-medium text-yellow-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Pendentes
              </span>
              <span className="text-lg font-bold text-yellow-600">{pendingCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilters({ status: 'all', responsavel: 'all', prioridade: 'all', tipo: 'all', atrasadas: true, showConcluidas: true })}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow"
            >
              <span className="text-xs sm:text-sm font-medium text-blue-600 flex items-center gap-1">
                <Clock className="h-4 w-4 shrink-0" />
                Atrasadas
              </span>
              <span className="text-lg font-bold text-blue-600">{overdueCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilters({ status: 'concluidas', responsavel: 'all', prioridade: 'all', tipo: 'all', atrasadas: false, showConcluidas: true })}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow"
            >
              <span className="text-xs sm:text-sm font-medium text-green-600 flex items-center gap-1">
                <CheckSquare className="h-4 w-4 shrink-0" />
                Concluídas
              </span>
              <span className="text-lg font-bold text-green-600">{completedCount}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <Input
                placeholder="Pesquisar por título, entidade, processo, responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters} className="shrink-0 h-9">
              <X className="mr-1.5 h-3.5 w-3.5" />
              Limpar
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <Checkbox
                id="searchInFullContentExt"
                checked={searchInFullContent}
                onCheckedChange={(checked) => setSearchInFullContent(!!checked)}
              />
              <label htmlFor="searchInFullContentExt" className="cursor-pointer">Pesquisar na descrição</label>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-[110px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendentes">Pendentes</SelectItem>
                  <SelectItem value="concluidas">Concluídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={filters.responsavel} onValueChange={(value) => setFilters(prev => ({ ...prev, responsavel: value }))}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>{emp.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.prioridade} onValueChange={(value) => setFilters(prev => ({ ...prev, prioridade: value }))}>
              <SelectTrigger className="w-[95px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.tipo} onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value }))}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="reuniao">Reunião</SelectItem>
                <SelectItem value="telefonema">Telefonema</SelectItem>
                <SelectItem value="tarefa">Compromisso</SelectItem>
                <SelectItem value="correspondencia_ctt">Correspondência CTT</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Checkbox
                id="atrasadasExt"
                checked={filters.atrasadas}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, atrasadas: !!checked }))}
              />
              <label htmlFor="atrasadasExt" className="cursor-pointer whitespace-nowrap">Atrasadas</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="showConcluidasExt"
                checked={filters.showConcluidas}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showConcluidas: !!checked }))}
              />
              <label htmlFor="showConcluidasExt" className="cursor-pointer whitespace-nowrap">Mostrar concluídos</label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Diligências Externas</CardTitle>
          <CardDescription>
            {filteredItems.length} de {items.length} diligências externas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredItems.map(task => {
              const processo = getProcessForTask(task);
              const clienteNome = processo?.cliente
                ? ((processo.cliente as any).nome || (processo.cliente as any).nome_empresa || null)
                : null;

              return (
                <Card
                  key={task.id}
                  className={`hover:shadow-md transition-shadow cursor-pointer ${getBackgroundColor(task)}`}
                  onClick={() => handleView(task)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {task.concluida
                            ? <CheckSquare className="h-4 w-4 text-green-600" />
                            : <AlertCircle className="h-4 w-4 text-yellow-600" />
                          }
                          <h3 className="font-semibold">{task.titulo}</h3>
                          {processo?.referencia && (
                            <Badge variant="secondary" className="font-mono text-xs">
                              {processo.referencia}
                            </Badge>
                          )}
                          {clienteNome && (
                            <span className="text-sm text-muted-foreground font-normal">- {clienteNome}</span>
                          )}
                          {isOverdue(task.data_fim, task.concluida) && (
                            <Badge variant="destructive">Atrasada</Badge>
                          )}
                          {isLastDay(task.data_fim, task.concluida) && (
                            <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                              Último dia
                            </Badge>
                          )}
                        </div>
                        {task.descricao && (
                          <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{task.descricao}</p>
                        )}
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span>
                            <strong>Processo:</strong>{' '}
                            {processo
                              ? (processo.referencia ? `${processo.referencia} - ${processo.titulo}` : processo.titulo)
                              : (task.processo_id ? `ID ${task.processo_id}` : 'N/A')}
                          </span>
                          <span>
                            <strong>Responsável:</strong>{' '}
                            {task.responsavel_id
                              ? (employeeNameById.get(task.responsavel_id) || `ID: ${task.responsavel_id}`)
                              : 'Não atribuído'}
                          </span>
                          {task.onde_estao && (
                            <span><strong>Localização:</strong> {task.onde_estao === 'Tarefas' ? 'Pendentes' : task.onde_estao}</span>
                          )}
                          {task.data_fim && (
                            <span><strong>Prazo:</strong> {new Date(task.data_fim).toLocaleDateString('pt-PT')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <Badge className={task.concluida ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {task.concluida ? 'Concluída' : 'Pendente'}
                        </Badge>
                        <Badge className={getPriorityColor(task.prioridade)}>
                          {getPriorityLabel(task.prioridade)}
                        </Badge>
                      </div>
                      <div className="flex flex-col space-y-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleView(task); }}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!task.concluida && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await api.patch(`/tarefas/status/${task.id}`, { concluida: true });
                                toast({ title: 'Concluída', description: 'Tarefa concluída.' });
                                load();
                              } catch {
                                toast({ title: 'Erro', description: 'Não foi possível concluir.', variant: 'destructive' });
                              }
                            }}
                            className="text-green-600 hover:text-green-700"
                            title="Concluir"
                          >
                            <CheckSquare className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await api.patch(`/tarefas/externo/${task.id}`, { servico_externo: false });
                              toast({ title: 'Removido', description: 'Removido de Diligência Externa.' });
                              load();
                            } catch {
                              toast({ title: 'Erro', description: 'Não foi possível remover.', variant: 'destructive' });
                            }
                          }}
                          className="text-red-600 hover:text-red-700 text-xs"
                          title="Remover de diligências externas"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {items.length === 0 ? 'Sem diligências externas no momento.' : 'Nenhum resultado encontrado com os filtros atuais.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <TaskDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        task={selectedTask}
      />
    </div>
  );
};

export default ServicosExternos;
