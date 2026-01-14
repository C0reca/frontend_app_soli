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
import { useEmployees } from '@/hooks/useEmployees';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ProcessCombobox } from '@/components/ui/processcombobox';
import { Minimize2, FileIcon, X } from 'lucide-react';
import { useMinimize } from '@/contexts/MinimizeContext';
import api from '@/services/api';

const taskSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  processo_id: z.number().nullable().optional(),
  responsavel_id: z.number().nullable().optional(),
  prioridade: z.enum(['baixa', 'media', 'alta']).nullable().optional(),
  concluida: z.boolean(),
  data_fim: z.string().nullable().optional(),
  autor_id: z.number().nullable().optional(),
  tipo: z.enum(['reuniao','telefonema','tarefa']).nullable().optional(),
  parent_id: z.number().nullable().optional(),
  onde_estao: z.string().optional(),
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
  const { employees } = useEmployees();
  const { minimize } = useMinimize();
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      titulo: initialData?.titulo ?? '',
      descricao: initialData?.descricao ?? '',
      processo_id: initialData?.processo_id ?? (processoId ?? null),
      responsavel_id: initialData?.responsavel_id ?? null,
      prioridade: (initialData?.prioridade as any) ?? 'media',
      concluida: initialData?.concluida ?? false,
      data_fim: (initialData?.data_fim as any) ?? null,
      autor_id: (initialData as any)?.autor_id ?? null,
      tipo: (initialData as any)?.tipo ?? null,
      parent_id: (initialData as any)?.parent_id ?? parentId,
      onde_estao: (initialData as any)?.onde_estao ?? undefined,
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        titulo: task.titulo,
        descricao: task.descricao,
        processo_id: task.processo_id ?? null,
        responsavel_id: task.responsavel_id,
        prioridade: task.prioridade,
        concluida: task.concluida,
        data_fim: task.data_fim ? task.data_fim.split('T')[0] : null, // Format for date input
        autor_id: task.autor_id ?? null,
        tipo: (task as any).tipo ?? null,
        parent_id: task.parent_id ?? null,
        onde_estao: (task as any).onde_estao ?? undefined,
      });
    } else {
      form.reset({
        titulo: initialData?.titulo ?? '',
        descricao: initialData?.descricao ?? '',
        processo_id: initialData?.processo_id ?? (processoId ?? null),
        responsavel_id: initialData?.responsavel_id ?? null,
        prioridade: (initialData?.prioridade as any) ?? 'media',
        concluida: initialData?.concluida ?? false,
        data_fim: (initialData?.data_fim as any) ?? null,
        autor_id: (initialData as any)?.autor_id ?? null,
        tipo: (initialData as any)?.tipo ?? null,
        parent_id: (initialData as any)?.parent_id ?? parentId,
        onde_estao: (initialData as any)?.onde_estao ?? undefined,
      });
    }
  }, [task, form, parentId, processoId, initialData]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      // Normalizar undefined para null para campos opcionais
      // IMPORTANTE: sempre incluir onde_estao, mesmo que seja null
      const normalizedData: any = {
        titulo: data.titulo,
        descricao: data.descricao,
        prioridade: data.prioridade,
        concluida: data.concluida,
        tipo: data.tipo,
        onde_estao: data.onde_estao === "" || data.onde_estao === undefined ? null : data.onde_estao,
        processo_id: data.processo_id || null,
        responsavel_id: data.responsavel_id || null,
        autor_id: data.autor_id || null,
        parent_id: data.parent_id || null,
        data_fim: data.data_fim || null,
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
          processo_id: normalizedData.processo_id,
          responsavel_id: normalizedData.responsavel_id,
          autor_id: normalizedData.autor_id,
          parent_id: normalizedData.parent_id,
          data_fim: normalizedData.data_fim,
        };
        console.log('Update payload:', updatePayload); // Debug temporário
        await updateTask.mutateAsync(updatePayload as Task & { id: string });
      } else {
        const newTask = await createTask.mutateAsync(normalizedData as Omit<Task, 'id' | 'criado_em'>);
        // Fazer upload dos ficheiros pendentes após criar a tarefa
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
              <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
              <DialogDescription>
                {task ? 'Edite os dados da tarefa.' : 'Preencha os dados para criar uma nova tarefa.'}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-12 top-4"
              onClick={() => {
                const data = form.getValues();
                minimize({ type: 'task', title: task ? `Editar: ${task.titulo}` : 'Nova Tarefa', payload: { data, parentId, processoId } });
                onClose();
              }}
              aria-label={'Minimizar'}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título da tarefa" {...field} />
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
                    <Textarea placeholder="Digite a descrição da tarefa" {...field} />
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
                      processes={processes || []}
                      value={field.value ?? null}
                      onChange={(value) => field.onChange(value)}
                      isLoading={isProcessesLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          <SelectValue placeholder="Selecione a prioridade" />
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
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="reuniao">Reunião</SelectItem>
                        <SelectItem value="telefonema">Telefonema</SelectItem>
                        <SelectItem value="tarefa">Tarefa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="concluida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
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
            </div>

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

            <FormField
              control={form.control}
              name="onde_estao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localização</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      const value = v === "--------" ? null : v;
                      field.onChange(value);
                    }}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a localização" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="--------">--------</SelectItem>
                      <SelectItem value="Casa">Casa</SelectItem>
                      <SelectItem value="Cartorio">Cartorio</SelectItem>
                      <SelectItem value="Camara/GaiaUrb">Camara/GaiaUrb</SelectItem>
                      <SelectItem value="DPA Agendado">DPA Agendado</SelectItem>
                      <SelectItem value="Conservatoria Civil/Comercial">Conservatoria Civil/Comercial</SelectItem>
                      <SelectItem value="Reuniões">Reuniões</SelectItem>
                      <SelectItem value="Conservatoria Predial">Conservatoria Predial</SelectItem>
                      <SelectItem value="Serviço Finanças">Serviço Finanças</SelectItem>
                      <SelectItem value="Imposto Selo / Participações">Imposto Selo / Participações</SelectItem>
                      <SelectItem value="Serviço Finanças Pendentes">Serviço Finanças Pendentes</SelectItem>
                      <SelectItem value="Aguarda Doc Cliente/Informações">Aguarda Doc Cliente/Informações</SelectItem>
                      <SelectItem value="Aguarda Doc">Aguarda Doc</SelectItem>
                      <SelectItem value="Tarefas">Tarefas</SelectItem>
                      <SelectItem value="Injunções">Injunções</SelectItem>
                      <SelectItem value="Execuções">Execuções</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createTask.isPending || updateTask.isPending}>
                {createTask.isPending || updateTask.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};