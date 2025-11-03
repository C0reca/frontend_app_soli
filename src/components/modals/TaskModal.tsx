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
import { Minimize2 } from 'lucide-react';
import { useMinimize } from '@/contexts/MinimizeContext';

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
  const { processes } = useProcesses();
  const { employees } = useEmployees();
  const { minimize } = useMinimize();
  
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
      });
    }
  }, [task, form, parentId, processoId, initialData]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      if (task) {
        await updateTask.mutateAsync({
          id: task.id,
          ...data,
        } as Task & { id: string });
      } else {
        await createTask.mutateAsync(data as Omit<Task, 'id' | 'criado_em'>);
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
                  <Select onValueChange={(value) => field.onChange(value === 'none' ? null : Number(value))} value={field.value == null ? 'none' : field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um processo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sem processo</SelectItem>
                      {processes.map((process) => (
                        <SelectItem key={process.id} value={process.id.toString()}>
                          {process.titulo}
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