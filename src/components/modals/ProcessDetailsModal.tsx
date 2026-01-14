import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Process } from '@/hooks/useProcesses';
import { useTasks, Task } from '@/hooks/useTasks';
import { useLogsProcesso, LogProcesso } from '@/hooks/useLogsProcesso';
import { TaskDetailsModal } from '@/components/modals/TaskDetailsModal';
import { LogProcessoModal } from '@/components/modals/LogProcessoModal';
import { LogProcessoDetailsModal } from '@/components/modals/LogProcessoDetailsModal';
import { FileText, User, Building, Calendar, Clock, AlertCircle, CheckCircle2, Play, Pause, Upload, FileIcon, Minimize2, Plus, History, Phone, Mail, Users, File, MessageSquare, Edit, CheckSquare, MapPin, Paperclip, Eye } from 'lucide-react';
import { useMinimize } from '@/contexts/MinimizeContext';
import { ProcessLocationModal } from './ProcessLocationModal';
import { useProcesses } from '@/hooks/useProcesses';
import { useToast } from '@/hooks/use-toast';

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
  const { data: clienteData, isLoading: loadingCliente } = useQuery({
    queryKey: ['cliente', process?.cliente_id],
    queryFn: async () => {
      const response = await api.get(`/clientes/${process?.cliente_id}`);
      return response.data;
    },
    enabled: !!process?.cliente_id,
  });

  const { data: funcionarioData, isLoading: loadingFuncionario } = useQuery({
    queryKey: ['funcionario', process?.funcionario_id],
    queryFn: async () => {
      const response = await api.get(`/funcionarios/${process?.funcionario_id}`);
      return response.data;
    },
    enabled: !!process?.funcionario_id,
  });

  const clienteNome = clienteData?.nome || clienteData?.nome_empresa || process?.cliente?.nome || (process ? `Cliente ID: ${process.cliente_id}` : '');
  const funcionarioNome = funcionarioData?.nome || process?.funcionario?.nome || (process?.funcionario_id ? `Funcionário ID: ${process.funcionario_id}` : 'N/A');
  const { getTasksByProcess } = useTasks();
  const { logs, isLoading: loadingLogs } = useLogsProcesso(process?.id);
  const [processTasks, setProcessTasks] = React.useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = React.useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = React.useState(false);
  const [selectedLog, setSelectedLog] = React.useState<LogProcesso | null>(null);
  const [isLogDetailsOpen, setIsLogDetailsOpen] = React.useState(false);
  const [selectedLogDetails, setSelectedLogDetails] = React.useState<LogProcesso | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = React.useState(false);
  const [logDocs, setLogDocs] = React.useState<Record<number, {id:number; nome_original:string}[]>>({});
  const { minimize } = useMinimize();
  const { updateProcess } = useProcesses();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  React.useEffect(() => {
    if (process && isOpen) {
      setLoadingTasks(true);
      getTasksByProcess(process.id)
        .then(data => {
          const tasks = Array.isArray(data) ? data : (data?.tarefas || []);
          setProcessTasks(tasks);
        })
        .catch(error => {
          console.error('Erro ao buscar tarefas:', error);
          setProcessTasks([]);
        })
        .finally(() => {
          setLoadingTasks(false);
        });
    }
  }, [process, isOpen, getTasksByProcess]);

  React.useEffect(() => {
    const fetchLogDocs = async () => {
      if (!logs || logs.length === 0) return;
      const docsMap: Record<number, {id:number; nome_original:string}[]> = {};
      for (const log of logs) {
        try {
          const res = await api.get(`/documentos/log/${log.id}`);
          docsMap[log.id] = res.data;
        } catch {}
      }
      setLogDocs(docsMap);
    };
    if (logs && logs.length > 0) {
      fetchLogDocs();
    }
  }, [logs]);
  
  if (!process) return null;

  // Sem dados de teste: ficheiros reais devem vir do backend quando disponível

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'bg-green-100 text-green-800';
      case 'em_curso':
        return 'bg-blue-100 text-blue-800';
      case 'pendente':
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

  const handleAddLog = () => {
    setSelectedLog(null);
    setIsLogModalOpen(true);
  };

  const handleEditLog = (log: LogProcesso) => {
    if (log.is_automatico) {
      toast({
        title: "Aviso",
        description: "Não é possível editar registos automáticos.",
        variant: "destructive",
      });
      return;
    }
    setSelectedLog(log);
    setIsLogModalOpen(true);
  };

  const handleEditLocation = () => {
    setIsLocationModalOpen(true);
  };

  const handleUpdateLocation = async (processId: number, localizacao: string) => {
    await updateProcess.mutateAsync({
      id: processId,
      onde_estao: localizacao,
    });
    // Invalidar queries para atualizar os dados
    queryClient.invalidateQueries({ queryKey: ['processes'] });
    queryClient.invalidateQueries({ queryKey: ['processo', processId] });
    toast({
      title: "Sucesso",
      description: "Localização atualizada com sucesso.",
    });
  };

  const handleViewTask = (tarefaId: number) => {
    // Buscar a tarefa e abrir o modal de detalhes
    const task = processTasks.find(t => t.id === tarefaId || t.id === tarefaId.toString());
    if (task) {
      setSelectedTask(task as Task);
      setIsTaskDetailsOpen(true);
    }
  };

  const getLogIcon = (tipo: string) => {
    switch (tipo) {
      case 'criacao':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'alteracao':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'tarefa_criada':
        return <Plus className="h-4 w-4 text-purple-600" />;
      case 'tarefa_concluida':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'estado_alterado':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'telefone':
        return <Phone className="h-4 w-4 text-blue-600" />;
      case 'reuniao':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'email':
        return <Mail className="h-4 w-4 text-red-600" />;
      case 'documento':
        return <File className="h-4 w-4 text-gray-600" />;
      case 'observacao':
        return <MessageSquare className="h-4 w-4 text-gray-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLogColor = (tipo: string) => {
    switch (tipo) {
      case 'criacao':
        return 'bg-green-50 border-green-200';
      case 'alteracao':
        return 'bg-blue-50 border-blue-200';
      case 'tarefa_criada':
        return 'bg-purple-50 border-purple-200';
      case 'tarefa_concluida':
        return 'bg-green-50 border-green-200';
      case 'estado_alterado':
        return 'bg-orange-50 border-orange-200';
      case 'telefone':
        return 'bg-blue-50 border-blue-200';
      case 'reuniao':
        return 'bg-purple-50 border-purple-200';
      case 'email':
        return 'bg-red-50 border-red-200';
      case 'documento':
        return 'bg-gray-50 border-gray-200';
      case 'observacao':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'em_curso':
        return 'Em Curso';
      case 'pendente':
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

  // Remove dueDate e priority não existem na nova interface
  const isOverdue = false; // Temporariamente false até ser definido no backend

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span>Detalhes do Processo</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-12 top-4"
              onClick={() => {
                minimize({ type: 'process', title: `Processo: ${process?.titulo ?? ''}` , payload: { process } });
                onClose();
              }}
              aria-label={'Minimizar'}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{process.titulo}</h2>
            {process.descricao && (
              <p className="text-muted-foreground mt-2">{process.descricao}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Badge className={getStatusColor(process.estado)}>
              {getStatusLabel(process.estado)}
            </Badge>
            {process.tipo && (
              <Badge variant="outline">
                {process.tipo}
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <AlertCircle className="h-3 w-3" />
                <span>Atrasado</span>
              </Badge>
            )}
          </div>
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="tasks">Tarefas</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                      <Building className="h-4 w-4" />
                      <span>Cliente</span>
                    </label>
                    <p className="text-lg font-semibold">{loadingCliente ? 'A carregar...' : (clienteNome || 'N/A')}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>Responsável</span>
                    </label>
                    <p className="text-sm">{loadingFuncionario ? 'A carregar...' : (funcionarioNome || 'N/A')}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Data de Criação</span>
                    </label>
                    <p className="text-sm">{new Date(process.criado_em).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                    <p className="text-sm">{process.tipo || 'Não definido'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado Atual</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(process.estado)}>
                        {getStatusLabel(process.estado)}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>Localização</span>
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEditLocation}
                        className="h-7 px-2"
                        title="Alterar localização"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Alterar
                      </Button>
                    </div>
                    <p className="text-sm">{(process as any).onde_estao || 'Não definido'}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6 mt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Tarefas Relacionadas</h3>
                {loadingTasks ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>Carregando tarefas...</p>
                  </div>
                ) : processTasks.length > 0 ? (
                  <div className="space-y-3">
                    {processTasks.map((task) => (
                      <Card
                        key={task.id}
                        className="border-l-4 border-l-blue-500 hover:shadow cursor-pointer"
                        onClick={() => { setSelectedTask(task as Task); setIsTaskDetailsOpen(true); }}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium">{task.titulo}</CardTitle>
                            <div className="flex items-center space-x-2">
                              {task.concluida ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                              )}
                              <Badge 
                                variant={task.concluida ? 'default' : 'outline'}
                                className="text-xs"
                              >
                                {task.concluida ? 'Concluída' : 'Pendente'}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {task.descricao && (
                            <p className="text-sm text-muted-foreground mb-2">{task.descricao}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            {task.prioridade && (
                              <span>Prioridade: {task.prioridade === 'alta' ? 'Alta' : task.prioridade === 'media' ? 'Média' : 'Baixa'}</span>
                            )}
                            {task.data_fim && (
                              <span>Prazo: {new Date(task.data_fim).toLocaleDateString('pt-BR')}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma tarefa relacionada encontrada</p>
                  </div>
                )}
              </div>
            </TabsContent>

            

            <TabsContent value="timeline" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Timeline do Processo</h3>
                <Button onClick={handleAddLog} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Registo
                </Button>
              </div>
              
              {loadingLogs ? (
                <div className="flex justify-center py-8">
                  <div className="text-muted-foreground">Carregando registos...</div>
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registo registado ainda.
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-lg border ${getLogColor(log.tipo)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getLogIcon(log.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                                 <div className="flex items-center justify-between">
                                   <h4 
                                     className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                                     onClick={() => {
                                       setSelectedLogDetails(log);
                                       setIsLogDetailsOpen(true);
                                     }}
                                   >
                                     {log.titulo}
                                   </h4>
                                   <div className="flex items-center space-x-2">
                                     <span className="text-xs text-gray-500">
                                       {new Date(log.data_hora).toLocaleString('pt-BR')}
                                     </span>
                                     <Button
                                       variant="ghost"
                                       size="sm"
                                       onClick={() => {
                                         setSelectedLogDetails(log);
                                         setIsLogDetailsOpen(true);
                                       }}
                                       className="h-6 px-2"
                                       title="Ver detalhes"
                                     >
                                       <Eye className="h-3 w-3" />
                                     </Button>
                                     {log.tarefa_id && (
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           handleViewTask(log.tarefa_id!);
                                         }}
                                         className="h-6 px-2"
                                         title="Ver tarefa"
                                       >
                                         <CheckSquare className="h-3 w-3" />
                                       </Button>
                                     )}
                                     {!log.is_automatico && (
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           handleEditLog(log);
                                         }}
                                         className="h-6 px-2"
                                         title="Editar registo"
                                       >
                                         <Edit className="h-3 w-3" />
                                       </Button>
                                     )}
                                   </div>
                                 </div>
                          {log.descricao && (
                            <p className="mt-1 text-sm text-gray-600">
                              {log.descricao}
                            </p>
                          )}
                          {log.funcionario_nome && (
                            <p className="mt-1 text-xs text-gray-500">
                              Por: {log.funcionario_nome}
                            </p>
                          )}
                          {logDocs[log.id] && logDocs[log.id].length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                                <Paperclip className="h-3 w-3" />
                                <span className="font-medium">Anexos:</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {logDocs[log.id].map((doc) => (
                                  <a
                                    key={doc.id}
                                    href={`/api/documentos/download/${doc.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                                  >
                                    <FileIcon className="h-3 w-3" />
                                    {doc.nome_original}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
      <TaskDetailsModal isOpen={isTaskDetailsOpen} onClose={() => setIsTaskDetailsOpen(false)} task={selectedTask} />
      <LogProcessoModal 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
        processoId={process?.id || 0}
        log={selectedLog}
      />
      <LogProcessoDetailsModal
        isOpen={isLogDetailsOpen}
        onClose={() => {
          setIsLogDetailsOpen(false);
          setSelectedLogDetails(null);
        }}
        log={selectedLogDetails}
        processoId={process?.id || 0}
        onViewTask={(taskId) => {
          const task = processTasks.find(t => t.id === taskId);
          if (task) {
            setSelectedTask(task as Task);
            setIsTaskDetailsOpen(true);
          }
          setIsLogDetailsOpen(false);
        }}
        onViewProcess={() => {
          // Já estamos no modal do processo, apenas fechar o modal de detalhes
          setIsLogDetailsOpen(false);
        }}
      />
      <ProcessLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        process={process}
        onSave={handleUpdateLocation}
        isSubmitting={updateProcess.isPending}
      />
    </Dialog>
  );
};