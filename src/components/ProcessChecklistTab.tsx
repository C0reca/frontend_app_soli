import React, { useState } from 'react';
import { useProcessoChecklist, ChecklistItem } from '@/hooks/useProcessoChecklist';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProcessChecklistTabProps {
  processoId: number;
}

export const ProcessChecklistTab: React.FC<ProcessChecklistTabProps> = ({ processoId }) => {
  const { items, isLoading, progress, toggleItem, createItem, deleteItem } = useProcessoChecklist(processoId);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    try {
      await createItem.mutateAsync({ titulo: newTitle.trim() });
      setNewTitle('');
      setAdding(false);
    } catch {
      toast({ title: 'Erro ao criar item', variant: 'destructive' });
    }
  };

  const handleToggle = async (item: ChecklistItem) => {
    try {
      await toggleItem.mutateAsync(item.id);
    } catch {
      toast({ title: 'Erro ao atualizar item', variant: 'destructive' });
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await deleteItem.mutateAsync(itemId);
    } catch {
      toast({ title: 'Erro ao apagar item', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">A carregar checklist...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Checklist</h3>
          {items.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {items.filter(i => i.concluido).length}/{items.length}
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="h-3 w-3 mr-1" />
          Adicionar
        </Button>
      </div>

      {items.length > 0 && (
        <Progress value={progress} className="h-2" />
      )}

      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group"
          >
            <Checkbox
              checked={item.concluido}
              onCheckedChange={() => handleToggle(item)}
            />
            <div className="flex-1 min-w-0">
              <span className={`text-sm ${item.concluido ? 'line-through text-muted-foreground' : ''}`}>
                {item.titulo}
              </span>
              {item.descricao && (
                <p className="text-xs text-muted-foreground truncate">{item.descricao}</p>
              )}
              {item.concluido && item.concluido_por_nome && (
                <p className="text-xs text-muted-foreground">
                  Concluído por {item.concluido_por_nome}
                  {item.concluido_em && ` em ${new Date(item.concluido_em).toLocaleDateString('pt-PT')}`}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 text-destructive"
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {adding && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Título do item..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setAdding(false); setNewTitle(''); }
            }}
            autoFocus
            className="text-sm"
          />
          <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim()}>
            Adicionar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewTitle(''); }}>
            Cancelar
          </Button>
        </div>
      )}

      {items.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Sem itens de checklist. Adicione itens manualmente ou configure um tipo de processo com checklist.
        </p>
      )}
    </div>
  );
};
