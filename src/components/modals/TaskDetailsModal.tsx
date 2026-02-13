import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Clock, AlertCircle, Calendar, User, Building, Download, Edit, X, MapPin, CalendarClock, Folder, UserPlus } from 'lucide-react';
import { Task, useTasks } from '@/hooks/useTasks';
import { useEmployeeList } from '@/hooks/useEmployees';
import { useProcesses, Process } from '@/hooks/useProcesses';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Minimize2 } from 'lucide-react';
import { useMinimize } from '@/contexts/MinimizeContext';
import { TaskModal } from './TaskModal';
import { ReassignTaskModal } from './ReassignTaskModal';
import { ProcessDetailsModal } from './ProcessDetailsModal';
import { ClickableClientName } from '@/components/ClickableClientName';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
  const { data: employees = [] } = useEmployeeList();
  const { processes } = useProcesses();
  const { generateTaskPDF, updateTaskStatus, updateTask, tasks, getTaskById } = useTasks();
  const queryClient = useQueryClient();
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const { data: taskDetail } = useQuery({
    queryKey: ['task', currentTask?.id],
    queryFn: () => getTaskById(currentTask!.id),
    enabled: !!isOpen && !!currentTask?.id,
  });
  const displayTask = taskDetail ?? currentTask;
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);
  const { minimize } = useMinimize();
  const [docs, setDocs] = useState<{id:number; nome_original:string}[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [concludeNotesDialogOpen, setConcludeNotesDialogOpen] = useState(false);
  const [concludeNotes, setConcludeNotes] = useState('');
  const [postponeDialogOpen, setPostponeDialogOpen] = useState(false);
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeMotivo, setPostponeMotivo] = useState('');
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [subtasksRefreshTrigger, setSubtasksRefreshTrigger] = useState(0);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);

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
  }, [currentTask, subtasksRefreshTrigger]);

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

  const handleStatusToggle = () => {
    if (!currentTask) return;
    const newStatus = !currentTask.concluida;
    if (newStatus) {
      setConcludeNotes('');
      setConcludeNotesDialogOpen(true);
    } else {
      updateTaskStatus.mutateAsync({ id: currentTask.id, concluida: false }).then(() => {
        setCurrentTask({ ...currentTask, concluida: false });
      }).catch(() => {});
    }
  };

  const handleConfirmConclude = async () => {
    if (!currentTask) return;
    const notas = concludeNotes.trim() || undefined;
    try {
      await updateTaskStatus.mutateAsync({
        id: currentTask.id,
        concluida: true,
        notas_conclusao: notas,
      });
      setCurrentTask({ ...currentTask, concluida: true, notas_conclusao: notas ?? null });
      setConcludeNotesDialogOpen(false);
      setConcludeNotes('');
    } catch {
      // Error handling is done in the mutation
    }
  };

  const handlePostpone = () => {
    const current = currentTask?.data_fim ? new Date(currentTask.data_fim) : new Date();
    setPostponeDate(current.toISOString().slice(0, 10));
    setPostponeMotivo(currentTask?.motivo_adiamento ?? '');
    setPostponeDialogOpen(true);
  };

  const handleConfirmPostpone = async () => {
    if (!currentTask || !postponeDate.trim()) return;
    try {
      const newDate = postponeDate.trim() + 'T12:00:00';
      await updateTask.mutateAsync({
        id: currentTask.id,
        data_fim: newDate,
        motivo_adiamento: postponeMotivo.trim() || undefined,
      });
      setCurrentTask({ ...currentTask, data_fim: newDate, motivo_adiamento: postponeMotivo.trim() || null });
      queryClient.invalidateQueries({ queryKey: ['task', currentTask.id] });
      setPostponeDialogOpen(false);
      setPostponeDate('');
      setPostponeMotivo('');
    } catch {
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
            <DialogDescription className="sr-only">Nenhum compromisso selecionado.</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-gray-500">Nenhum compromisso selecionado.</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <DialogDescription className="sr-only">Detalhes do compromisso: {displayTask.titulo}</DialogDescription>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              {getStatusIcon(displayTask.concluida)}
              <span>{displayTask.titulo}</span>
              {isOverdue(displayTask.data_fim) && (
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
              {!displayTask.concluida && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReassignModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Reencaminhar
                </Button>
              )}
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
                <Badge className={getStatusColor(displayTask.concluida)}>
                  {getStatusLabel(displayTask.concluida)}
                </Badge>
                {!displayTask.concluida ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStatusToggle}
                      disabled={updateTaskStatus.isPending}
                      className="text-green-600 hover:text-green-700"
                      title="Concluir"
                    >
                      <CheckSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePostpone}
                      disabled={updateTask.isPending}
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
              <Badge className={getPriorityColor(displayTask.prioridade)}>
                {getPriorityLabel(displayTask.prioridade)}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Descrição</label>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{displayTask.descricao || '-'}</p>
            </div>

            {displayTask.concluida && (displayTask.notas_conclusao ?? '').trim() && (
              <div className="rounded-lg border border-green-200 bg-green-50/50 p-3">
                <label className="text-sm font-medium text-green-800">O que foi feito / motivo do encerramento</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{displayTask.notas_conclusao}</p>
              </div>
            )}

            {(taskDetail?.adiamentos && taskDetail.adiamentos.length > 0) ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <label className="text-sm font-medium text-amber-800">Histórico de adiamentos</label>
                <ul className="mt-2 space-y-3 list-none pl-0">
                  {taskDetail.adiamentos.map((a) => (
                    <li key={a.id} className="text-sm border-l-2 border-amber-300 pl-3 py-1">
                      <span className="text-amber-800 font-medium">
                        {a.data_anterior
                          ? new Date(a.data_anterior).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                        {' → '}
                        {new Date(a.data_nova).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {a.motivo && <p className="mt-0.5 text-gray-700 whitespace-pre-wrap">{a.motivo}</p>}
                      <p className="text-xs text-gray-500 mt-0.5">
                        Registado em {new Date(a.criado_em).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (displayTask && (displayTask.motivo_adiamento ?? '').trim()) ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <label className="text-sm font-medium text-amber-800">Último adiamento</label>
                {displayTask.data_antes_adiamento && (
                  <p className="text-sm text-amber-800 mt-0.5">
                    Data anterior: {new Date(displayTask.data_antes_adiamento).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{displayTask.motivo_adiamento}</p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Processo</label>
                  <p className="text-sm text-gray-900">
                    {displayTask.processo_id
                      ? (() => {
                          const processo = processes.find((p) => p.id === displayTask!.processo_id);
                          if (!processo) return String(displayTask!.processo_id);
                          return (
                            <button
                              type="button"
                              onClick={() => processo && setSelectedProcess(processo)}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors text-left"
                            >
                              {processo.titulo}
                            </button>
                          );
                        })()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Entidade</label>
                  <p className="text-sm text-gray-900">
                    {displayTask.processo_id
                      ? (() => {
                          const processo = processes.find((p) => p.id === displayTask!.processo_id);
                          if (!processo?.cliente_id) return 'N/A';
                          const entidadeNome =
                            processo.dossie?.entidade?.nome ||
                            processo.dossie?.entidade?.nome_empresa ||
                            (processo.cliente as any)?.nome ||
                            (processo.cliente as any)?.nome_empresa;
                          return (
                            <ClickableClientName
                              clientId={processo.cliente_id}
                              clientName={entidadeNome}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                            />
                          );
                        })()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Folder className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Arquivo</label>
                  <p className="text-sm text-gray-900">
                    {displayTask.processo_id
                      ? (() => {
                          const processo = processes.find((p) => p.id === displayTask!.processo_id);
                          if (!processo?.dossie) return 'N/A';
                          return processo.dossie.numero ?? processo.dossie.id ?? 'N/A';
                        })()
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Responsável</label>
                  <p className="text-sm text-gray-900">
                    {displayTask.responsavel_id 
                      ? employees.find(emp => emp.id === displayTask.responsavel_id)?.nome || `ID: ${displayTask.responsavel_id}`
                      : 'Não atribuído'}
                  </p>
                </div>
              </div>

              {displayTask.autor_id && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Autor</label>
                    <p className="text-sm text-gray-900">
                      {employees.find(emp => emp.id === displayTask.autor_id!)?.nome || `ID: ${displayTask.autor_id}`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Criado em</label>
                  <p className="text-sm text-gray-900">{displayTask.criado_em ? new Date(displayTask.criado_em).toLocaleDateString('pt-BR') : '-'}</p>
                </div>
              </div>

              {displayTask.data_fim && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-500">Prazo</label>
                    <p className={`text-sm ${isOverdue(displayTask.data_fim) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {displayTask.data_fim ? new Date(displayTask.data_fim).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>
                </div>
              )}
              {('tipo' in displayTask) && (
                <div className="flex items-center space-x-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo</label>
                    <p className="text-sm text-gray-900">{(displayTask as any).tipo || '-'}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Localização</label>
                  <p className="text-sm text-gray-900">{(displayTask as any).onde_estao === 'Tarefas' ? 'Pendentes' : ((displayTask as any).onde_estao || 'Sem Localização')}</p>
                </div>
              </div>
              {(displayTask as any).custo != null && Number((displayTask as any).custo) > 0 && (
                <div className="flex items-center space-x-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Custo</label>
                    <p className="text-sm text-gray-900 font-medium">
                      {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Number((displayTask as any).custo))}
                    </p>
                  </div>
                </div>
              )}
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
        initialData={{
          cliente_id: displayTask.cliente_id ?? (displayTask.processo_id && processes.find(p => p.id === displayTask.processo_id)?.cliente_id) ?? null,
          processo_id: displayTask.processo_id ?? null,
        }}
      />
      <TaskModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
        }} 
        task={currentTask}
        processoId={currentTask?.processo_id || null}
      />
      <ReassignTaskModal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        task={displayTask}
        subtasks={subtasks}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['task', currentTask?.id] });
          setSubtasksRefreshTrigger((k) => k + 1);
          if (currentTask?.id) {
            getTaskById(String(currentTask.id)).then((t) => t && setCurrentTask(t));
          }
        }}
      />
      <ProcessDetailsModal
        isOpen={!!selectedProcess}
        onClose={() => setSelectedProcess(null)}
        process={selectedProcess}
      />
    </Dialog>

    <Dialog open={concludeNotesDialogOpen} onOpenChange={setConcludeNotesDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Concluir tarefa</DialogTitle>
          <DialogDescription>
            Descreva brevemente o que foi feito ou o motivo do encerramento (opcional). Este texto ficará registado no histórico do processo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="conclude-notes-modal">Descrição</Label>
          <Textarea
            id="conclude-notes-modal"
            placeholder="Ex.: Documentos entregues no cartório. Cliente notificado."
            value={concludeNotes}
            onChange={(e) => setConcludeNotes(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setConcludeNotesDialogOpen(false); setConcludeNotes(''); }}>
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
            <Label htmlFor="postpone-date">Nova data</Label>
            <Input
              id="postpone-date"
              type="date"
              value={postponeDate}
              onChange={(e) => setPostponeDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postpone-motivo">Motivo do adiamento (opcional)</Label>
            <Textarea
              id="postpone-motivo"
              placeholder="Ex.: Aguardar documentação do cliente."
              value={postponeMotivo}
              onChange={(e) => setPostponeMotivo(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setPostponeDialogOpen(false); setPostponeDate(''); setPostponeMotivo(''); }}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmPostpone} disabled={updateTask.isPending || !postponeDate.trim()}>
            Adiar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};