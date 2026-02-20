import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, AlertTriangle } from 'lucide-react';
import { useCobrancaPreview, useCobrancaActions } from '@/hooks/useCobranca';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const { data: preview, isLoading } = useCobrancaPreview(isOpen ? clienteId : null);
  const { enviarCobranca } = useCobrancaActions();
  const { clients, updateClient } = useClients();
  const [destinatario, setDestinatario] = useState('');
  const [assunto, setAssunto] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [guardarEmail, setGuardarEmail] = useState(false);
  const [clienteEmail, setClienteEmail] = useState<string | null>(null);

  // Find client email when modal opens
  useEffect(() => {
    if (isOpen && clienteId && clients) {
      const cliente = clients.find((c: any) => c.id === clienteId || c.id === String(clienteId));
      const email = cliente?.email || null;
      setClienteEmail(email);
      if (email) {
        setDestinatario(email);
        setGuardarEmail(false);
      } else {
        setDestinatario('');
        setGuardarEmail(false);
      }
    }
  }, [isOpen, clienteId, clients]);

  useEffect(() => {
    if (preview) {
      // Only override destinatario from preview if we don't already have client email
      if (preview.destinatario && !clienteEmail) setDestinatario(preview.destinatario);
      if (preview.assunto) setAssunto(preview.assunto);
      const corpo = preview.corpo || preview.conteudo || '';
      if (corpo) setConteudo(corpo);
    }
  }, [preview, clienteEmail]);

  const emailDifersFromClient = destinatario && destinatario !== clienteEmail;

  const handleEnviar = async () => {
    if (!clienteId || !destinatario) return;

    // Save email to client if checkbox is checked
    if (guardarEmail && emailDifersFromClient) {
      try {
        await updateClient.mutateAsync({ id: String(clienteId), email: destinatario });
        toast({ title: 'Email guardado', description: `Email atualizado na ficha da entidade.` });
      } catch {
        toast({ title: 'Erro', description: 'Não foi possível guardar o email na entidade.', variant: 'destructive' });
      }
    }

    await enviarCobranca.mutateAsync({
      cliente_id: clienteId,
      destinatario,
      assunto,
      conteudo,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:min-w-[700px]">
        <DialogHeader>
          <DialogTitle>Enviar Email de Cobrança</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">A gerar preview...</div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Destinatário</Label>
              {!clienteEmail && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Esta entidade não tem email registado. Introduza o email manualmente.</span>
                </div>
              )}
              <Input
                type="email"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                placeholder="email@exemplo.pt"
              />
              {emailDifersFromClient && (
                <div className="flex items-center gap-2 mt-1">
                  <Checkbox
                    id="guardar-email"
                    checked={guardarEmail}
                    onCheckedChange={(checked) => setGuardarEmail(checked === true)}
                  />
                  <label htmlFor="guardar-email" className="text-sm text-muted-foreground cursor-pointer">
                    Guardar este email na ficha da entidade
                  </label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Cliente</Label>
                <p className="text-sm font-medium">{clienteNome || `Cliente #${clienteId}`}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Valor Total</Label>
                <p className="text-lg font-bold">{formatCurrency(preview.valor_total)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Assunto do email"
              />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo do Email</Label>
              <Textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                rows={10}
                className="text-sm font-mono"
                placeholder="Corpo do email..."
              />
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Não foi possível gerar a pré-visualização.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!destinatario || !assunto || !conteudo || enviarCobranca.isPending}
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
