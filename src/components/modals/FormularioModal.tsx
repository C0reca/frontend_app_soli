import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormularioMutations, useTiposFormulario } from '@/hooks/useFormulariosPublicos';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processoId?: number;
  clienteId?: number;
}

const TIPO_LABELS: Record<string, string> = {
  herdeiros: 'Herdeiros',
  dados_cliente: 'Dados Pessoais',
  generico: 'Genérico',
};

export const FormularioModal: React.FC<Props> = ({ open, onOpenChange, processoId, clienteId }) => {
  const [tipo, setTipo] = useState('dados_cliente');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const { toast } = useToast();
  const { criar } = useFormularioMutations();
  const { data: tipos } = useTiposFormulario();

  useEffect(() => {
    if (open) {
      setTipo('dados_cliente');
      setTitulo('');
      setDescricao('');
    }
  }, [open]);

  useEffect(() => {
    if (tipos && tipo && tipos[tipo]) {
      setTitulo(tipos[tipo].titulo_default);
    }
  }, [tipo, tipos]);

  const handleSubmit = async () => {
    if (!titulo.trim()) return;
    try {
      const result = await criar.mutateAsync({
        processo_id: processoId,
        cliente_id: clienteId,
        tipo,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
      });
      toast({ title: 'Formulário criado', description: 'Link copiado para a área de transferência.' });

      const baseUrl = window.location.origin;
      const url = `${baseUrl}/formulario/${result.token}`;
      navigator.clipboard.writeText(url).catch(() => {});

      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.response?.data?.detail || 'Erro ao criar', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo Formulário Público</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tipo *</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Título *</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título do formulário" />
          </div>
          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Instruções para o cliente..." rows={3} />
          </div>
          {tipos && tipo && tipos[tipo] && (
            <p className="text-xs text-muted-foreground">
              Este tipo inclui {tipos[tipo].campos_count} campos pré-definidos.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!titulo.trim() || criar.isPending}>
            {criar.isPending ? 'A criar...' : 'Criar e Copiar Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
