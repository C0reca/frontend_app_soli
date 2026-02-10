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

// Lista de opções de localização pré-definidas (mesmas das tarefas)
const OPCOES_LOCALIZACAO = [
  'Casa',
  'Cartorio',
  'Camara/GaiaUrb',
  'DPA Agendado',
  'Armário DPA',
  'PEPEX',
  'Conservatoria Civil/Comercial',
  'Reuniões',
  'Conservatoria Predial',
  'Serviço Finanças',
  'Imposto Selo / Participações',
  'Serviço Finanças Pendentes',
  'Aguarda Doc Cliente/Informações',
  'Aguarda Doc',
  'Decorre Prazo',
  'Tarefas',
  'Injunções',
  'Execuções',
  'Inventário Judicial',
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
  const [localizacao, setLocalizacao] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen && process) {
      setLocalizacao(process.onde_estao || undefined);
    } else if (!isOpen) {
      setLocalizacao(undefined);
    }
  }, [isOpen, process]);

  const handleSave = async () => {
    if (!process) return;
    // Permitir salvar mesmo se localizacao for vazia (para limpar)
    await onSave(process.id, localizacao || null || '');
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
            <Select
              value={localizacao != null && localizacao !== '' ? localizacao : '__none__'}
              onValueChange={(value) => setLocalizacao(value === '__none__' ? undefined : value)}
            >
              <SelectTrigger id="localizacao">
                <SelectValue placeholder="Selecione uma localização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhuma</SelectItem>
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'A guardar...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

