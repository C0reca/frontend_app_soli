import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send } from 'lucide-react';
import { useCobrancaPreview, useCobrancaActions } from '@/hooks/useCobranca';

interface CobrancaEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: number | null;
  clienteNome?: string;
}

const formatCurrency = (value: any) => {
  const n = typeof value === 'number' ? value : Number(value) || 0;
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n);
};

export const CobrancaEmailModal: React.FC<CobrancaEmailModalProps> = ({
  isOpen,
  onClose,
  clienteId,
  clienteNome,
}) => {
  const { data: preview, isLoading } = useCobrancaPreview(isOpen ? clienteId : null);
  const { enviarCobranca } = useCobrancaActions();
  const [destinatario, setDestinatario] = useState('');

  useEffect(() => {
    if (preview?.destinatario) {
      setDestinatario(preview.destinatario);
    }
  }, [preview]);

  const handleEnviar = async () => {
    if (!clienteId || !destinatario) return;
    await enviarCobranca.mutateAsync({
      cliente_id: clienteId,
      destinatario,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Enviar Email de Cobranca</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">A gerar preview...</div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Destinatario</Label>
              <Input
                type="email"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                placeholder="email@exemplo.pt"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground">Cliente</Label>
              <p className="text-sm font-medium">{clienteNome || `Cliente #${clienteId}`}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground">Valor Total</Label>
              <p className="text-lg font-bold">{formatCurrency(preview.valor_total)}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground">Assunto</Label>
              <p className="text-sm">{preview.assunto}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground">Pre-visualizacao do Email</Label>
              <div className="rounded-md border p-3 bg-muted/20 text-sm whitespace-pre-wrap max-h-[250px] overflow-y-auto">
                {preview.conteudo}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Nao foi possivel gerar a pre-visualizacao.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!destinatario || !preview || enviarCobranca.isPending}
            onClick={handleEnviar}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {enviarCobranca.isPending ? 'A enviar...' : 'Enviar Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
