import React, { useState } from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TarefaSugerida } from '@/hooks/useExtracaoDocumento';

interface TarefasSugeridasListProps {
  tarefas: TarefaSugerida[];
  onCriarTarefas: (tarefas: TarefaSugerida[]) => void;
}

const prioridadeCores: Record<string, string> = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-yellow-100 text-yellow-700',
  baixa: 'bg-green-100 text-green-700',
};

export const TarefasSugeridasList: React.FC<TarefasSugeridasListProps> = ({
  tarefas,
  onCriarTarefas,
}) => {
  const [selecionadas, setSelecionadas] = useState<Set<number>>(
    new Set(tarefas.map((_, i) => i))
  );

  if (!tarefas.length) return null;

  const toggleTarefa = (index: number) => {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const tarefasSelecionadas = tarefas.filter((_, i) => selecionadas.has(i));

  return (
    <div className="space-y-3">
      {tarefas.map((tarefa, i) => (
        <label
          key={i}
          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            selecionadas.has(i)
              ? 'border-purple-200 bg-purple-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <input
            type="checkbox"
            checked={selecionadas.has(i)}
            onChange={() => toggleTarefa(i)}
            className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-gray-900">{tarefa.titulo}</span>
              <Badge className={`text-xs ${prioridadeCores[tarefa.prioridade] || prioridadeCores.media}`}>
                {tarefa.prioridade}
              </Badge>
            </div>
            {tarefa.descricao && (
              <p className="text-sm text-gray-500 mt-0.5">{tarefa.descricao}</p>
            )}
          </div>
        </label>
      ))}

      <Button
        onClick={() => onCriarTarefas(tarefasSelecionadas)}
        disabled={tarefasSelecionadas.length === 0}
        variant="outline"
        className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        Criar {tarefasSelecionadas.length} Tarefa{tarefasSelecionadas.length !== 1 ? 's' : ''} Selecionada{tarefasSelecionadas.length !== 1 ? 's' : ''}
      </Button>
    </div>
  );
};
