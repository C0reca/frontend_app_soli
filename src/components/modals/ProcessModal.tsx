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
import { useClients } from '@/hooks/useClients';
import { useEmployees } from '@/hooks/useEmployees';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const processSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  tipo: z.string().optional(),
  cliente_id: z.number().min(1, 'Cliente é obrigatório'),
  funcionario_id: z.number().optional(),
  estado: z.enum(['pendente', 'em_curso', 'concluido']).default('pendente'),
});

type ProcessFormData = z.infer<typeof processSchema>;

interface ProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  process?: Process | null;
}

export const ProcessModal: React.FC<ProcessModalProps> = ({ isOpen, onClose, process }) => {
  const { createProcess, updateProcess } = useProcesses();
  const { clients } = useClients();
  const { employees } = useEmployees();
  
  const form = useForm<ProcessFormData>({
    resolver: zodResolver(processSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      tipo: '',
      cliente_id: 1,
      funcionario_id: undefined,
      estado: 'pendente',
    },
  });

  useEffect(() => {
    if (process) {
      form.reset({
        titulo: process.titulo,
        descricao: process.descricao || '',
        tipo: process.tipo || '',
        cliente_id: process.cliente_id,
        funcionario_id: process.funcionario_id || undefined,
        estado: process.estado,
      });
    } else {
      form.reset({
        titulo: '',
        descricao: '',
        tipo: '',
        cliente_id: 1,
        funcionario_id: undefined,
        estado: 'pendente',
      });
    }
  }, [process, form]);

  const onSubmit = async (data: ProcessFormData) => {
    try {
      if (process) {
        await updateProcess.mutateAsync({
          id: process.id,
          ...data,
        });
      } else {
        await createProcess.mutateAsync(data as { titulo: string; descricao?: string; tipo?: string; cliente_id: number; funcionario_id?: number; estado: 'pendente' | 'em_curso' | 'concluido' });
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
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Processo</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o título do processo" {...field} />
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
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Digite a descrição do processo" {...field} />
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
                    <Input placeholder="Digite o tipo do processo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="cliente_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Cliente</FormLabel>
                            <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString()}
                            >
                                <FormControl>
                                    <SelectTrigger className="text-left">
                                        <SelectValue placeholder="Selecione um cliente" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id.toString()}>
                                            {client.nome}
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
                name="funcionario_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um funcionário" />
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

            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_curso">Em Curso</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
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