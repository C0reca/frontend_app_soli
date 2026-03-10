import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send } from 'lucide-react';
import { useEmailTemplatesList, useEmailPreview, useEnviarEmail } from '@/hooks/useEmailTemplates';

interface EnviarEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  processoId?: number;
  destinatarioDefault?: string;
}

export const EnviarEmailModal: React.FC<EnviarEmailModalProps> = ({
  isOpen, onClose, processoId, destinatarioDefault,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [destinatario, setDestinatario] = useState(destinatarioDefault || '');
  const [assunto, setAssunto] = useState('');

  const { data: templates } = useEmailTemplatesList();
  const { data: preview } = useEmailPreview(selectedTemplateId, processoId || null);
  const enviarEmail = useEnviarEmail();

  useEffect(() => {
    if (isOpen) {
      setSelectedTemplateId(null);
      setDestinatario(destinatarioDefault || '');
      setAssunto('');
    }
  }, [isOpen, destinatarioDefault]);

  useEffect(() => {
    if (preview?.assunto_sugerido && !assunto) {
      setAssunto(preview.assunto_sugerido);
    }
  }, [preview]);

  const handleEnviar = () => {
    if (!selectedTemplateId || !destinatario || !assunto) return;
    enviarEmail.mutate(
      {
        template_id: selectedTemplateId,
        processo_id: processoId,
        destinatario,
        assunto,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Email</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Template de Email *</Label>
            <Select
              value={selectedTemplateId ? String(selectedTemplateId) : ''}
              onValueChange={(v) => setSelectedTemplateId(Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar template..." />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(!templates || templates.length === 0) && (
              <p className="text-xs text-muted-foreground mt-1">
                Crie templates com categoria "Email" em Templates Docs.
              </p>
            )}
          </div>

          <div>
            <Label>Destinatário *</Label>
            <Input
              type="email"
              value={destinatario}
              onChange={(e) => setDestinatario(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <Label>Assunto *</Label>
            <Input
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
            />
          </div>

          {preview?.html && (
            <div>
              <Label>Preview</Label>
              <div
                className="border rounded-md p-3 bg-white max-h-[300px] overflow-y-auto text-sm"
                dangerouslySetInnerHTML={{ __html: preview.html }}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleEnviar}
            disabled={!selectedTemplateId || !destinatario || !assunto || enviarEmail.isPending}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {enviarEmail.isPending ? 'A enviar...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
