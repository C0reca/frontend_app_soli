import React, { useState } from 'react';
import { useSolicitadores, useSolicitadorMutations, Solicitador } from '@/hooks/useSolicitadores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader2, Pencil, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const SolicitadorManager: React.FC = () => {
  const { data: solicitadores, isLoading } = useSolicitadores();
  const { criar, editar, desativar } = useSolicitadorMutations();
  const { toast } = useToast();

  const [newNome, setNewNome] = useState('');
  const [newTitulo, setNewTitulo] = useState('');
  const [newCedula, setNewCedula] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editTitulo, setEditTitulo] = useState('');
  const [editCedula, setEditCedula] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const sorted = [...(solicitadores || [])].sort((a, b) => {
    if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
    return a.ordem - b.ordem;
  });

  const handleAdd = async () => {
    if (!newNome.trim() || !newTitulo.trim()) return;
    try {
      await criar.mutateAsync({
        nome: newNome.trim(),
        titulo: newTitulo.trim(),
        cedula: newCedula.trim() || undefined,
      });
      setNewNome('');
      setNewTitulo('');
      setNewCedula('');
      toast({ title: 'Solicitador adicionado' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.response?.data?.detail || 'Erro ao adicionar', variant: 'destructive' });
    }
  };

  const handleToggle = async (sol: Solicitador) => {
    try {
      if (sol.ativo) {
        await desativar.mutateAsync(sol.id);
        toast({ title: 'Solicitador desativado' });
      } else {
        await editar.mutateAsync({ id: sol.id, ativo: true });
        toast({ title: 'Solicitador reativado' });
      }
    } catch {
      toast({ title: 'Erro ao alterar estado', variant: 'destructive' });
    }
  };

  const startEdit = (sol: Solicitador) => {
    setEditingId(sol.id);
    setEditNome(sol.nome);
    setEditTitulo(sol.titulo);
    setEditCedula(sol.cedula || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (sol: Solicitador) => {
    if (!editNome.trim() || !editTitulo.trim()) return;
    const updates: any = {};
    if (editNome.trim() !== sol.nome) updates.nome = editNome.trim();
    if (editTitulo.trim() !== sol.titulo) updates.titulo = editTitulo.trim();
    const cedVal = editCedula.trim() || null;
    if (cedVal !== (sol.cedula || null)) updates.cedula = cedVal || '';

    if (Object.keys(updates).length === 0) {
      setEditingId(null);
      return;
    }

    try {
      await editar.mutateAsync({ id: sol.id, ...updates });
      setEditingId(null);
      toast({ title: 'Solicitador atualizado' });
    } catch {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Perfis de Solicitador</h3>
      <p className="text-sm text-gray-500 mb-6">
        Gerir os perfis de solicitador usados na geração de capas de processo PDF.
      </p>

      {/* List */}
      <div className="space-y-2 mb-6">
        {sorted.map((sol) => (
          <div
            key={sol.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
              sol.ativo ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
            }`}
          >
            {editingId === sol.id ? (
              <>
                <div className="flex-1 flex gap-2">
                  <Input
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    placeholder="Nome"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={editTitulo}
                    onChange={(e) => setEditTitulo(e.target.value)}
                    placeholder="Título"
                    className="h-8 text-sm w-40"
                  />
                  <Input
                    value={editCedula}
                    onChange={(e) => setEditCedula(e.target.value)}
                    placeholder="Cédula (opcional)"
                    className="h-8 text-sm w-40"
                  />
                </div>
                <button
                  onClick={() => handleSaveEdit(sol)}
                  className="p-1.5 text-green-600 hover:text-green-700"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{sol.nome}</span>
                    <span className="text-xs text-gray-400">—</span>
                    <span className="text-sm text-gray-600">{sol.titulo}</span>
                    {sol.cedula && (
                      <span className="text-xs text-gray-400 font-mono ml-2">
                        Cédula: {sol.cedula}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => startEdit(sol)}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <Switch
                  checked={sol.ativo}
                  onCheckedChange={() => handleToggle(sol)}
                />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium mb-2">Adicionar solicitador</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Nome"
            value={newNome}
            onChange={(e) => setNewNome(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Título (ex: Solicitadora)"
            value={newTitulo}
            onChange={(e) => setNewTitulo(e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Cédula (opcional)"
            value={newCedula}
            onChange={(e) => setNewCedula(e.target.value)}
            className="w-40"
          />
          <Button onClick={handleAdd} disabled={!newNome.trim() || !newTitulo.trim() || criar.isPending}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
};
