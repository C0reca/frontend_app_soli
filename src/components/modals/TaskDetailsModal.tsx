import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Clock, AlertCircle, Calendar, User, Building } from 'lucide-react';
import { Task } from '@/hooks/useTasks';

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
  if (!task) return null;

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
    return dataFim && new Date(dataFim) < new Date() && !task.concluida;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getStatusIcon(task.concluida)}
            <span>{task.titulo}</span>
            {isOverdue(task.data_fim) && (
              <Badge variant="destructive">Atrasada</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Status</label>
              <Badge className={getStatusColor(task.concluida)}>
                {getStatusLabel(task.concluida)}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Prioridade</label>
              <Badge className={getPriorityColor(task.prioridade)}>
                {getPriorityLabel(task.prioridade)}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Descrição</label>
              <p className="mt-1 text-sm text-gray-900">{task.descricao}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Processo</label>
                  <p className="text-sm text-gray-900">{task.processo_id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Responsável</label>
                  <p className="text-sm text-gray-900">{task.responsavel_id || 'Não atribuído'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Criado em</label>
                  <p className="text-sm text-gray-900">
                    {new Date(task.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {task.data_fim && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Prazo</label>
                    <p className={`text-sm ${isOverdue(task.data_fim) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {new Date(task.data_fim).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};