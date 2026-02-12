import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Process } from '@/hooks/useProcesses';
import { useTasks, Task } from '@/hooks/useTasks';
import { useLogsProcesso, LogProcesso } from '@/hooks/useLogsProcesso';
import { TaskDetailsModal } from '@/components/modals/TaskDetailsModal';
import { TaskModal } from '@/components/modals/TaskModal';
import { LogProcessoModal } from '@/components/modals/LogProcessoModal';
import { LogProcessoDetailsModal } from '@/components/modals/LogProcessoDetailsModal';
import { ClientDetailsModal } from '@/components/modals/ClientDetailsModal';
import { FileText, User, Building, Calendar, Clock, AlertCircle, CheckCircle2, Play, Pause, Upload, FileIcon, Minimize2, Plus, History, Phone, Mail, Users, File, MessageSquare, Edit, CheckSquare, MapPin, Paperclip, Eye, Trash2, Filter, Search, X } from 'lucide-react';
import { useMinimize } from '@/contexts/MinimizeContext';
import { ProcessLocationModal } from './ProcessLocationModal';
import { useProcesses } from '@/hooks/useProcesses';
import { useToast } from '@/hooks/use-toast';
import { Client, useClients } from '@/hooks/useClients';
import { ProcessoEntidadesSecundariasTab } from '@/components/ProcessoEntidadesSecundariasTab';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import ptLocale from '@fullcalendar/core/locales/pt';

interface ProcessDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  process: Process | null;
  onEdit?: (process: Process) => void;
}

export const ProcessDetailsModal: React.FC<ProcessDetailsModalProps> = ({
  isOpen,
  onClose,
  process,
  onEdit,
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
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false);
  const [taskFilters, setTaskFilters] = React.useState({
    searchTerm: '',
    status: 'all',
    prioridade: 'all',
  });
  const [isLogModalOpen, setIsLogModalOpen] = React.useState(false);
  const [selectedLog, setSelectedLog] = React.useState<LogProcesso | null>(null);
  const [isLogDetailsOpen, setIsLogDetailsOpen] = React.useState(false);
  const [selectedLogDetails, setSelectedLogDetails] = React.useState<LogProcesso | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = React.useState(false);
  const [logDocs, setLogDocs] = React.useState<Record<number, {id:number; nome_original:string}[]>>({});
  const [allDocuments, setAllDocuments] = React.useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = React.useState(false);
  const [uploadingDoc, setUploadingDoc] = React.useState(false);
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
  const [isClientDetailsOpen, setIsClientDetailsOpen] = React.useState(false);
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

  // Buscar TODOS os documentos do processo numa única chamada API
  // (evita N+1 queries: antes fazia 1 por tarefa + 1 por subtarefa + 1 por log)
  React.useEffect(() => {
    if (!process || !isOpen) return;
    let cancelled = false;

    setLoadingDocuments(true);
    api.get(`/documentos/processo-completo/${process.id}`)
      .then(res => {
        if (!cancelled) {
          setAllDocuments(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch(error => {
        if (!cancelled) {
          console.error('Erro ao buscar documentos do processo:', error);
          setAllDocuments([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDocuments(false);
      });

    return () => { cancelled = true; };
  }, [process?.id, isOpen]);

  // Buscar documentos agrupados por log (para mostrar anexos na timeline)
  // Uma única chamada em vez de N chamadas (uma por log)
  React.useEffect(() => {
    if (!process || !isOpen) return;
    let cancelled = false;

    api.get(`/documentos/logs-bulk/${process.id}`)
      .then(res => {
        if (!cancelled && res.data) {
          // Backend retorna { log_id: [{id, nome_original}] }
          // Converter keys para number
          const docsMap: Record<number, {id:number; nome_original:string}[]> = {};
          for (const [key, val] of Object.entries(res.data)) {
            docsMap[Number(key)] = val as {id:number; nome_original:string}[];
          }
          setLogDocs(docsMap);
        }
      })
      .catch(() => {
        if (!cancelled) setLogDocs({});
      });

    return () => { cancelled = true; };
  }, [process?.id, isOpen]);
  
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

  const handleViewClient = () => {
    if (!process?.cliente_id) return;
    // Usar os dados do cliente já carregados pela query
    if (clienteData) {
      setSelectedClient(clienteData as Client);
      setIsClientDetailsOpen(true);
    } else if (!loadingCliente) {
      // Se não estiver a carregar e não tiver dados, tentar buscar
      toast({
        title: "Aviso",
        description: "Dados do cliente não disponíveis.",
        variant: "destructive",
      });
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

  // Funções para compromissos (tasks)
  const isTaskOverdue = (dataFim: string | null, concluida: boolean) => {
    if (!dataFim || concluida) return false;
    const today = new Date();
    const dueDate = new Date(dataFim);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const getTaskStatusColor = (concluida: boolean) => {
    return concluida 
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const getTaskPriorityColor = (prioridade: string | null) => {
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

  const getTaskStatusLabel = (concluida: boolean) => {
    return concluida ? 'Concluída' : 'Pendente';
  };

  const getTaskPriorityLabel = (prioridade: string | null) => {
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

  const getTaskStatusIcon = (concluida: boolean) => {
    return concluida 
      ? <CheckSquare className="h-4 w-4 text-green-600" />
      : <AlertCircle className="h-4 w-4 text-yellow-600" />;
  };

  const getTaskBackgroundColor = (task: any) => {
    if (task.concluida) {
      return 'border-green-200 bg-green-50';
    } else if (isTaskOverdue(task.data_fim, task.concluida)) {
      return 'border-red-200 bg-red-50';
    } else {
      return 'border-yellow-200 bg-yellow-50';
    }
  };

  // Remove dueDate e priority não existem na nova interface
  const isOverdue = false; // Temporariamente false até ser definido no backend

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="h-6 w-6" />
                <span>Detalhes do Processo</span>
              </DialogTitle>
              <DialogDescription>
                Informações completas do processo e atividades relacionadas
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && process && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(process)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  minimize({ type: 'process', title: `Processo: ${process?.titulo ?? ''}` , payload: { process } });
                  onClose();
                }}
                aria-label="Minimizar"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="tasks">Compromissos</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="calendar">Calendário</TabsTrigger>
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
                    {loadingCliente ? (
                      <p className="text-lg font-semibold">A carregar...</p>
                    ) : clienteNome && clienteNome !== 'N/A' ? (
                      <button
                        onClick={handleViewClient}
                        className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                      >
                        {clienteNome}
                      </button>
                    ) : (
                      <p className="text-lg font-semibold">N/A</p>
                    )}
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

              <Separator className="my-6" />
              <div>
                <ProcessoEntidadesSecundariasTab
                  processoId={process?.id || null}
                  clientePrincipal={process?.cliente ? {
                    id: process.cliente_id || 0,
                    nome: (process.cliente as any)?.nome,
                    nome_empresa: (process.cliente as any)?.nome_empresa,
                    nif: (process.cliente as any)?.nif,
                    nif_empresa: (process.cliente as any)?.nif_empresa,
                    tipo: (process.cliente as any)?.tipo,
                  } : clienteData ? {
                    id: clienteData.id,
                    nome: clienteData.nome,
                    nome_empresa: clienteData.nome_empresa,
                    nif: clienteData.nif,
                    nif_empresa: clienteData.nif_empresa,
                    tipo: clienteData.tipo,
                  } : null}
                />
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6 mt-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Compromissos Relacionados</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTaskModalOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Compromisso
                  </Button>
                </div>

                {/* Estatísticas */}
                {(() => {
                  const pendentesCount = processTasks.filter((t: any) => !t.concluida).length;
                  const concluidasCount = processTasks.filter((t: any) => t.concluida).length;
                  const totalCount = processTasks.length;

                  return (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <Card 
                        className="cursor-pointer hover:shadow transition-shadow py-2 px-3"
                        onClick={() => {
                          setTaskFilters(prev => ({ ...prev, status: 'pendente' }));
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium">Pendentes</span>
                          </div>
                          <span className="text-lg font-bold text-yellow-600">
                            {pendentesCount}
                          </span>
                        </div>
                      </Card>

                      <Card 
                        className="cursor-pointer hover:shadow transition-shadow py-2 px-3"
                        onClick={() => {
                          setTaskFilters(prev => ({ ...prev, status: 'concluida' }));
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Concluídas</span>
                          </div>
                          <span className="text-lg font-bold text-green-600">
                            {concluidasCount}
                          </span>
                        </div>
                      </Card>

                      <Card 
                        className="cursor-pointer hover:shadow transition-shadow py-2 px-3"
                        onClick={() => {
                          setTaskFilters(prev => ({ ...prev, status: 'all' }));
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Total</span>
                          </div>
                          <span className="text-lg font-bold text-blue-600">
                            {totalCount}
                          </span>
                        </div>
                      </Card>
                    </div>
                  );
                })()}

                {/* Filtros */}
                <Card className="mb-4">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Pesquisar..."
                            value={taskFilters.searchTerm}
                            onChange={(e) => setTaskFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                            className="pl-8 h-9"
                          />
                        </div>
                      </div>
                      <div className="w-32">
                        <Select 
                          value={taskFilters.status} 
                          onValueChange={(value) => setTaskFilters(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pendente">Pendentes</SelectItem>
                            <SelectItem value="concluida">Concluídas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32">
                        <Select 
                          value={taskFilters.prioridade} 
                          onValueChange={(value) => setTaskFilters(prev => ({ ...prev, prioridade: value }))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Prioridade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="media">Média</SelectItem>
                            <SelectItem value="baixa">Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-9"
                        onClick={() => {
                          setTaskFilters({
                            searchTerm: '',
                            status: 'all',
                            prioridade: 'all',
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {loadingTasks ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>Carregando compromissos...</p>
                  </div>
                ) : (() => {
                  // Aplicar filtros
                  const filteredTasks = processTasks.filter((t: any) => {
                    const matchesSearch = taskFilters.searchTerm === '' || 
                      t.titulo?.toLowerCase().includes(taskFilters.searchTerm.toLowerCase()) ||
                      t.descricao?.toLowerCase().includes(taskFilters.searchTerm.toLowerCase());
                    
                    const matchesStatus = taskFilters.status === 'all' ||
                      (taskFilters.status === 'pendente' && !t.concluida) ||
                      (taskFilters.status === 'concluida' && t.concluida);
                    
                    const matchesPrioridade = taskFilters.prioridade === 'all' ||
                      t.prioridade === taskFilters.prioridade;
                    
                    return matchesSearch && matchesStatus && matchesPrioridade;
                  });

                  if (filteredTasks.length === 0) {
                    return (
                      <div className="text-center text-muted-foreground py-8">
                        <p>Nenhum compromisso encontrado com os filtros aplicados.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {(() => {
                        // Separar compromissos principais e sub-compromissos
                        const mainTasks = filteredTasks.filter((t: any) => !t.parent_id);
                        const subtasks = filteredTasks.filter((t: any) => t.parent_id);
                      
                      // Criar um mapa de sub-compromissos por parent_id
                      const subtasksByParent: Record<string, any[]> = {};
                      subtasks.forEach((st: any) => {
                        const parentId = st.parent_id?.toString() || '';
                        if (!subtasksByParent[parentId]) {
                          subtasksByParent[parentId] = [];
                        }
                        subtasksByParent[parentId].push(st);
                      });
                      
                      return mainTasks.map((task: any) => {
                        const taskSubtasks = subtasksByParent[task.id?.toString() || ''] || [];
                        return (
                          <div key={task.id} className="space-y-2">
                            {/* Compromisso Principal */}
                            <Card
                              className={`hover:shadow-md transition-shadow cursor-pointer ${getTaskBackgroundColor(task)}`}
                              onClick={() => { setSelectedTask(task as Task); setIsTaskDetailsOpen(true); }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      {getTaskStatusIcon(task.concluida)}
                                      <h3 className="font-semibold">{task.titulo}</h3>
                                      {isTaskOverdue(task.data_fim, task.concluida) && (
                                        <Badge variant="destructive">Atrasada</Badge>
                                      )}
                                    </div>
                                    {task.descricao && (
                                      <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{task.descricao}</p>
                                    )}
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      {task.prioridade && (
                                        <span><strong>Prioridade:</strong> {getTaskPriorityLabel(task.prioridade)}</span>
                                      )}
                                      {task.data_fim && (
                                        <span><strong>Prazo:</strong> {new Date(task.data_fim).toLocaleDateString('pt-BR')}</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col space-y-2">
                                    <Badge className={getTaskStatusColor(task.concluida)}>
                                      {getTaskStatusLabel(task.concluida)}
                                    </Badge>
                                    {isTaskOverdue(task.data_fim, task.concluida) && (
                                      <Badge variant="destructive" className="text-xs">
                                        Atrasada
                                      </Badge>
                                    )}
                                    {task.prioridade && (
                                      <Badge className={getTaskPriorityColor(task.prioridade)}>
                                        {getTaskPriorityLabel(task.prioridade)}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            {/* Sub-compromissos */}
                            {taskSubtasks.length > 0 && (
                              <div className="ml-6 space-y-2">
                                {taskSubtasks.map((subtask: any) => (
                                  <Card
                                    key={subtask.id}
                                    className={`hover:shadow-md transition-shadow cursor-pointer ${getTaskBackgroundColor(subtask)}`}
                                    onClick={() => { setSelectedTask(subtask as Task); setIsTaskDetailsOpen(true); }}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2 mb-2">
                                            {getTaskStatusIcon(subtask.concluida)}
                                            <h3 className="font-semibold text-sm">{subtask.titulo}</h3>
                                            <Badge variant="secondary">Sub-compromisso</Badge>
                                            {isTaskOverdue(subtask.data_fim, subtask.concluida) && (
                                              <Badge variant="destructive">Atrasada</Badge>
                                            )}
                                          </div>
                                          {subtask.descricao && (
                                            <p className="text-xs text-gray-600 mb-3 whitespace-pre-wrap">{subtask.descricao}</p>
                                          )}
                                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            {subtask.prioridade && (
                                              <span><strong>Prioridade:</strong> {getTaskPriorityLabel(subtask.prioridade)}</span>
                                            )}
                                            {subtask.data_fim && (
                                              <span><strong>Prazo:</strong> {new Date(subtask.data_fim).toLocaleDateString('pt-BR')}</span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex flex-col space-y-2">
                                          <Badge className={getTaskStatusColor(subtask.concluida)}>
                                            {getTaskStatusLabel(subtask.concluida)}
                                          </Badge>
                                          {isTaskOverdue(subtask.data_fim, subtask.concluida) && (
                                            <Badge variant="destructive" className="text-xs">
                                              Atrasada
                                            </Badge>
                                          )}
                                          {subtask.prioridade && (
                                            <Badge className={getTaskPriorityColor(subtask.prioridade)}>
                                              {getTaskPriorityLabel(subtask.prioridade)}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  );
                })()}
              </div>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-6 mt-6">
              <h3 className="text-lg font-semibold">Calendário do processo</h3>
              <p className="text-sm text-muted-foreground">Compromissos e prazos deste processo.</p>
              <Card>
                <CardContent className="p-4 min-h-[360px]">
                  <FullCalendar
                    plugins={[dayGridPlugin, listPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' }}
                    locale={ptLocale}
                    height="auto"
                    events={processTasks
                      .filter((t: any) => t.data_fim)
                      .map((t: any) => ({
                        id: String(t.id),
                        title: t.titulo || '(sem título)',
                        start: t.data_fim,
                        allDay: true,
                        extendedProps: { task: t },
                        backgroundColor: t.concluida ? '#22c55e' : '#eab308',
                        borderColor: t.concluida ? '#16a34a' : '#ca8a04',
                        textColor: '#fff',
                      }))}
                    eventClick={(info) => {
                      const task = info.event.extendedProps?.task;
                      if (task) {
                        setSelectedTask(task as Task);
                        setIsTaskDetailsOpen(true);
                      }
                    }}
                  />
                </CardContent>
              </Card>
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
                                         title="Ver compromisso"
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
                                {logDocs[log.id].map((doc, idx) => (
                                  <a
                                    key={`log-${log.id}-doc-${doc.id}-${idx}`}
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

            <TabsContent value="documents" className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documentos</h3>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !process) return;
                      try {
                        setUploadingDoc(true);
                        const form = new FormData();
                        form.append('file', file);
                        await api.post(`/documentos/upload/${process.id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
                        toast({
                          title: "Sucesso",
                          description: "Documento enviado com sucesso.",
                        });
                        // Recarregar todos os documentos (endpoint bulk)
                        const allDocs = await api.get(`/documentos/processo-completo/${process.id}`);
                        setAllDocuments(Array.isArray(allDocs.data) ? allDocs.data : []);
                      } catch (error: any) {
                        toast({
                          title: "Erro",
                          description: error?.response?.data?.detail || "Erro ao enviar documento.",
                          variant: "destructive",
                        });
                      } finally {
                        setUploadingDoc(false);
                        e.target.value = '';
                      }
                    }}
                    disabled={uploadingDoc}
                    className="text-sm"
                  />
                </div>
              </div>
              
              {loadingDocuments ? (
                <div className="flex justify-center py-8">
                  <div className="text-muted-foreground">Carregando documentos...</div>
                </div>
              ) : allDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum documento encontrado.
                </div>
              ) : (
                <div className="space-y-4">
                  {allDocuments.map((doc, idx) => (
                    <Card key={`doc-${doc.id}-${doc.origem}-${doc.origem_id}-${idx}`} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <FileIcon className="h-4 w-4 text-gray-500" />
                            <a
                              href={`/api/documentos/download/${doc.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {doc.nome_original}
                            </a>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500 font-medium">Origem:</span>
                              <Badge variant="outline" className="text-xs">
                                {doc.origem}
                              </Badge>
                              <span className="text-gray-700 font-semibold">{doc.origem_nome}</span>
                            </div>
                            {doc.criado_em && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>Adicionado em {new Date(doc.criado_em).toLocaleDateString('pt-BR', { 
                                  day: '2-digit', 
                                  month: '2-digit', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!confirm('Tem certeza que deseja apagar este ficheiro?')) {
                              return;
                            }
                            try {
                              await api.delete(`/documentos/${doc.id}`);
                              setAllDocuments(prev => prev.filter(d => d.id !== doc.id));
                              toast({
                                title: "Sucesso",
                                description: "Documento excluído com sucesso.",
                              });
                            } catch (error: any) {
                              toast({
                                title: "Erro",
                                description: error?.response?.data?.detail || "Erro ao excluir documento.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
      <TaskDetailsModal isOpen={isTaskDetailsOpen} onClose={() => setIsTaskDetailsOpen(false)} task={selectedTask} />
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          // Recarregar os compromissos após criar um novo
          if (process) {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
        }}
        processoId={process?.id || null}
      />
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
      <ClientDetailsModal
        isOpen={isClientDetailsOpen}
        onClose={() => setIsClientDetailsOpen(false)}
        client={selectedClient}
      />
    </Dialog>
  );
};