import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProcesses, Process } from '@/hooks/useProcesses';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const processSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  client: z.string().min(1, 'Cliente é obrigatório'),
  employee: z.string().min(1, 'Funcionário é obrigatório'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  description: z.string().optional(),
});

type ProcessFormData = z.infer<typeof processSchema>;

interface ProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  process?: Process | null;
}

export const ProcessModal: React.FC<ProcessModalProps> = ({ isOpen, onClose, process }) => {
  const { createProcess, updateProcess } = useProcesses();
  
  const form = useForm<ProcessFormData>({
    resolver: zodResolver(processSchema),
    defaultValues: {
      name: '',
      client: '',
      employee: '',
      status: 'pending',
      priority: 'medium',
      dueDate: '',
      description: '',
    },
  });

  useEffect(() => {
    if (process) {
      form.reset({
        name: process.name,
        client: process.client,
        employee: process.employee,
        status: process.status,
        priority: process.priority,
        dueDate: process.dueDate.split('T')[0],
        description: process.description || '',
      });
    } else {
      form.reset({
        name: '',
        client: '',
        employee: '',
        status: 'pending',
        priority: 'medium',
        dueDate: '',
        description: '',
      });
    }
  }, [process, form]);

  const onSubmit = async (data: ProcessFormData) => {
    try {
      if (process) {
        await updateProcess.mutateAsync({
          id: process.id,
          ...data,
        } as Process & { id: string });
      } else {
        await createProcess.mutateAsync(data as Omit<Process, 'id' | 'createdAt'>);
      }
      onClose();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{process ? 'Editar Processo' : 'Novo Processo'}</DialogTitle>
          <DialogDescription>
            {process ? 'Edite os dados do processo.' : 'Preencha os dados para criar um novo processo.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Processo</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do processo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Digite a descrição do processo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcionário Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do funcionário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Vencimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createProcess.isPending || updateProcess.isPending}>
                {createProcess.isPending || updateProcess.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};