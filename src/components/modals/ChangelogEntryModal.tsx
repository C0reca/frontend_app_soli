import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChangelogMutations, ChangelogEntry } from '@/hooks/useChangelog';
import { Loader2 } from 'lucide-react';

interface ChangelogEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: ChangelogEntry | null;
}

const tipoLabels: Record<string, string> = {
  melhoria: 'Melhoria',
  correcao: 'Correção',
  nova_funcionalidade: 'Nova Funcionalidade',
  seguranca: 'Segurança',
};

export const ChangelogEntryModal: React.FC<ChangelogEntryModalProps> = ({
  open,
  onOpenChange,
  entry,
}) => {
  const [versao, setVersao] = useState('');
  const [tipo, setTipo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [publicado, setPublicado] = useState(true);
  const [saving, setSaving] = useState(false);
  const { createEntry, updateEntry } = useChangelogMutations();

  const isEdit = !!entry;

  useEffect(() => {
    if (entry) {
      setVersao(entry.versao);
      setTipo(entry.tipo);
      setTitulo(entry.titulo);
      setDescricao(entry.descricao || '');
      setPublicado(entry.publicado);
    } else {
      setVersao('');
      setTipo('');
      setTitulo('');
      setDescricao('');
      setPublicado(true);
    }
  }, [entry, open]);

  const handleClose = () => {
    if (!saving) onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!versao.trim() || !tipo || !titulo.trim()) return;
    setSaving(true);

    try {
      const payload = {
        versao: versao.trim(),
        tipo,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        publicado,
      };

      if (isEdit && entry) {
        await updateEntry.mutateAsync({ id: entry.id, payload });
      } else {
        await createEntry.mutateAsync(payload);
      }
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  const isValid = versao.trim() && tipo && titulo.trim();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar Entrada' : 'Nova Entrada no Changelog'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="versao">Versão *</Label>
              <Input
                id="versao"
                value={versao}
                onChange={(e) => setVersao(e.target.value)}
                placeholder="ex: 1.5.0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título da alteração"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição detalhada da alteração..."
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={publicado}
              onCheckedChange={setPublicado}
              id="publicado"
            />
            <Label htmlFor="publicado">Publicado (visível para todos)</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !isValid}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A guardar...
              </>
            ) : isEdit ? (
              'Guardar'
            ) : (
              'Criar Entrada'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
