
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, CheckSquare, Clock, AlertCircle, Edit, Trash2, Eye, Filter, X } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { useEmployees } from '@/hooks/useEmployees';
import { TaskModal } from '@/components/modals/TaskModal';
import { TaskDetailsModal } from '@/components/modals/TaskDetailsModal';

export const Tasks: React.FC = () => {
  const { tasks, isLoading, deleteTask, updateTaskStatus } = useTasks();
  const { employees } = useEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<Task | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    responsavel: 'all',
    prioridade: 'all',
    tipo: 'all',
    atrasadas: false,
    showConcluidas: false,
  });

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

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Por padrão, esconde tarefas concluídas (arquivadas)
    const isConcluida = task.concluida;
    const shouldShowConcluidas = filters.showConcluidas || filters.status === 'concluidas';
    
    // Se não mostrar concluídas e a tarefa está concluída, esconde
    if (isConcluida && !shouldShowConcluidas) {
      return false;
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
  });

  // Build hierarchy: parent -> children
  const childrenByParent: Record<string, Task[]> = {};
  filteredTasks.forEach(t => {
    const key = (t.parent_id ?? 'root').toString();
    if (!childrenByParent[key]) childrenByParent[key] = [];
    childrenByParent[key].push(t);
  });

  const topLevel = (childrenByParent['root'] || []).sort((a, b) => (a.data_fim || '').localeCompare(b.data_fim || ''));

  const renderTaskRow = (task: Task, level: number = 0) => {
    const indentClass = level > 0 ? `pl-${Math.min(level * 4, 12)}` : '';
    const subtasks = childrenByParent[task.id.toString()] || [];
    return (
      <div key={`${task.id}-${level}`}>
        <Card className={`hover:shadow-md transition-shadow ${isOverdue(task.data_fim, task.concluida) ? 'border-red-200 bg-red-50' : ''}`}>
          <CardContent className={`p-4 ${indentClass}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(task.concluida)}
                  <h3 className="font-semibold">{task.titulo}</h3>
                  {level > 0 && <Badge variant="secondary">Subtarefa</Badge>}
                  {isOverdue(task.data_fim, task.concluida) && (
                    <Badge variant="destructive">Atrasada</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{task.descricao}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span><strong>Processo:</strong> {task.processo_id}</span>
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
                    <span><strong>Subtarefas:</strong> {task.subtarefas_count}</span>
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
              </div>
              <div className="flex space-x-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleView(task)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(task)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(task.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {!task.concluida ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(task.id, true)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(task.id, false)}
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
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      await deleteTask.mutateAsync(id);
    }
  };

  const handleStatusChange = async (id: string, concluida: boolean) => {
    await updateTaskStatus.mutateAsync({ id, concluida });
  };

  const clearFilters = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">Tarefas</h1>
          <p className="text-gray-600">Gerencie as tarefas dos processos</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Search and Filters */}


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {tasks.filter((t: Task) => !t.concluida).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-600" />
              Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter((t: Task) => isOverdue(t.data_fim, t.concluida)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckSquare className="mr-2 h-5 w-5 text-green-600" />
              Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter((t: Task) => t.concluida).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filtros e Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                  placeholder="Pesquisar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
            <Button variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendentes">Pendentes</SelectItem>
                  <SelectItem value="concluidas">Concluídas</SelectItem>
                </SelectContent>
              </Select>
                      </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Responsável</label>
              <Select value={filters.responsavel} onValueChange={(value) => setFilters(prev => ({ ...prev, responsavel: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                      </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Prioridade</label>
              <Select value={filters.prioridade} onValueChange={(value) => setFilters(prev => ({ ...prev, prioridade: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
                    </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <Select value={filters.tipo} onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                  <SelectItem value="telefonema">Telefonema</SelectItem>
                  <SelectItem value="tarefa">Tarefa</SelectItem>
                </SelectContent>
              </Select>
                     </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="atrasadas"
                checked={filters.atrasadas}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, atrasadas: !!checked }))}
              />
              <label htmlFor="atrasadas" className="text-sm font-medium">
                Apenas atrasadas
              </label>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showConcluidas"
              checked={filters.showConcluidas}
              onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showConcluidas: !!checked }))}
            />
            <label htmlFor="showConcluidas" className="text-sm font-medium">
              Mostrar tarefas concluídas (arquivadas)
            </label>
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
     </div>
   );
 };
