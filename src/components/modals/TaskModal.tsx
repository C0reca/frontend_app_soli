import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DynamicSelect } from '@/components/ui/DynamicSelect';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTasks, Task } from '@/hooks/useTasks';
import { useProcesses } from '@/hooks/useProcesses';
import { useClients } from '@/hooks/useClients';
import { useEmployeeList } from '@/hooks/useEmployees';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ClientCombobox } from '@/components/ui/clientcombobox';
import { ProcessCombobox } from '@/components/ui/processcombobox';
import { Minimize2, FileIcon, X, ChevronRight, ChevronLeft, Repeat, Bell, Trash2 } from 'lucide-react';
import { useMinimize } from '@/contexts/MinimizeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

const taskSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  cliente_id: z.number().nullable().optional(),
  processo_id: z.number().nullable().optional(),
  responsavel_id: z.number().nullable().optional(),
  prioridade: z.string().nullable().optional(),
  concluida: z.boolean(),
  data_fim: z.string().nullable().optional(),
  autor_id: z.number().nullable().optional(),
  tipo: z.string().nullable().optional(),
  parent_id: z.number().nullable().optional(),
  onde_estao: z.string().optional(),
  custo: z.coerce.number().nullable().optional(),
  recorrencia_tipo: z.string().nullable().optional(),
  recorrencia_dia_semana: z.number().nullable().optional(),
  recorrencia_fim: z.string().nullable().optional(),
});

const LEMBRETE_OPTIONS = [
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
  { value: 1440, label: '1 dia antes' },
  { value: 2880, label: '2 dias antes' },
  { value: 10080, label: '1 semana antes' },
];

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  parentId?: number | null;
  processoId?: number | null;
  initialData?: Partial<TaskFormData> | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, task, parentId = null, processoId = null, initialData = null }) => {
  const { createTask, updateTask, addLembrete, removeLembrete } = useTasks();
  const { processes, isLoading: isProcessesLoading } = useProcesses();
  const { clients = [], isLoading: isClientsLoading } = useClients();
  const { data: employees = [] } = useEmployeeList();
  const { user } = useAuth();
  const { minimize } = useMinimize();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingLembretes, setPendingLembretes] = useState<number[]>([]);
  const [step, setStep] = useState(0);
  const isWizard = !task;
  const isSubtask = !task && !!parentId;
  const isFromProcess = !task && !!processoId;

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      titulo: initialData?.titulo ?? '',
      descricao: initialData?.descricao ?? '',
      cliente_id: initialData?.cliente_id ?? null,
      processo_id: initialData?.processo_id ?? (processoId ?? null),
      responsavel_id: initialData?.responsavel_id ?? (user?.id ?? null),
      prioridade: (initialData?.prioridade as any) ?? 'media',
      concluida: initialData?.concluida ?? false,
      data_fim: (initialData?.data_fim as any) ?? null,
      autor_id: (initialData as any)?.autor_id ?? (user?.id ?? null),
      tipo: (initialData as any)?.tipo ?? null,
      parent_id: (initialData as any)?.parent_id ?? parentId,
      onde_estao: (initialData as any)?.onde_estao ?? undefined,
      custo: (initialData as any)?.custo ?? null,
      recorrencia_tipo: (initialData as any)?.recorrencia_tipo ?? null,
      recorrencia_dia_semana: (initialData as any)?.recorrencia_dia_semana ?? null,
      recorrencia_fim: (initialData as any)?.recorrencia_fim ?? null,
    },
  });

  const selectedClienteId = form.watch('cliente_id');
  const processesOfEntity = React.useMemo(() => {
    if (selectedClienteId == null) return [];
    return (processes || []).filter((p) => p.cliente_id === selectedClienteId);
  }, [processes, selectedClienteId]);

  // Use a ref for processes to avoid infinite loops from unstable array references
  const processesRef = React.useRef(processes);
  processesRef.current = processes;

  useEffect(() => {
    if (task) {
      const procs = processesRef.current;
      const entityId = task.cliente_id ?? (task.processo_id && procs?.find((p) => p.id === task.processo_id)?.cliente_id) ?? null;
      form.reset({
        titulo: task.titulo,
        descricao: task.descricao,
        cliente_id: entityId,
        processo_id: task.processo_id ?? null,
        responsavel_id: task.responsavel_id,
        prioridade: task.prioridade,
        concluida: task.concluida,
        data_fim: task.data_fim ? task.data_fim.split('T')[0] : null, // Format for date input
        autor_id: task.autor_id ?? null,
        tipo: (task as any).tipo ?? null,
        parent_id: task.parent_id ?? null,
        onde_estao: (task as any).onde_estao ?? undefined,
        custo: (task as any).custo ?? null,
        recorrencia_tipo: task.recorrencia_tipo ?? null,
        recorrencia_dia_semana: task.recorrencia_dia_semana ?? null,
        recorrencia_fim: task.recorrencia_fim ? (task.recorrencia_fim as string).split('T')[0] : null,
      });
      // Load existing lembretes for edit mode
      setPendingLembretes(task.lembretes?.map(l => l.tempo_antes_minutos) ?? []);
    } else {
      const procs = processesRef.current;
      const initialClienteId = initialData?.cliente_id ?? (processoId && procs?.find((p) => p.id === processoId)?.cliente_id) ?? null;
      const currentUserId = user?.id ?? null;
      form.reset({
        titulo: initialData?.titulo ?? '',
        descricao: initialData?.descricao ?? '',
        cliente_id: initialClienteId,
        processo_id: initialData?.processo_id ?? (processoId ?? null),
        responsavel_id: initialData?.responsavel_id ?? currentUserId,
        prioridade: (initialData?.prioridade as any) ?? 'media',
        concluida: initialData?.concluida ?? false,
        data_fim: (initialData?.data_fim as any) ?? null,
        autor_id: (initialData as any)?.autor_id ?? currentUserId,
        tipo: (initialData as any)?.tipo ?? null,
        parent_id: (initialData as any)?.parent_id ?? parentId,
        onde_estao: (initialData as any)?.onde_estao ?? undefined,
        custo: (initialData as any)?.custo ?? null,
        recorrencia_tipo: (initialData as any)?.recorrencia_tipo ?? null,
        recorrencia_dia_semana: (initialData as any)?.recorrencia_dia_semana ?? null,
        recorrencia_fim: (initialData as any)?.recorrencia_fim ?? null,
      });
      setPendingLembretes([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- form/processesRef are stable refs, omit to avoid init issues
  }, [task, parentId, processoId, initialData, user?.id]);

  useEffect(() => {
    if (isOpen && !task) setStep(0);
  }, [isOpen, task]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      // No wizard, só criar/guardar quando estiver no último passo (evita criar ao premir Enter ou envio acidental)
      if (isWizard && step !== (isSubtask || isFromProcess ? 1 : 2)) return;

      if (!task && !isSubtask && !isFromProcess && (data.cliente_id == null || data.cliente_id === 0)) {
        form.setError('cliente_id', { type: 'manual', message: 'Selecione uma entidade para a tarefa.' });
        return;
      }
      // Normalizar undefined para null para campos opcionais
      // IMPORTANTE: sempre incluir onde_estao, mesmo que seja null
      const normalizedData: any = {
        titulo: data.titulo,
        descricao: data.descricao,
        prioridade: data.prioridade,
        concluida: data.concluida,
        tipo: data.tipo,
        onde_estao: data.onde_estao === "" || data.onde_estao === undefined || data.onde_estao === null ? null : data.onde_estao,
        cliente_id: data.cliente_id || null,
        processo_id: data.processo_id || null,
        responsavel_id: data.responsavel_id || null,
        autor_id: data.autor_id || null,
        parent_id: data.parent_id || null,
        data_fim: data.data_fim || null,
        custo: data.custo && data.custo > 0 ? data.custo : null,
        recorrencia_tipo: data.recorrencia_tipo || null,
        recorrencia_dia_semana: data.recorrencia_tipo === 'semanal' ? (data.recorrencia_dia_semana ?? null) : null,
        recorrencia_fim: data.recorrencia_fim || null,
      };

      if (task) {
        // Garantir que onde_estao está sempre presente no payload
        const updatePayload: any = {
          id: task.id,
          titulo: normalizedData.titulo,
          descricao: normalizedData.descricao,
          prioridade: normalizedData.prioridade,
          concluida: normalizedData.concluida,
          tipo: normalizedData.tipo,
          onde_estao: normalizedData.onde_estao,
          custo: normalizedData.custo,
          cliente_id: normalizedData.cliente_id,
          processo_id: normalizedData.processo_id,
          responsavel_id: normalizedData.responsavel_id,
          autor_id: normalizedData.autor_id,
          parent_id: normalizedData.parent_id,
          data_fim: normalizedData.data_fim,
          recorrencia_tipo: normalizedData.recorrencia_tipo,
          recorrencia_dia_semana: normalizedData.recorrencia_dia_semana,
          recorrencia_fim: normalizedData.recorrencia_fim,
        };
        await updateTask.mutateAsync(updatePayload as Task & { id: string });

        // Sync lembretes: remove old, add new
        const existingLembretes = task.lembretes ?? [];
        const existingMinutos = existingLembretes.map(l => l.tempo_antes_minutos);
        // Remove lembretes that are no longer in the list
        for (const existing of existingLembretes) {
          if (!pendingLembretes.includes(existing.tempo_antes_minutos)) {
            try { await removeLembrete.mutateAsync({ tarefaId: task.id, lembreteId: existing.id }); } catch {}
          }
        }
        // Add new lembretes
        for (const minutos of pendingLembretes) {
          if (!existingMinutos.includes(minutos)) {
            try { await addLembrete.mutateAsync({ tarefaId: task.id, tempo_antes_minutos: minutos }); } catch {}
          }
        }
      } else {
        const newTask = await createTask.mutateAsync(normalizedData as Omit<Task, 'id' | 'criado_em'>);
        // Fazer upload dos ficheiros pendentes após criar o compromisso
        if (newTask?.id) {
          if (pendingFiles.length > 0) {
            for (const file of pendingFiles) {
              try {
                const formData = new FormData();
                formData.append('file', file);
                await api.post(`/documentos/upload-tarefa/${newTask.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
              } catch (error) {
                console.error('Erro ao fazer upload do ficheiro:', error);
              }
            }
          }
          // Create lembretes for the new task
          for (const minutos of pendingLembretes) {
            try { await addLembrete.mutateAsync({ tarefaId: String(newTask.id), tempo_antes_minutos: minutos }); } catch {}
          }
        }
        setPendingFiles([]);
        setPendingLembretes([]);
      }
      onClose();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>{task ? 'Editar Compromisso' : 'Novo Compromisso'}</DialogTitle>
              <DialogDescription>
                {task ? 'Edite os dados do compromisso.' : 'Preencha os dados para criar um novo compromisso.'}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-12 top-4"
              onClick={() => {
                const data = form.getValues();
                minimize({ type: 'task', title: task ? `Editar: ${task.titulo}` : 'Novo Compromisso', payload: { data, parentId, processoId } });
                onClose();
              }}
              aria-label={'Minimizar'}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            onKeyDown={(e) => {
              if (isWizard && e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                e.preventDefault();
              }
            }}
            className="space-y-4"
          >
            {isWizard && (
              <div className="flex items-center gap-2 py-2">
                {Array.from({ length: (isSubtask || isFromProcess) ? 2 : 3 }, (_, i) => i).map((i) => (
                  <React.Fragment key={i}>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                        step === i ? 'bg-primary text-primary-foreground' : step > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step > i ? '✓' : i + 1}
                    </div>
                    {i < ((isSubtask || isFromProcess) ? 1 : 2) && <div className="h-px flex-1 bg-border max-w-[40px]" />}
                  </React.Fragment>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">Passo {step + 1} de {(isSubtask || isFromProcess) ? 2 : 3}</span>
              </div>
            )}

            {/* Passo 1: Entidade e Processo (só no wizard, não para subtarefas nem criação a partir do processo) ou sempre na edição */}
            {(!isWizard || (step === 0 && !isSubtask && !isFromProcess)) && (
              <div className="space-y-4">
                {/* Subtarefas em edição: mostrar entidade/processo como read-only (herdam do pai) */}
                {task && task.parent_id ? (
                  <div className="space-y-3 rounded-md border bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Herdado do compromisso principal (não editável)</p>
                    <div>
                      <Label className="text-sm font-medium">Entidade</Label>
                      <p className="text-sm mt-0.5">
                        {(() => {
                          const cid = form.getValues('cliente_id');
                          if (!cid) return 'Sem entidade';
                          const c = clients.find((cl: any) => cl.id === cid);
                          return c ? (c as any).nome || (c as any).nome_empresa || `ID ${cid}` : `ID ${cid}`;
                        })()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Processo</Label>
                      <p className="text-sm mt-0.5">
                        {(() => {
                          const pid = form.getValues('processo_id');
                          if (!pid) return 'Sem processo';
                          const p = processes.find((pr: any) => pr.id === pid);
                          return p ? (p.referencia ? `${p.referencia} - ${p.titulo}` : p.titulo) : `ID ${pid}`;
                        })()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="cliente_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entidade *</FormLabel>
                          <FormControl>
                            <ClientCombobox
                              clients={clients}
                              value={field.value ?? undefined}
                              onChange={(value) => {
                                field.onChange(value);
                                const currentProcessId = form.getValues('processo_id');
                                if (currentProcessId != null && processes?.find((p) => p.id === currentProcessId)?.cliente_id !== value) {
                                  form.setValue('processo_id', null);
                                }
                              }}
                              isLoading={isClientsLoading}
                              placeholderEmpty="Selecione uma entidade"
                              insideDialog
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="processo_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Processo</FormLabel>
                          <FormControl>
                            <ProcessCombobox
                              processes={processesOfEntity}
                              value={selectedClienteId != null ? (field.value ?? null) : null}
                              onChange={(value) => field.onChange(value)}
                              isLoading={isProcessesLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            )}

            {/* Passo 2: Título e Descrição (no wizard 3 passos = passo 1; no wizard 2 passos = passo 0) */}
            {(!isWizard || (step === 1 && !isSubtask && !isFromProcess) || ((isSubtask || isFromProcess) && step === 0)) && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o título do compromisso" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Digite a descrição do compromisso" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Passo 3: Detalhes (responsável, prioridade, tipo, data, etc.) */}
            {(!isWizard || step === 2 || ((isSubtask || isFromProcess) && step === 1)) && (
              <div className="space-y-4">
                {/* Linha 1: Responsável | Autor */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="responsavel_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? Number(value) : null)} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um responsável" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="autor_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Autor</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? Number(value) : null)} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o autor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Linha 2: Prioridade | Tipo */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="prioridade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade *</FormLabel>
                        <FormControl>
                          <DynamicSelect
                            categoria="prioridade_tarefa"
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                            placeholder="Prioridade"
                            fallbackOptions={[
                              { value: "baixa", label: "Baixa" },
                              { value: "media", label: "Média" },
                              { value: "alta", label: "Alta" },
                            ]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <FormControl>
                          <DynamicSelect
                            categoria="tipo_tarefa"
                            value={field.value || undefined}
                            onValueChange={field.onChange}
                            placeholder="Tipo"
                            fallbackOptions={[
                              { value: "reuniao", label: "Reunião" },
                              { value: "telefonema", label: "Telefonema" },
                              { value: "tarefa", label: "Compromisso" },
                              { value: "correspondencia_ctt", label: "Correspondência CTT" },
                            ]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Linha 3: Status | Data de Vencimento */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="concluida"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="false">Pendente</SelectItem>
                            <SelectItem value="true">Concluída</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="data_fim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Vencimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Linha 4: Localização | Custo */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="onde_estao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localização</FormLabel>
                        <FormControl>
                          <DynamicSelect
                            categoria="onde_estao"
                            value={field.value || undefined}
                            onValueChange={(v) => {
                              field.onChange(v);
                            }}
                            placeholder="Localização"
                            fallbackOptions={[
                              { value: "Casa", label: "Casa" },
                              { value: "Cartorio", label: "Cartorio" },
                              { value: "Camara/GaiaUrb", label: "Camara/GaiaUrb" },
                              { value: "DPA Agendado", label: "DPA Agendado" },
                              { value: "Armário DPA", label: "Armário DPA" },
                              { value: "PEPEX", label: "PEPEX" },
                              { value: "Conservatoria Civil/Comercial", label: "Conservatoria Civil/Comercial" },
                              { value: "Reuniões", label: "Reuniões" },
                              { value: "Conservatoria Predial", label: "Conservatoria Predial" },
                              { value: "Serviço Finanças", label: "Serviço Finanças" },
                              { value: "Imposto Selo / Participações", label: "Imposto Selo / Participações" },
                              { value: "Serviço Finanças Pendentes", label: "Serviço Finanças Pendentes" },
                              { value: "Aguarda Doc Cliente/Informações", label: "Aguarda Doc Cliente/Informações" },
                              { value: "Aguarda Doc", label: "Aguarda Doc" },
                              { value: "Decorre Prazo", label: "Decorre Prazo" },
                              { value: "Pendentes", label: "Pendentes" },
                              { value: "Injunções", label: "Injunções" },
                              { value: "Execuções", label: "Execuções" },
                              { value: "Inventário Judicial", label: "Inventário Judicial" },
                            ]}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="custo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo (EUR)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Recorrência */}
                <div className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Repeat className="h-4 w-4" />
                    Recorrência
                  </div>
                  <FormField
                    control={form.control}
                    name="recorrencia_tipo"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={(value) => field.onChange(value === '_none' ? null : value)}
                          value={field.value || '_none'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sem recorrência" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="_none">Sem recorrência</SelectItem>
                            <SelectItem value="diaria">Diária</SelectItem>
                            <SelectItem value="semanal">Semanal</SelectItem>
                            <SelectItem value="quinzenal">Quinzenal</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  {form.watch('recorrencia_tipo') === 'semanal' && (
                    <FormField
                      control={form.control}
                      name="recorrencia_dia_semana"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia da semana</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(Number(value))}
                            value={field.value?.toString() ?? ''}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Dia da semana" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Segunda-feira</SelectItem>
                              <SelectItem value="1">Terça-feira</SelectItem>
                              <SelectItem value="2">Quarta-feira</SelectItem>
                              <SelectItem value="3">Quinta-feira</SelectItem>
                              <SelectItem value="4">Sexta-feira</SelectItem>
                              <SelectItem value="5">Sábado</SelectItem>
                              <SelectItem value="6">Domingo</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  )}
                  {form.watch('recorrencia_tipo') && form.watch('recorrencia_tipo') !== '_none' && (
                    <FormField
                      control={form.control}
                      name="recorrencia_fim"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data limite (opcional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value || ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Lembretes */}
                <div className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Bell className="h-4 w-4" />
                    Lembretes
                  </div>
                  {pendingLembretes.length > 0 && (
                    <ul className="space-y-1">
                      {pendingLembretes.map((minutos, idx) => {
                        const opt = LEMBRETE_OPTIONS.find(o => o.value === minutos);
                        return (
                          <li key={idx} className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1">
                            <span>{opt?.label ?? `${minutos} minutos antes`}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600"
                              onClick={() => setPendingLembretes(pendingLembretes.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <Select
                    onValueChange={(value) => {
                      const minutos = Number(value);
                      if (!pendingLembretes.includes(minutos)) {
                        setPendingLembretes([...pendingLembretes, minutos]);
                      }
                    }}
                    value=""
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Adicionar lembrete..." />
                    </SelectTrigger>
                    <SelectContent>
                      {LEMBRETE_OPTIONS.filter(o => !pendingLembretes.includes(o.value)).map(o => (
                        <SelectItem key={o.value} value={o.value.toString()}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!task && (
                  <div className="space-y-2">
                    <Label>Anexos</Label>
                    <Input 
                      type="file" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPendingFiles([...pendingFiles, file]);
                        }
                        e.target.value = '';
                      }}
                      className="text-sm"
                    />
                    {pendingFiles.length > 0 && (
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {pendingFiles.map((file, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <FileIcon className="h-4 w-4 text-gray-500" />
                            <span className="flex-1">{file.name}</span>
                            <Button 
                              size="xs" 
                              variant="ghost" 
                              className="text-red-600 h-6 px-2" 
                              onClick={() => setPendingFiles(pendingFiles.filter((_, i) => i !== index))}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {isWizard && step > 0 ? (
                <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              )}
              {isWizard && step < (isSubtask || isFromProcess ? 1 : 2) ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (isSubtask || isFromProcess) {
                      if (step === 0) {
                        form.trigger(['titulo', 'descricao']).then((ok) => {
                          if (ok) setStep(1);
                        });
                        return;
                      }
                    }
                    if (step === 0 && !isSubtask) {
                      const cid = form.getValues('cliente_id');
                      if (cid == null || cid === 0) {
                        form.setError('cliente_id', { type: 'manual', message: 'Selecione uma entidade para a tarefa.' });
                        return;
                      }
                      setStep(1);
                      return;
                    }
                    if (step === 1) {
                      form.trigger(['titulo', 'descricao']).then((ok) => {
                        if (ok) setStep(2);
                      });
                      return;
                    }
                    setStep(step + 1);
                  }}
                >
                  Seguinte
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type={isWizard ? 'button' : 'submit'}
                  disabled={createTask.isPending || updateTask.isPending}
                  onClick={isWizard ? () => form.handleSubmit(onSubmit)() : undefined}
                >
                  {createTask.isPending || updateTask.isPending ? 'Salvando...' : task ? 'Salvar' : 'Criar compromisso'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};