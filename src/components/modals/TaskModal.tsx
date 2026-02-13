import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTasks, Task } from '@/hooks/useTasks';
import { useProcesses } from '@/hooks/useProcesses';
import { useClients } from '@/hooks/useClients';
import { useEmployees } from '@/hooks/useEmployees';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ClientCombobox } from '@/components/ui/clientcombobox';
import { ProcessCombobox } from '@/components/ui/processcombobox';
import { Minimize2, FileIcon, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useMinimize } from '@/contexts/MinimizeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

const taskSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  cliente_id: z.number().nullable().optional(),
  processo_id: z.number().nullable().optional(),
  responsavel_id: z.number().nullable().optional(),
  prioridade: z.enum(['baixa', 'media', 'alta']).nullable().optional(),
  concluida: z.boolean(),
  data_fim: z.string().nullable().optional(),
  autor_id: z.number().nullable().optional(),
  tipo: z.enum(['reuniao','telefonema','tarefa']).nullable().optional(),
  parent_id: z.number().nullable().optional(),
  onde_estao: z.string().optional(),
  custo: z.coerce.number().nullable().optional(),
});

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
  const { createTask, updateTask } = useTasks();
  const { processes, isLoading: isProcessesLoading } = useProcesses();
  const { clients = [], isLoading: isClientsLoading } = useClients();
  const { employees } = useEmployees();
  const { user } = useAuth();
  const { minimize } = useMinimize();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
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
    },
  });

  const selectedClienteId = form.watch('cliente_id');
  const processesOfEntity = React.useMemo(() => {
    if (selectedClienteId == null) return [];
    return (processes || []).filter((p) => p.cliente_id === selectedClienteId);
  }, [processes, selectedClienteId]);

  useEffect(() => {
    if (task) {
      const entityId = task.cliente_id ?? (task.processo_id && processes?.find((p) => p.id === task.processo_id)?.cliente_id) ?? null;
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
      });
    } else {
      const initialClienteId = initialData?.cliente_id ?? (processoId && processes?.find((p) => p.id === processoId)?.cliente_id) ?? null;
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
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- form from useForm is stable, omit to avoid init issues
  }, [task, parentId, processoId, initialData, processes, user?.id]);

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
          onde_estao: normalizedData.onde_estao, // Sempre incluir, mesmo que seja null
          custo: normalizedData.custo,
          cliente_id: normalizedData.cliente_id,
          processo_id: normalizedData.processo_id,
          responsavel_id: normalizedData.responsavel_id,
          autor_id: normalizedData.autor_id,
          parent_id: normalizedData.parent_id,
          data_fim: normalizedData.data_fim,
        };
        console.log('Update payload onde_estao:', updatePayload.onde_estao); // Debug
        await updateTask.mutateAsync(updatePayload as Task & { id: string });
      } else {
        const newTask = await createTask.mutateAsync(normalizedData as Omit<Task, 'id' | 'criado_em'>);
        // Fazer upload dos ficheiros pendentes após criar o compromisso
        if (pendingFiles.length > 0 && newTask?.id) {
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
        setPendingFiles([]);
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
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Prioridade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="media">Média</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="reuniao">Reunião</SelectItem>
                            <SelectItem value="telefonema">Telefonema</SelectItem>
                            <SelectItem value="tarefa">Compromisso</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Select
                          onValueChange={(v) => {
                            const value = v === "--------" || v === "" ? null : v;
                            field.onChange(value);
                          }}
                          value={field.value || "--------"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Localização" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="--------">--------</SelectItem>
                            <SelectItem value="Casa">Casa</SelectItem>
                            <SelectItem value="Cartorio">Cartorio</SelectItem>
                            <SelectItem value="Camara/GaiaUrb">Camara/GaiaUrb</SelectItem>
                            <SelectItem value="DPA Agendado">DPA Agendado</SelectItem>
                            <SelectItem value="Armário DPA">Armário DPA</SelectItem>
                            <SelectItem value="PEPEX">PEPEX</SelectItem>
                            <SelectItem value="Conservatoria Civil/Comercial">Conservatoria Civil/Comercial</SelectItem>
                            <SelectItem value="Reuniões">Reuniões</SelectItem>
                            <SelectItem value="Conservatoria Predial">Conservatoria Predial</SelectItem>
                            <SelectItem value="Serviço Finanças">Serviço Finanças</SelectItem>
                            <SelectItem value="Imposto Selo / Participações">Imposto Selo / Participações</SelectItem>
                            <SelectItem value="Serviço Finanças Pendentes">Serviço Finanças Pendentes</SelectItem>
                            <SelectItem value="Aguarda Doc Cliente/Informações">Aguarda Doc Cliente/Informações</SelectItem>
                            <SelectItem value="Aguarda Doc">Aguarda Doc</SelectItem>
                            <SelectItem value="Decorre Prazo">Decorre Prazo</SelectItem>
                            <SelectItem value="Pendentes">Pendentes</SelectItem>
                            <SelectItem value="Injunções">Injunções</SelectItem>
                            <SelectItem value="Execuções">Execuções</SelectItem>
                            <SelectItem value="Inventário Judicial">Inventário Judicial</SelectItem>
                          </SelectContent>
                        </Select>
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