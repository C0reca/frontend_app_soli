import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Process } from '@/hooks/useProcesses';
import { FileText, User, Building, Calendar, Clock, AlertCircle } from 'lucide-react';

interface ProcessDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  process: Process | null;
}

export const ProcessDetailsModal: React.FC<ProcessDetailsModalProps> = ({
  isOpen,
  onClose,
  process,
}) => {
  if (!process) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
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
        return 'Concluído';
      case 'in_progress':
        return 'Em Andamento';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
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

  const isOverdue = new Date(process.dueDate) < new Date() && process.status !== 'completed';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span>Detalhes do Processo</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{process.name}</h2>
              {process.description && (
                <p className="text-muted-foreground mt-2">{process.description}</p>
              )}
            </div>
            <div className="flex space-x-2">
              <Badge className={getStatusColor(process.status)}>
                {getStatusLabel(process.status)}
              </Badge>
              <Badge className={getPriorityColor(process.priority)}>
                {getPriorityLabel(process.priority)}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Atrasado</span>
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                  <Building className="h-4 w-4" />
                  <span>Cliente</span>
                </label>
                <p className="text-lg font-semibold">{process.client}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>Responsável</span>
                </label>
                <p className="text-sm">{process.employee}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Data de Criação</span>
                </label>
                <p className="text-sm">{new Date(process.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Prazo de Entrega</span>
                </label>
                <p className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
                  {new Date(process.dueDate).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                <div className="mt-1">
                  <Badge className={getPriorityColor(process.priority)}>
                    {getPriorityLabel(process.priority)}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status Atual</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(process.status)}>
                    {getStatusLabel(process.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3">Timeline</h3>
            <div className="bg-muted p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Criado:</span>
                  <span>{new Date(process.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Prazo:</span>
                  <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                    {new Date(process.dueDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {isOverdue && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    ⚠️ Este processo está atrasado
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};