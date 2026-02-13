import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UserPlus } from 'lucide-react';
import { Task, useTasks } from '@/hooks/useTasks';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/hooks/use-toast';

interface ReassignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  subtasks: Task[];
  onSuccess?: () => void;
}

export const ReassignTaskModal: React.FC<ReassignTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  subtasks,
  onSuccess,
}) => {
  const { createTask, updateTask, updateTaskStatus } = useTasks();
  const { employees } = useEmployees();
  const { toast } = useToast();
  const [novoResponsavelId, setNovoResponsavelId] = useState<number | null>(null);
  const [subtarefasParaMover, setSubtarefasParaMover] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingSubtasks = subtasks.filter((st) => !st.concluida);
  const currentResponsavelId = task?.responsavel_id ? Number(task.responsavel_id) : null;
  const employeesExcluindoAtual = employees.filter((e) => e.id !== currentResponsavelId);

  const resetForm = () => {
    setNovoResponsavelId(null);
    setSubtarefasParaMover(new Set());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleSubtarefa = (id: string) => {
    setSubtarefasParaMover((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!task || !novoResponsavelId) {
      toast({ title: 'Erro', description: 'Selecione a nova pessoa responsável.', variant: 'destructive' });
      return;
    }
    if (novoResponsavelId === currentResponsavelId) {
      toast({ title: 'Erro', description: 'O novo responsável deve ser diferente do atual.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const taskId = typeof task.id === 'string' ? task.id : String(task.id);
      const parentId = task.parent_id ? Number(task.parent_id) : null;

      const payload: Omit<Task, 'id' | 'criado_em'> = {
        titulo: task.titulo,
        descricao: task.descricao ?? '',
        cliente_id: task.cliente_id ?? null,
        processo_id: task.processo_id,
        responsavel_id: novoResponsavelId,
        prioridade: task.prioridade,
        concluida: false,
        data_fim: task.data_fim,
        autor_id: task.autor_id ?? null,
        parent_id: parentId,
        tipo: (task as any).tipo ?? null,
        onde_estao: (task as any).onde_estao ?? null,
      };

      const novaTarefa = await createTask.mutateAsync(payload);
      const novaTarefaId = typeof novaTarefa.id === 'string' ? novaTarefa.id : String(novaTarefa.id);

      for (const subtaskId of subtarefasParaMover) {
        await updateTask.mutateAsync({
          id: subtaskId,
          parent_id: Number(novaTarefaId),
        });
      }

      const subtarefasQueFicam = pendingSubtasks.filter((st) => !subtarefasParaMover.has(String(st.id)));
      const nenhumaPendenteRestou = subtarefasQueFicam.length === 0;

      if (nenhumaPendenteRestou) {
        await updateTaskStatus.mutateAsync({
          id: taskId,
          concluida: true,
        });
      }

      toast({
        title: 'Tarefa reencaminhada',
        description: `Nova tarefa criada para o novo responsável.${nenhumaPendenteRestou ? ' Tarefa original marcada como concluída.' : ''}`,
      });
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || 'Erro ao reencaminhar tarefa.';
      toast({ title: 'Erro', description: String(msg), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Reencaminhar tarefa
          </DialogTitle>
          <DialogDescription>
            Será criada uma nova tarefa igual para a pessoa selecionada. A tarefa atual será marcada como concluída se não tiver sub-compromissos pendentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Novo responsável *</Label>
            <Select value={novoResponsavelId?.toString() ?? ''} onValueChange={(v) => setNovoResponsavelId(v ? Number(v) : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a pessoa" />
              </SelectTrigger>
              <SelectContent>
                {employeesExcluindoAtual.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {pendingSubtasks.length > 0 && (
            <div className="space-y-2">
              <Label>Sub-compromissos pendentes</Label>
              <p className="text-sm text-muted-foreground">
                Escolha quais sub-compromissos passam para a nova tarefa. Os restantes ficam na tarefa atual, que permanece pendente.
              </p>
              <div className="rounded-lg border p-3 space-y-2 max-h-40 overflow-y-auto">
                {pendingSubtasks.map((st) => (
                  <label key={st.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={subtarefasParaMover.has(String(st.id))}
                      onCheckedChange={() => toggleSubtarefa(String(st.id))}
                    />
                    <span className="text-sm">{st.titulo}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !novoResponsavelId}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reencaminhar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
