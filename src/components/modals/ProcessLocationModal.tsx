import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Process } from '@/hooks/useProcesses';

// Lista de opções de localização pré-definidas
const OPCOES_LOCALIZACAO = [
  'Gabinete 1',
  'Gabinete 2',
  'Gabinete 3',
  'Estante A',
  'Estante B',
  'Estante C',
  'Arquivo',
  'Cliente',
  'Em processamento',
  'Concluído',
  'Pendente de resposta',
  'Aguardando documentos',
];

interface ProcessLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  process: Process | null;
  onSave: (processId: number, localizacao: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const ProcessLocationModal: React.FC<ProcessLocationModalProps> = ({
  isOpen,
  onClose,
  process,
  onSave,
  isSubmitting = false,
}) => {
  const [localizacao, setLocalizacao] = useState('');

  useEffect(() => {
    if (isOpen && process) {
      setLocalizacao(process.onde_estao || '');
    }
  }, [isOpen, process]);

  const handleSave = async () => {
    if (!process || !localizacao) return;
    await onSave(process.id, localizacao);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Alterar Localização do Processo</DialogTitle>
          <DialogDescription>
            {process && `Altere a localização do processo "${process.titulo}"`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="localizacao">Localização</Label>
            <Select value={localizacao} onValueChange={setLocalizacao}>
              <SelectTrigger id="localizacao">
                <SelectValue placeholder="Selecione uma localização" />
              </SelectTrigger>
              <SelectContent>
                {OPCOES_LOCALIZACAO.map((opcao) => (
                  <SelectItem key={opcao} value={opcao}>
                    {opcao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Selecione onde se encontra o processo físico ou o seu estado atual.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !localizacao}
          >
            {isSubmitting ? 'A guardar...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

