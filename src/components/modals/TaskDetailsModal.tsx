import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Clock, AlertCircle, Calendar, User, Building } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import { useEmployees } from '@/hooks/useEmployees';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Minimize2 } from 'lucide-react';
import { useMinimize } from '@/contexts/MinimizeContext';
import { TaskModal } from './TaskModal';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  onClose,
  task,
}) => {
  const { employees } = useEmployees();
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const { minimize } = useMinimize();

  useEffect(() => {
    setCurrentTask(task ?? null);
  }, [task]);

  useEffect(() => {
    const fetchSubtasks = async () => {
      if (!currentTask) return;
      try {
        const res = await api.get(`/tarefas/${currentTask.id}/subtarefas`);
        setSubtasks(res.data);
      } catch {}
    };
    fetchSubtasks();
  }, [currentTask]);

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

  const isOverdue = (dataFim: string | null) => {
    return dataFim && new Date(dataFim) < new Date() && !(currentTask && currentTask.concluida);
  };

  if (!currentTask) {
    // Preserve hook order by placing conditional return after hooks
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Tarefa</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-500">Nenhuma tarefa selecionada.</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              {getStatusIcon(currentTask.concluida)}
              <span>{currentTask.titulo}</span>
              {isOverdue(currentTask.data_fim) && (
                <Badge variant="destructive">Atrasada</Badge>
              )}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-12 top-4"
              onClick={() => {
                minimize({ type: 'task', title: currentTask.titulo, payload: { task: currentTask } });
                onClose();
              }}
              aria-label={'Minimizar'}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Status</label>
              <Badge className={getStatusColor(currentTask.concluida)}>
                {getStatusLabel(currentTask.concluida)}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Prioridade</label>
              <Badge className={getPriorityColor(currentTask.prioridade)}>
                {getPriorityLabel(currentTask.prioridade)}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Descrição</label>
              <p className="mt-1 text-sm text-gray-900">{currentTask.descricao || '-'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Processo</label>
                  <p className="text-sm text-gray-900">{currentTask.processo_id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Responsável</label>
                  <p className="text-sm text-gray-900">
                    {currentTask.responsavel_id 
                      ? employees.find(emp => emp.id === currentTask.responsavel_id)?.nome || `ID: ${currentTask.responsavel_id}`
                      : 'Não atribuído'}
                  </p>
                </div>
              </div>

              {currentTask.autor_id && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Autor</label>
                    <p className="text-sm text-gray-900">
                      {employees.find(emp => emp.id === currentTask.autor_id!)?.nome || `ID: ${currentTask.autor_id}`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Criado em</label>
                  <p className="text-sm text-gray-900">{currentTask.criado_em ? new Date(currentTask.criado_em).toLocaleDateString('pt-BR') : '-'}</p>
                </div>
              </div>

              {currentTask.data_fim && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Prazo</label>
                    <p className={`text-sm ${isOverdue(currentTask.data_fim) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {currentTask.data_fim ? new Date(currentTask.data_fim).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>
              )}
              {('tipo' in currentTask) && (
                <div className="flex items-center space-x-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo</label>
                    <p className="text-sm text-gray-900">{(currentTask as any).tipo || '-'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Subtarefas</h3>
              <Button size="sm" onClick={() => setIsSubtaskModalOpen(true)}>Criar Subtarefa</Button>
            </div>
            <div className="space-y-2">
              {subtasks.length === 0 && (
                <p className="text-sm text-gray-500">Sem subtarefas</p>
              )}
              {subtasks.map(st => (
                <button
                  key={st.id}
                  className="w-full text-left text-sm text-gray-700 border rounded p-2 flex items-center justify-between hover:bg-gray-50"
                  onClick={() => setCurrentTask(st)}
                >
                  <span>{st.titulo}</span>
                  <span className="text-xs text-gray-500">{st.concluida ? 'Concluída' : 'Pendente'}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
      <TaskModal isOpen={isSubtaskModalOpen} onClose={() => setIsSubtaskModalOpen(false)} parentId={Number(currentTask.id)} />
    </Dialog>
  );
};