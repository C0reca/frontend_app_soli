
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, CheckSquare, Clock, AlertCircle, Edit, Trash2, Eye, Filter, X, Share2, CalendarClock, Repeat } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { useEmployeeList } from '@/hooks/useEmployees';
import { useProcesses } from '@/hooks/useProcesses';
import { TaskModal } from '@/components/modals/TaskModal';
import { TaskDetailsModal } from '@/components/modals/TaskDetailsModal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/usePermissions';
import { normalizeString } from '@/lib/utils';
import type { Process } from '@/hooks/useProcesses';

export const Tasks: React.FC = () => {
  const { canCreate, canEdit } = usePermissions();
  const { tasks, isLoading, deleteTask, updateTaskStatus, updateTask, setExternal } = useTasks();
  const { data: employees = [] } = useEmployeeList();
  const { processes } = useProcesses();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInFullContent, setSearchInFullContent] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<Task | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [concludeDialogOpen, setConcludeDialogOpen] = useState(false);
  const [taskToConclude, setTaskToConclude] = useState<Task | null>(null);
  const [concludeNotes, setConcludeNotes] = useState('');
  const [postponeDialogOpen, setPostponeDialogOpen] = useState(false);
  const [taskToPostpone, setTaskToPostpone] = useState<Task | null>(null);
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeMotivo, setPostponeMotivo] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    responsavel: 'all',
    prioridade: 'all',
    tipo: 'all',
    atrasadas: false,
    showConcluidas: false,
  });
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    const abrir = searchParams.get('abrir');
    if (abrir && tasks.length > 0) {
      const t = tasks.find((x: Task) => String(x.id) === abrir);
      if (t) {
        setSelectedTaskDetails(t);
        setIsDetailsModalOpen(true);
      }
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('abrir');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, tasks]);

  const getProcessForTask = (task: Task): Process | undefined =>
    task.processo_id ? processes.find((p) => p.id === task.processo_id) : undefined;

  const getSearchableTextForTask = (task: Task, includeFullContent: boolean): string => {
    const processo = getProcessForTask(task);
    const parts: string[] = [
      task.titulo ?? '',
      processo?.titulo ?? '',
      processo?.referencia ?? '',
      processo?.cliente?.nome ?? '',
      processo?.dossie?.entidade?.nome ?? '',
      processo?.dossie?.entidade?.nome_empresa ?? '',
      processo?.dossie?.numero ?? '',
    ];
    if (includeFullContent && (task.descricao ?? '').trim()) {
      parts.push(task.descricao!);
    }
    return parts.join(' ');
  };

  // Helper functions
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

  // Helper function to check if a task matches filters (excluding concluida check for subtasks)
  const taskMatchesFilters = (task: Task, checkConcluida: boolean = true) => {
    const searchableText = getSearchableTextForTask(task, searchInFullContent);
    const matchesSearch = !searchTerm.trim() ||
      normalizeString(searchableText).includes(normalizeString(searchTerm));
    
    if (checkConcluida) {
      const isConcluida = task.concluida;
      const shouldShowConcluidas = filters.showConcluidas || filters.status === 'concluidas';
      
      // Se não mostrar concluídas e a tarefa está concluída, esconde
      if (isConcluida && !shouldShowConcluidas) {
        return false;
      }
    }
    
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
  };

  // First, filter main tasks (tasks without parent)
  const filteredMainTasks = tasks.filter((task) => {
    // Only process main tasks (no parent_id)
    if (task.parent_id) return false;
    return taskMatchesFilters(task, true);
  });

  const visibleMainTaskIds = new Set(filteredMainTasks.map((t) => String(t.id)));

  // Incluir subtarefas pendentes dos compromissos visíveis (sub tarefas concluídas não aparecem)
  const shouldShowConcluidas = filters.showConcluidas || filters.status === 'concluidas';
  const filteredSubtasks = tasks.filter((task) => {
    if (!task.parent_id) return false;
    if (task.concluida) return false; // subtarefas concluídas não aparecem
    const parentId = String(task.parent_id);
    const parentTask = tasks.find((t) => String(t.id) === parentId);
    if (!parentTask) return false;
    // Pai visível na lista principal → mostrar subtarefas pendentes
    if (visibleMainTaskIds.has(parentId)) return true;
    // Pai concluído mas a mostrar concluídas → mostrar subtarefas pendentes
    if (parentTask.concluida && shouldShowConcluidas) return true;
    return false;
  });

  // Combine main tasks and subtasks
  const filteredTasks = [...filteredMainTasks, ...filteredSubtasks];

  // Hierarquia: chaves sempre string para evitar pai/filhos não baterem (API pode devolver id number)
  const childrenByParent: Record<string, Task[]> = {};
  filteredTasks.forEach((t) => {
    const key = t.parent_id != null ? String(t.parent_id) : 'root';
    if (!childrenByParent[key]) childrenByParent[key] = [];
    childrenByParent[key].push(t);
  });

  const topLevel = (childrenByParent['root'] || []).sort((a, b) => (a.data_fim || '').localeCompare(b.data_fim || ''));

  const renderTaskRow = (task: Task, level: number = 0) => {
    const indentClass = level > 0 ? `pl-${Math.min(level * 4, 12)}` : '';
    const subtasks = childrenByParent[String(task.id)] || [];
    
    // Determinar a cor de fundo baseada no estado da tarefa
    const getBackgroundColor = () => {
      if (task.concluida) {
        return 'border-green-200 bg-green-50';
      } else if (isOverdue(task.data_fim, task.concluida)) {
        return 'border-red-200 bg-red-50';
      } else {
        return 'border-yellow-200 bg-yellow-50';
      }
    };
    
    return (
      <div key={`${task.id}-${level}`}>
        <Card className={`hover:shadow-md transition-shadow cursor-pointer ${getBackgroundColor()}`} onClick={() => handleView(task)}>
          <CardContent className={`p-4 ${indentClass}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(task.concluida)}
                  <h3 className="font-semibold">{task.titulo}</h3>
                  {task.processo_id && (() => {
                    const processo = processes.find(p => p.id === task.processo_id);
                    if (!processo) return null;

                    // Tentar obter nome do cliente de diferentes formas
                    let clienteNome: string | null = null;
                    if (processo.cliente) {
                      clienteNome = (processo.cliente as any).nome || (processo.cliente as any).nome_empresa || null;
                    } else if (processo.cliente_id) {
                      clienteNome = `Cliente #${processo.cliente_id}`;
                    }

                    return clienteNome ? (
                      <span className="text-sm text-muted-foreground font-normal">- {clienteNome}</span>
                    ) : null;
                  })()}
                  {level > 0 && <Badge variant="secondary">Sub-compromisso</Badge>}
                  {task.recorrencia_tipo && (
                    <Badge variant="outline" className="border-blue-500 text-blue-700 gap-1">
                      <Repeat className="h-3 w-3" />
                      Recorrente
                    </Badge>
                  )}
                  {isOverdue(task.data_fim, task.concluida) && (
                    <Badge variant="destructive">Atrasada</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{task.descricao}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span><strong>Processo:</strong> {task.processo_id ? (() => {
                    const processo = processes.find(p => p.id === task.processo_id);
                    if (!processo) return task.processo_id;
                    return processo.referencia
                      ? `${processo.referencia} - ${processo.titulo}`
                      : processo.titulo;
                  })() : 'N/A'}</span>
                  <span><strong>Localização:</strong> {task.onde_estao === 'Tarefas' ? 'Pendentes' : (task.onde_estao || 'Sem Localização')}</span>
                  <span>
                    <strong>Responsável:</strong>{' '}
                    {task.responsavel_id
                      ? (employees.find(e => e.id === task.responsavel_id)?.nome || `ID: ${task.responsavel_id}`)
                      : 'Não atribuído'}
                  </span>
                  {task.autor_id && (
                    <span>
                      <strong>Autor:</strong>{' '}
                      {employees.find(e => e.id === task.autor_id)?.nome || `ID: ${task.autor_id}`}
                    </span>
                  )}
                  {typeof task.subtarefas_count === 'number' && level === 0 && (
                    <span><strong>Sub-compromissos:</strong> {task.subtarefas_count}</span>
                  )}
                  {task.data_fim && (
                    <span><strong>Prazo:</strong> {new Date(task.data_fim).toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <Badge className={getStatusColor(task.concluida)}>
                  {getStatusLabel(task.concluida)}
                </Badge>
                {isOverdue(task.data_fim, task.concluida) && (
                  <Badge variant="destructive" className="text-xs">
                    Atrasada
                  </Badge>
                )}
                {isLastDay(task.data_fim, task.concluida) && (
                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                    Último dia
                  </Badge>
                )}
                <Badge className={getPriorityColor(task.prioridade)}>
                  {getPriorityLabel(task.prioridade)}
                </Badge>
                {task.servico_externo && (
                  <Badge variant="outline" className="text-xs border-purple-500 text-purple-700">
                    Diligência Externa
                  </Badge>
                )}
              </div>
              <div className="flex space-x-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleView(task); }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleEdit(task); }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {!task.servico_externo ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setExternal.mutate({ id: task.id, servico_externo: true }); }}
                    title="Mover para Diligência Externa"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setExternal.mutate({ id: task.id, servico_externo: false }); }}
                    title="Remover de Diligência Externa"
                  >
                    <Share2 className="h-4 w-4 rotate-180" />
                  </Button>
                )}
                {!task.concluida ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(task, true); }}
                      className="text-green-600 hover:text-green-700"
                      title="Concluir"
                    >
                      <CheckSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handlePostponeClick(task); }}
                      className="text-amber-600 hover:text-amber-700"
                      title="Adiar tarefa"
                    >
                      <CalendarClock className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(task, false); }}
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        {subtasks.map(st => renderTaskRow(st, level + 1))}
      </div>
    );
  };

  const getStatusColor = (concluida: boolean) => {
    return concluida 
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const getPriorityColor = (prioridade: string | null) => {
    switch (prioridade) {
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'media':
        return 'bg-orange-100 text-orange-800';
      case 'baixa':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (concluida: boolean) => {
    return concluida ? 'Concluída' : 'Pendente';
  };

  const getPriorityLabel = (prioridade: string | null) => {
    switch (prioridade) {
      case 'alta':
        return 'Alta';
      case 'media':
        return 'Média';
      case 'baixa':
        return 'Baixa';
      default:
        return 'Sem prioridade';
    }
  };

  const getStatusIcon = (concluida: boolean) => {
    return concluida 
      ? <CheckSquare className="h-4 w-4 text-green-600" />
      : <AlertCircle className="h-4 w-4 text-yellow-600" />;
  };

  const handleView = (task: Task) => {
    setSelectedTaskDetails(task);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este compromisso?')) {
      await deleteTask.mutateAsync(id);
    }
  };

  const handleStatusChange = (task: Task, concluida: boolean) => {
    if (concluida) {
      setTaskToConclude(task);
      setConcludeNotes('');
      setConcludeDialogOpen(true);
    } else {
      updateTaskStatus.mutateAsync({ id: task.id, concluida: false });
    }
  };

  const handleConfirmConclude = async () => {
    if (!taskToConclude) return;
    await updateTaskStatus.mutateAsync({
      id: taskToConclude.id,
      concluida: true,
      notas_conclusao: concludeNotes.trim() || undefined,
    });
    setConcludeDialogOpen(false);
    setTaskToConclude(null);
    setConcludeNotes('');
  };

  const handlePostponeClick = (task: Task) => {
    const current = task.data_fim ? new Date(task.data_fim) : new Date();
    setTaskToPostpone(task);
    setPostponeDate(current.toISOString().slice(0, 10));
    setPostponeMotivo(task.motivo_adiamento ?? '');
    setPostponeDialogOpen(true);
  };

  const handleConfirmPostpone = async () => {
    if (!taskToPostpone || !postponeDate.trim()) return;
    await updateTask.mutateAsync({
      id: taskToPostpone.id,
      data_fim: postponeDate.trim() + 'T12:00:00',
      motivo_adiamento: postponeMotivo.trim() || undefined,
    });
    setPostponeDialogOpen(false);
    setTaskToPostpone(null);
    setPostponeDate('');
    setPostponeMotivo('');
  };

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

  const handleCloseModal = () => {
    setSelectedTask(null);
    setIsModalOpen(false);
  };

  const handleCloseDetailsModal = () => {
    setSelectedTaskDetails(null);
    setIsDetailsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compromissos</h1>
          <p className="text-gray-600">Gerencie os compromissos dos processos</p>
        </div>
        {canCreate("tarefas") && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Compromisso
          </Button>
        )}
      </div>

      {/* Estatísticas + Filtros e Pesquisa (zona comprimida) */}
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
              <span className="text-lg font-bold text-yellow-600">{tasks.filter((t: Task) => !t.concluida).length}</span>
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
              <span className="text-lg font-bold text-blue-600">{tasks.filter((t: Task) => isOverdue(t.data_fim, t.concluida)).length}</span>
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
              <span className="text-lg font-bold text-green-600">{tasks.filter((t: Task) => t.concluida).length}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <Input
                placeholder="Pesquisar por nome, entidade, processo ou número do arquivo..."
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
                id="searchInFullContent"
                checked={searchInFullContent}
                onCheckedChange={(checked) => setSearchInFullContent(!!checked)}
              />
              <label htmlFor="searchInFullContent" className="cursor-pointer">Pesquisar na descrição</label>
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
                id="atrasadas"
                checked={filters.atrasadas}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, atrasadas: !!checked }))}
              />
              <label htmlFor="atrasadas" className="cursor-pointer whitespace-nowrap">Atrasadas</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="showConcluidas"
                checked={filters.showConcluidas}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showConcluidas: !!checked }))}
              />
              <label htmlFor="showConcluidas" className="cursor-pointer whitespace-nowrap">Mostrar concluídos</label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Tarefas</CardTitle>
          <CardDescription>
            Total de {tasks.length} tarefas cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {topLevel.map(t => renderTaskRow(t, 0))}
           </div>
         </CardContent>
       </Card>

       <TaskModal
         isOpen={isModalOpen}
         onClose={handleCloseModal}
         task={selectedTask}
       />

       <TaskDetailsModal
         isOpen={isDetailsModalOpen}
         onClose={handleCloseDetailsModal}
         task={selectedTaskDetails}
       />

       <Dialog open={concludeDialogOpen} onOpenChange={setConcludeDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Concluir tarefa</DialogTitle>
             <DialogDescription>
               Descreva brevemente o que foi feito ou o motivo do encerramento (opcional). Este texto ficará registado no histórico do processo.
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-2 py-2">
             <Label htmlFor="conclude-notes">Descrição</Label>
             <Textarea
               id="conclude-notes"
               placeholder="Ex.: Documentos entregues no cartório. Cliente notificado."
               value={concludeNotes}
               onChange={(e) => setConcludeNotes(e.target.value)}
               rows={4}
               className="resize-none"
             />
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => { setConcludeDialogOpen(false); setTaskToConclude(null); setConcludeNotes(''); }}>
               Cancelar
             </Button>
             <Button onClick={handleConfirmConclude} disabled={updateTaskStatus.isPending}>
               Concluir
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       <Dialog open={postponeDialogOpen} onOpenChange={setPostponeDialogOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Adiar tarefa</DialogTitle>
             <DialogDescription>
               Indique a nova data de conclusão e, se quiser, o motivo do adiamento.
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4 py-2">
             <div className="space-y-2">
               <Label htmlFor="postpone-date-list">Nova data</Label>
               <Input
                 id="postpone-date-list"
                 type="date"
                 value={postponeDate}
                 onChange={(e) => setPostponeDate(e.target.value)}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="postpone-motivo-list">Motivo do adiamento (opcional)</Label>
               <Textarea
                 id="postpone-motivo-list"
                 placeholder="Ex.: Aguardar documentação do cliente."
                 value={postponeMotivo}
                 onChange={(e) => setPostponeMotivo(e.target.value)}
                 rows={3}
                 className="resize-none"
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => { setPostponeDialogOpen(false); setTaskToPostpone(null); setPostponeDate(''); setPostponeMotivo(''); }}>
               Cancelar
             </Button>
             <Button onClick={handleConfirmPostpone} disabled={updateTask.isPending || !postponeDate.trim()}>
               Adiar
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 };
