import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLogsProcesso, LogProcessoCreate } from '@/hooks/useLogsProcesso';
import { useEmployees } from '@/hooks/useEmployees';
import { useMinimize } from '@/contexts/MinimizeContext';
import { Minimize2 } from 'lucide-react';

const logSchema = z.object({
  tipo: z.enum(['telefone', 'reuniao', 'email', 'documento', 'observacao'], {
    required_error: "Tipo é obrigatório",
  }),
  titulo: z.string().min(1, "Título é obrigatório"),
  descricao: z.string().optional(),
  funcionario_id: z.number().optional(),
});

type LogFormData = z.infer<typeof logSchema>;

interface LogProcessoModalProps {
  isOpen: boolean;
  onClose: () => void;
  processoId: number;
  log?: any | null;
}

export const LogProcessoModal: React.FC<LogProcessoModalProps> = ({
  isOpen,
  onClose,
  processoId,
  log = null,
}) => {
  const { createLog, updateLog, getTiposLog } = useLogsProcesso();
  const { employees } = useEmployees();
  const { minimize } = useMinimize();
  const isEditing = !!log;

  const form = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
    defaultValues: {
      tipo: 'observacao',
      titulo: '',
      descricao: '',
      funcionario_id: undefined,
    },
  });

  useEffect(() => {
    if (log) {
      form.reset({
        tipo: log.tipo,
        titulo: log.titulo,
        descricao: log.descricao || '',
        funcionario_id: log.funcionario_id,
      });
    } else {
      form.reset({
        tipo: 'observacao',
        titulo: '',
        descricao: '',
        funcionario_id: undefined,
      });
    }
  }, [log, form]);

  const onSubmit = async (data: LogFormData) => {
    try {
      const logData: LogProcessoCreate = {
        processo_id: processoId,
        funcionario_id: data.funcionario_id || null,
        tipo: data.tipo,
        titulo: data.titulo,
        descricao: data.descricao || null,
      };

      if (isEditing) {
        await updateLog.mutateAsync({ id: log.id, data: logData });
      } else {
        await createLog.mutateAsync(logData);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar log:', error);
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      telefone: 'Telefonema',
      reuniao: 'Reunião',
      email: 'Email',
      documento: 'Documento',
      observacao: 'Observação',
    };
    return labels[tipo] || tipo;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {isEditing ? 'Editar Log' : 'Adicionar Log'}
              </DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? 'Edite as informações do log do processo.'
                  : 'Adicione um novo registro de atividade ao processo.'
                }
              </DialogDescription>
            </div>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="absolute right-12 top-4"
              onClick={() => {
                const data = form.getValues();
                minimize({ 
                  type: 'log-processo', 
                  title: isEditing ? `Editar: ${log.titulo}` : 'Novo Log', 
                  payload: { data, log, processoId } 
                });
                onClose();
              }}
              aria-label={'Minimizar'}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Atividade</label>
            <Select
              value={form.watch('tipo')}
              onValueChange={(value) => form.setValue('tipo', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="telefone">Telefonema</SelectItem>
                <SelectItem value="reuniao">Reunião</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="documento">Documento</SelectItem>
                <SelectItem value="observacao">Observação</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.tipo && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.tipo.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Título</label>
            <Input
              {...form.register('titulo')}
              placeholder="Digite o título da atividade"
            />
            {form.formState.errors.titulo && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.titulo.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Descrição</label>
            <Textarea
              {...form.register('descricao')}
              placeholder="Descreva a atividade realizada"
              rows={3}
            />
            {form.formState.errors.descricao && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.descricao.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Responsável</label>
            <Select
              value={form.watch('funcionario_id') != null ? String(form.watch('funcionario_id')) : 'none'}
              onValueChange={(value) => form.setValue('funcionario_id', value === 'none' ? undefined : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem responsável</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createLog.isPending || updateLog.isPending}
            >
              {createLog.isPending || updateLog.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
