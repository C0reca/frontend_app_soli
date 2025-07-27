
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, CheckSquare, Clock, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { useTasks, Task } from '@/hooks/useTasks';
import { TaskModal } from '@/components/modals/TaskModal';

export const Tasks: React.FC = () => {
  const { tasks, isLoading, deleteTask, updateTaskStatus } = useTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'in_progress':
        return 'Em Andamento';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return priority;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckSquare className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && tasks.find(t => t.dueDate === dueDate)?.status !== 'completed';
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

  const handleStatusChange = async (id: string, status: Task['status']) => {
    await updateTaskStatus.mutateAsync({ id, status });
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setIsModalOpen(false);
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
              {tasks.filter(t => t.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-600" />
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tasks.filter(t => t.status === 'in_progress').length}
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
              {tasks.filter(t => t.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Tarefas</CardTitle>
          <CardDescription>
            Total de {tasks.length} tarefas cadastradas
          </CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className={`hover:shadow-md transition-shadow ${isOverdue(task.dueDate) ? 'border-red-200 bg-red-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(task.status)}
                        <h3 className="font-semibold">{task.title}</h3>
                        {isOverdue(task.dueDate) && (
                          <Badge variant="destructive">Atrasada</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span><strong>Processo:</strong> {task.process}</span>
                        <span><strong>Responsável:</strong> {task.assignee}</span>
                        <span><strong>Prazo:</strong> {new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusLabel(task.status)}
                      </Badge>
                       <Badge className={getPriorityColor(task.priority)}>
                         {getPriorityLabel(task.priority)}
                       </Badge>
                     </div>
                     <div className="flex space-x-2 mt-2">
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
                       {task.status !== 'completed' && (
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleStatusChange(task.id, 'completed')}
                           className="text-green-600 hover:text-green-700"
                         >
                           <CheckSquare className="h-4 w-4" />
                         </Button>
                       )}
                     </div>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         </CardContent>
       </Card>

       <TaskModal
         isOpen={isModalOpen}
         onClose={handleCloseModal}
         task={selectedTask}
       />
     </div>
   );
 };
