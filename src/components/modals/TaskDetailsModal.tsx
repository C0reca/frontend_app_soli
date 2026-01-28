import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Clock, AlertCircle, Calendar, User, Building, Download, Edit, X, MapPin } from 'lucide-react';
import { Task, useTasks } from '@/hooks/useTasks';
import { useEmployees } from '@/hooks/useEmployees';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Minimize2 } from 'lucide-react';
import { useMinimize } from '@/contexts/MinimizeContext';
import { TaskModal } from './TaskModal';
import { Input } from '@/components/ui/input';

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
  const { generateTaskPDF, updateTaskStatus, tasks } = useTasks();
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const { minimize } = useMinimize();
  const [docs, setDocs] = useState<{id:number; nome_original:string}[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    setCurrentTask(task ?? null);
  }, [task]);

  // Atualizar currentTask quando a tarefa for atualizada na lista
  useEffect(() => {
    if (currentTask && tasks) {
      const updatedTask = tasks.find((t: Task) => t.id === currentTask.id || t.id.toString() === currentTask.id.toString());
      if (updatedTask) {
        setCurrentTask(updatedTask);
      }
    }
  }, [tasks, currentTask?.id]);

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

  useEffect(() => {
    const fetchDocs = async () => {
      if (!currentTask) return;
      try {
        const res = await api.get(`/documentos/tarefa/${currentTask.id}`);
        setDocs(res.data);
      } catch {}
    };
    fetchDocs();
  }, [currentTask]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentTask) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      await api.post(`/documentos/upload-tarefa/${currentTask.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const res = await api.get(`/documentos/tarefa/${currentTask.id}`);
      setDocs(res.data);
    } catch {}
    finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onDeleteDoc = async (id: number) => {
    if (!confirm('Tem certeza que deseja apagar este ficheiro?')) {
      return;
    }
    try {
      await api.delete(`/documentos/${id}`);
      if (currentTask) {
        const res = await api.get(`/documentos/tarefa/${currentTask.id}`);
        setDocs(res.data);
      }
    } catch (error: any) {
      console.error('Erro ao apagar documento:', error);
      alert(error?.response?.data?.detail || 'Erro ao apagar o ficheiro. Por favor, tente novamente.');
    }
  };

  const onRenameDoc = async (id: number) => {
    const doc = docs.find(d => d.id === id);
    const novo = window.prompt('Novo nome do ficheiro', doc?.nome_original || '');
    if (!novo || !novo.trim()) return;
    try {
      await api.patch(`/documentos/${id}`, { nome_original: novo.trim() });
      if (currentTask) {
        const res = await api.get(`/documentos/tarefa/${currentTask.id}`);
        setDocs(res.data);
      }
    } catch {}
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

  const handleStatusToggle = async () => {
    if (!currentTask) return;
    const newStatus = !currentTask.concluida;
    try {
      await updateTaskStatus.mutateAsync({ id: currentTask.id, concluida: newStatus });
      setCurrentTask({ ...currentTask, concluida: newStatus });
    } catch (error) {
      // Error handling is done in the mutation
    }
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
            <DialogTitle>Detalhes do Compromisso</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-500">Nenhum compromisso selecionado.</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              {getStatusIcon(currentTask.concluida)}
              <span>{currentTask.titulo}</span>
              {isOverdue(currentTask.data_fim) && (
                <Badge variant="destructive">Atrasada</Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateTaskPDF(currentTask.id)}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  minimize({ type: 'task', title: currentTask.titulo, payload: { task: currentTask } });
                  onClose();
                }}
                aria-label={'Minimizar'}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                aria-label={'Fechar'}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(currentTask.concluida)}>
                  {getStatusLabel(currentTask.concluida)}
                </Badge>
                {!currentTask.concluida ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStatusToggle}
                    disabled={updateTaskStatus.isPending}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStatusToggle}
                    disabled={updateTaskStatus.isPending}
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                )}
              </div>
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
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Localização</label>
                  <p className="text-sm text-gray-900">{(currentTask as any).onde_estao || 'Sem Localização'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Anexos</label>
              <div className="flex items-center gap-2">
                <Input type="file" onChange={onUpload} disabled={uploading} />
              </div>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {docs.map(d => (
                  <li key={d.id} className="flex items-center gap-2">
                    <a href={`/api/documentos/download/${d.id}`} className="text-blue-600 hover:underline flex-1">{d.nome_original}</a>
                    <label className="text-xs">
                      <span className="sr-only">Atualizar</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const form = new FormData();
                          form.append('file', f);
                          try {
                            await api.post(`/documentos/replace/${d.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
                            if (currentTask) {
                              const res = await api.get(`/documentos/tarefa/${currentTask.id}`);
                              setDocs(res.data);
                            }
                          } catch {}
                          e.currentTarget.value = '';
                        }}
                        id={`doc-replace-${d.id}`}
                      />
                      <Button size="xs" variant="ghost" onClick={() => document.getElementById(`doc-replace-${d.id}`)?.click()}>Atualizar</Button>
                    </label>
                    <Button size="xs" variant="ghost" onClick={() => onRenameDoc(d.id)}>Renomear</Button>
                    <Button size="xs" variant="ghost" className="text-red-600" onClick={() => onDeleteDoc(d.id)}>Apagar</Button>
                  </li>
                ))}
                {docs.length === 0 && <li className="text-gray-500">Sem anexos</li>}
              </ul>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Sub-compromissos</h3>
              <Button size="sm" onClick={() => setIsSubtaskModalOpen(true)}>Criar Sub-compromisso</Button>
            </div>
            <div className="space-y-2">
              {subtasks.length === 0 && (
                <p className="text-sm text-gray-500">Sem sub-compromissos</p>
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
      <TaskModal 
        isOpen={isSubtaskModalOpen} 
        onClose={() => setIsSubtaskModalOpen(false)} 
        parentId={Number(currentTask.id)} 
      />
      <TaskModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
        }} 
        task={currentTask}
        processoId={currentTask?.processo_id || null}
      />
    </Dialog>
  );
};