import React, { useState } from 'react';
import { useCategorias, useOpcoes, useOpcoesMutations, Opcao } from '@/hooks/useConfiguracaoOpcoes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ChevronUp, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CATEGORIA_LABELS: Record<string, string> = {
  onde_estao: 'Localização (Onde Estão)',
  forma_juridica: 'Forma Jurídica',
  estado_civil: 'Estado Civil',
  tipo_log: 'Tipo de Log',
  tipo_tarefa: 'Tipo de Tarefa',
  prioridade_tarefa: 'Prioridade de Tarefa',
  tipo_transferencia_caixa: 'Tipo de Transferência (Caixa)',
  tipo_transacao: 'Tipo de Transação',
  metodo_pagamento: 'Método de Pagamento',
  categoria_template: 'Categoria de Template',
  estado_registo_predial: 'Estado Registo Predial',
  estado_pagamento_irs: 'Estado Pagamento IRS',
  estado_entrega_irs: 'Estado Entrega IRS',
  tipo_relacao_familiar: 'Tipo Relação Familiar',
  tipo_contacto: 'Tipo de Contacto',
};

export const SelectOptionsManager: React.FC = () => {
  const { data: categorias, isLoading: loadingCats } = useCategorias();
  const [selectedCat, setSelectedCat] = useState<string>('');
  const { toast } = useToast();

  // Select first category by default
  React.useEffect(() => {
    if (categorias && categorias.length > 0 && !selectedCat) {
      setSelectedCat(categorias[0].categoria);
    }
  }, [categorias, selectedCat]);

  return (
    <div className="flex gap-6 h-[calc(100vh-220px)]">
      {/* Sidebar - categories */}
      <div className="w-64 border-r pr-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Categorias</h3>
        {loadingCats ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-1">
            {categorias?.map((cat) => (
              <button
                key={cat.categoria}
                onClick={() => setSelectedCat(cat.categoria)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCat === cat.categoria
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{CATEGORIA_LABELS[cat.categoria] || cat.categoria}</span>
                  <span className="text-xs text-gray-400">{cat.ativos}/{cat.total}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main panel - options */}
      <div className="flex-1 overflow-y-auto">
        {selectedCat ? (
          <CategoryOptions categoria={selectedCat} />
        ) : (
          <div className="text-gray-500 text-center py-12">
            Selecione uma categoria
          </div>
        )}
      </div>
    </div>
  );
};

function CategoryOptions({ categoria }: { categoria: string }) {
  const { data: opcoes, isLoading } = useOpcoes(categoria, false); // include inactive
  const { criar, editar, desativar, reordenar } = useOpcoesMutations(categoria);
  const { toast } = useToast();
  const [newValor, setNewValor] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const sortedOpcoes = [...(opcoes || [])].sort((a, b) => {
    // Active first, then by ordem
    if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
    return a.ordem - b.ordem;
  });

  const activeOpcoes = sortedOpcoes.filter(o => o.ativo);

  const handleAdd = async () => {
    if (!newValor.trim() || !newLabel.trim()) return;
    try {
      await criar.mutateAsync({ categoria, valor: newValor.trim(), label: newLabel.trim() });
      setNewValor('');
      setNewLabel('');
      toast({ title: 'Opção adicionada' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.response?.data?.detail || 'Erro ao adicionar', variant: 'destructive' });
    }
  };

  const handleToggle = async (opcao: Opcao) => {
    try {
      if (opcao.ativo) {
        await desativar.mutateAsync(opcao.id);
        toast({ title: 'Opção desativada' });
      } else {
        await editar.mutateAsync({ id: opcao.id, ativo: true });
        toast({ title: 'Opção reativada' });
      }
    } catch {
      toast({ title: 'Erro ao alterar estado', variant: 'destructive' });
    }
  };

  const handleSaveLabel = async (opcao: Opcao) => {
    if (!editLabel.trim() || editLabel === opcao.label) {
      setEditingId(null);
      return;
    }
    try {
      await editar.mutateAsync({ id: opcao.id, label: editLabel.trim() });
      setEditingId(null);
      toast({ title: 'Label atualizado' });
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const items = [...activeOpcoes];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    [items[index], items[swapIdx]] = [items[swapIdx], items[index]];
    const reorderItems = items.map((item, i) => ({ id: item.id, ordem: i }));

    try {
      await reordenar.mutateAsync({ categoria, items: reorderItems });
    } catch {
      toast({ title: 'Erro ao reordenar', variant: 'destructive' });
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">
        {CATEGORIA_LABELS[categoria] || categoria}
      </h3>

      {/* Options list */}
      <div className="space-y-2 mb-6">
        {sortedOpcoes.map((opcao, idx) => {
          const activeIdx = activeOpcoes.findIndex(o => o.id === opcao.id);
          return (
            <div
              key={opcao.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                opcao.ativo ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
              }`}
            >
              {/* Reorder buttons */}
              {opcao.ativo && (
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMove(activeIdx, 'up')}
                    disabled={activeIdx === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(activeIdx, 'down')}
                    disabled={activeIdx === activeOpcoes.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {!opcao.ativo && <div className="w-5" />}

              {/* Label */}
              <div className="flex-1">
                {editingId === opcao.id ? (
                  <Input
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={() => handleSaveLabel(opcao)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveLabel(opcao)}
                    className="h-7 text-sm"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => { setEditingId(opcao.id); setEditLabel(opcao.label); }}
                    className="text-sm text-left hover:underline"
                  >
                    {opcao.label}
                  </button>
                )}
              </div>

              {/* Value badge */}
              <span className="text-xs text-gray-400 font-mono">{opcao.valor}</span>

              {/* Toggle */}
              <Switch
                checked={opcao.ativo}
                onCheckedChange={() => handleToggle(opcao)}
              />
            </div>
          );
        })}
      </div>

      {/* Add new option */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-2">Adicionar opção</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Valor (chave)"
            value={newValor}
            onChange={(e) => setNewValor(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Label (texto visível)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAdd} disabled={!newValor.trim() || !newLabel.trim() || criar.isPending}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
