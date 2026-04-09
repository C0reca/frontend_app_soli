import React, { useMemo, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Bot,
  CheckSquare,
  Clock,
  Download,
  Eye,
  FileIcon,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Image,
  ListChecks,
  Mail,
  MessageSquare,
  PanelRightClose,
  Plus,
  RefreshCw,
  Upload,
  Wallet,
  X,
  History,
} from 'lucide-react';
import { Process } from '@/hooks/useProcesses';
import { useTasks, Task } from '@/hooks/useTasks';
import { useLogsProcesso } from '@/hooks/useLogsProcesso';
import { AssistenteIA } from '@/components/AssistenteIA';
import { ProcessFinanceiroTab } from '@/components/ProcessFinanceiroTab';
import { ProcessChecklistTab } from '@/components/ProcessChecklistTab';
import { ProcessCorreioTab } from '@/components/ProcessCorreioTab';
import { FicheirosBrowser } from '@/components/FicheirosBrowser';
import { useAuth } from '@/contexts/AuthContext';
import { TaskDetailsModal } from '@/components/modals/TaskDetailsModal';
import { TaskModal } from '@/components/modals/TaskModal';

const estadoBadge: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> = {
  pendente: { variant: 'secondary', label: 'Pendente' },
  em_curso: { variant: 'default', label: 'Em Curso' },
  concluido: { variant: 'outline', label: 'Concluído' },
};

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return <FileText className="h-4 w-4 text-red-500" />;
  if (['docx', 'doc'].includes(ext)) return <FileText className="h-4 w-4 text-blue-500" />;
  if (['xlsx', 'xls'].includes(ext)) return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  if (['jpg', 'jpeg', 'png'].includes(ext)) return <Image className="h-4 w-4 text-purple-500" />;
  return <FileIcon className="h-4 w-4 text-muted-foreground" />;
}

function fileSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  processoId: number | null;
}

export function ProcessoWorkspaceModal({ isOpen, onClose, processoId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showIA, setShowIA] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Dados
  const { data: processo } = useQuery<Process>({
    queryKey: ['processo-workspace', processoId],
    queryFn: async () => (await api.get(`/processos/${processoId}`)).data,
    enabled: !!processoId && isOpen,
  });

  const { tasks: allTasks } = useTasks();
  const processTasks = useMemo(
    () => (allTasks || []).filter((t: Task) => t.processo_id === processoId),
    [allTasks, processoId],
  );
  const pendingTasks = processTasks.filter(t => !t.concluida);
  const completedTasks = processTasks.filter(t => t.concluida);

  // Documentos do sistema
  const { data: docs = [] } = useQuery<any[]>({
    queryKey: ['workspace-docs', processoId],
    queryFn: async () => {
      const res = await api.get(`/documentos/processo-completo/${processoId}`);
      const d = res.data;
      return d.documentos || d.items || (Array.isArray(d) ? d : []);
    },
    enabled: !!processoId && isOpen,
  });

  // Timeline
  const { logs = [] } = useLogsProcesso(processoId!);

  // Upload
  const handleUpload = async (files: FileList) => {
    if (!processoId) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const form = new FormData();
        form.append('ficheiro', file);
        await api.post(`/documentos/upload/${processoId}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast({ title: `${file.name} enviado` });
      } catch {
        toast({ title: `Erro ao enviar ${file.name}`, variant: 'destructive' });
      }
    }
    setUploading(false);
    qc.invalidateQueries({ queryKey: ['workspace-docs', processoId] });
  };

  // Download
  const handleDownload = async (docId: number, filename: string) => {
    try {
      const res = await api.get(`/documentos/download/${docId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Erro ao descarregar', variant: 'destructive' });
    }
  };

  if (!processo) return null;

  const badge = estadoBadge[processo.estado] || estadoBadge.pendente;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[96vw] w-[96vw] h-[92vh] max-h-[92vh] p-0 flex flex-col overflow-hidden gap-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold truncate">{processo.titulo}</h2>
                <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                {processo.estado_workflow && <Badge variant="outline" className="text-[10px]">{processo.estado_workflow}</Badge>}
                <span className="text-[10px] text-muted-foreground">#{processo.id}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                {processo.cliente && <span>{(processo.cliente as any).nome || (processo.cliente as any).nome_empresa}</span>}
                {processo.funcionario && <span>Resp: {processo.funcionario.nome}</span>}
                {processo.tipo_processo && <span>{(processo.tipo_processo as any).nome}</span>}
              </div>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground shrink-0">
              <span className="flex items-center gap-1"><ListChecks className="h-3 w-3 text-amber-500" /><strong>{pendingTasks.length}</strong> pendentes</span>
              <span className="flex items-center gap-1"><CheckSquare className="h-3 w-3 text-green-500" /><strong>{completedTasks.length}</strong> feitas</span>
              <span className="flex items-center gap-1"><FileText className="h-3 w-3 text-blue-500" /><strong>{docs.length}</strong> docs</span>
              {processo.valor && <span className="flex items-center gap-1"><Wallet className="h-3 w-3 text-green-600" />{Number(processo.valor).toFixed(2)}€</span>}
            </div>
            <Separator orientation="vertical" className="h-6" />
            <Button variant={showIA ? 'default' : 'outline'} size="sm" className="h-7 gap-1 text-xs shrink-0"
              onClick={() => setShowIA(!showIA)}>
              {showIA ? <PanelRightClose className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              IA
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <Tabs defaultValue="tarefas" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="mx-4 mt-3 mb-0 shrink-0 w-fit">
                  <TabsTrigger value="tarefas" className="text-xs gap-1"><ListChecks className="h-3 w-3" />Tarefas</TabsTrigger>
                  <TabsTrigger value="documentos" className="text-xs gap-1"><FileText className="h-3 w-3" />Documentos</TabsTrigger>
                  <TabsTrigger value="ficheiros" className="text-xs gap-1"><FolderOpen className="h-3 w-3" />Azure Files</TabsTrigger>
                  <TabsTrigger value="financeiro" className="text-xs gap-1"><Wallet className="h-3 w-3" />Financeiro</TabsTrigger>
                  <TabsTrigger value="checklist" className="text-xs gap-1"><CheckSquare className="h-3 w-3" />Checklist</TabsTrigger>
                  <TabsTrigger value="timeline" className="text-xs gap-1"><History className="h-3 w-3" />Timeline</TabsTrigger>
                  <TabsTrigger value="correio" className="text-xs gap-1"><Mail className="h-3 w-3" />Correio</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto px-4 py-3">
                  {/* TAREFAS */}
                  <TabsContent value="tarefas" className="mt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Tarefas ({processTasks.length})</h3>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowNewTask(true)}>
                        <Plus className="h-3 w-3 mr-1" />Nova Tarefa
                      </Button>
                    </div>
                    {pendingTasks.map(t => (
                      <div key={t.id}
                        className="flex items-center gap-3 p-2.5 rounded-md border hover:bg-muted/50 cursor-pointer"
                        onClick={() => { setSelectedTask(t); setShowTaskModal(true); }}>
                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{t.titulo}</p>
                          <p className="text-xs text-muted-foreground">{t.data_fim ? `Prazo: ${fmtDate(t.data_fim)}` : 'Sem prazo'}</p>
                        </div>
                        {t.prioridade && (
                          <Badge variant={t.prioridade === 'alta' ? 'destructive' : t.prioridade === 'media' ? 'default' : 'secondary'} className="text-[10px]">
                            {t.prioridade}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {completedTasks.length > 0 && (
                      <>
                        <p className="text-xs text-muted-foreground font-medium pt-2">Concluídas ({completedTasks.length})</p>
                        {completedTasks.slice(0, 5).map(t => (
                          <div key={t.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer opacity-50"
                            onClick={() => { setSelectedTask(t); setShowTaskModal(true); }}>
                            <CheckSquare className="h-4 w-4 text-green-500 shrink-0" />
                            <p className="text-sm truncate line-through">{t.titulo}</p>
                          </div>
                        ))}
                      </>
                    )}
                    {processTasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Sem tarefas. Peça ao assistente IA para sugerir.</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* DOCUMENTOS DO SISTEMA */}
                  <TabsContent value="documentos" className="mt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Documentos ({docs.length})</h3>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => qc.invalidateQueries({ queryKey: ['workspace-docs', processoId] })}>
                          <RefreshCw className="h-3 w-3 mr-1" />Atualizar
                        </Button>
                        <input ref={fileInputRef} type="file" multiple className="hidden"
                          onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); e.target.value = ''; }} />
                        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={uploading}
                          onClick={() => fileInputRef.current?.click()}>
                          <Upload className="h-3 w-3 mr-1" />{uploading ? 'A enviar...' : 'Upload'}
                        </Button>
                      </div>
                    </div>
                    {docs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Sem documentos. Faça upload ou peça à IA para gerar.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {docs.map((doc: any) => (
                          <div key={doc.id} className="flex items-center gap-3 p-2 rounded-md border hover:bg-muted/50">
                            {fileIcon(doc.nome_original || doc.nome || '')}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate font-medium">{doc.nome_original || doc.nome}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {fileSize(doc.tamanho_bytes || 0)} &middot; {fmtDateTime(doc.criado_em)}
                                {doc.origem && <span> &middot; {doc.origem}</span>}
                              </p>
                            </div>
                            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0"
                              onClick={() => handleDownload(doc.id, doc.nome_original || doc.nome || 'ficheiro')}>
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* AZURE FILES */}
                  <TabsContent value="ficheiros" className="mt-0">
                    <FicheirosBrowser
                      tipo="processos"
                      entityId={processoId!}
                      azureFolderPath={(processo as any).azure_folder_path}
                      canEdit={true}
                      canConfigurePasta={isAdminOrManager}
                    />
                  </TabsContent>

                  {/* FINANCEIRO */}
                  <TabsContent value="financeiro" className="mt-0">
                    <ProcessFinanceiroTab processoId={processoId!} />
                  </TabsContent>

                  {/* CHECKLIST */}
                  <TabsContent value="checklist" className="mt-0">
                    <ProcessChecklistTab processoId={processoId!} />
                  </TabsContent>

                  {/* TIMELINE */}
                  <TabsContent value="timeline" className="mt-0 space-y-2">
                    <h3 className="text-sm font-medium">Histórico ({logs.length})</h3>
                    {logs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Sem atividade registada.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {logs.slice(0, 30).map((log: any) => (
                          <div key={log.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                              <History className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{log.titulo}</p>
                              {log.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{log.descricao}</p>}
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {fmtDateTime(log.data_hora)}
                                {log.funcionario_nome && <span> &middot; {log.funcionario_nome}</span>}
                                {log.is_automatico && <span> &middot; Automático</span>}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-[10px] shrink-0">{log.tipo}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* CORREIO */}
                  <TabsContent value="correio" className="mt-0">
                    <ProcessCorreioTab processoId={processoId!} />
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Painel IA */}
            {showIA && (
              <div className="w-[400px] shrink-0 border-l flex flex-col bg-background">
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Bot className="h-4 w-4 text-primary" />
                    Assistente IA
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowIA(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <AssistenteIA processoId={processoId!} clienteId={processo.cliente_id} />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedTask && (
        <TaskDetailsModal task={selectedTask} isOpen={showTaskModal}
          onClose={() => { setShowTaskModal(false); setSelectedTask(null); }} />
      )}
      {showNewTask && (
        <TaskModal isOpen={showNewTask} onClose={() => setShowNewTask(false)} processoId={processoId} />
      )}
    </>
  );
}
