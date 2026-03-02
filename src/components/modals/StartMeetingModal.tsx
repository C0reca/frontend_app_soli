import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMeeting } from '@/contexts/MeetingContext';
import { Clock } from 'lucide-react';

interface StartMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  processoId: number;
  processoTitulo: string;
}

export const StartMeetingModal: React.FC<StartMeetingModalProps> = ({
  isOpen,
  onClose,
  processoId,
  processoTitulo,
}) => {
  const [titulo, setTitulo] = useState('');
  const [loading, setLoading] = useState(false);
  const { startMeeting } = useMeeting();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setLoading(true);
    try {
      await startMeeting(processoId, processoTitulo, titulo.trim());
      setTitulo('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            Iniciar Reunião
          </DialogTitle>
          <DialogDescription>
            A reunião será associada ao processo e o temporizador começa imediatamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Processo</label>
            <p className="text-sm">{processoTitulo}</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Título da reunião</label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reunião com cliente sobre escritura"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!titulo.trim() || loading} className="bg-purple-600 hover:bg-purple-700">
              {loading ? 'A iniciar...' : 'Iniciar Reunião'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
