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
import { DynamicSelect } from '@/components/ui/DynamicSelect';
import { Process } from '@/hooks/useProcesses';

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
      const valor = process.onde_estao || undefined;
      setLocalizacao(valor === 'Tarefas' ? 'Pendentes' : valor);
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
            <DynamicSelect
              categoria="onde_estao"
              value={localizacao != null && localizacao !== '' ? localizacao : '__none__'}
              onValueChange={(value) => setLocalizacao(value === '__none__' ? undefined : value)}
              placeholder="Selecione uma localização"
              fallbackOptions={[
                { value: "__none__", label: "Nenhuma" },
                { value: "Casa", label: "Casa" },
                { value: "Cartorio", label: "Cartorio" },
                { value: "Camara/GaiaUrb", label: "Camara/GaiaUrb" },
                { value: "DPA Agendado", label: "DPA Agendado" },
                { value: "Armário DPA", label: "Armário DPA" },
                { value: "PEPEX", label: "PEPEX" },
                { value: "Conservatoria Civil/Comercial", label: "Conservatoria Civil/Comercial" },
                { value: "Reuniões", label: "Reuniões" },
                { value: "Conservatoria Predial", label: "Conservatoria Predial" },
                { value: "Serviço Finanças", label: "Serviço Finanças" },
                { value: "Imposto Selo / Participações", label: "Imposto Selo / Participações" },
                { value: "Serviço Finanças Pendentes", label: "Serviço Finanças Pendentes" },
                { value: "Aguarda Doc Cliente/Informações", label: "Aguarda Doc Cliente/Informações" },
                { value: "Aguarda Doc", label: "Aguarda Doc" },
                { value: "Decorre Prazo", label: "Decorre Prazo" },
                { value: "Pendentes", label: "Pendentes" },
                { value: "Injunções", label: "Injunções" },
                { value: "Execuções", label: "Execuções" },
                { value: "Inventário Judicial", label: "Inventário Judicial" },
              ]}
            />
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

