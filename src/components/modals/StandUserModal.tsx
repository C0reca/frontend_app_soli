import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useStandUserMutations, type StandUser } from '@/hooks/usePortalStand';
import { ClientCombobox } from '@/components/ui/clientcombobox';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: StandUser | null;
}

export const StandUserModal: React.FC<Props> = ({ open, onOpenChange, user }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [standEntidadeId, setStandEntidadeId] = useState<number | null>(null);
  const [ativo, setAtivo] = useState(true);
  const { toast } = useToast();
  const { criar, atualizar } = useStandUserMutations();
  const { data: clientsData, isLoading: isClientsLoading } = useClients();

  useEffect(() => {
    if (user) {
      setNome(user.nome);
      setEmail(user.email);
      setStandEntidadeId(user.stand_entidade_id);
      setAtivo(user.ativo);
      setPassword('');
    } else {
      setNome('');
      setEmail('');
      setPassword('');
      setStandEntidadeId(null);
      setAtivo(true);
    }
  }, [user, open]);

  const handleSubmit = async () => {
    if (!nome.trim() || !email.trim()) return;

    try {
      if (user) {
        const dados: any = { id: user.id, nome, email, ativo };
        if (password) dados.password = password;
        await atualizar.mutateAsync(dados);
        toast({ title: 'Utilizador atualizado' });
      } else {
        if (!standEntidadeId || !password) return;
        await criar.mutateAsync({ stand_entidade_id: standEntidadeId, nome, email, password });
        toast({ title: 'Utilizador criado' });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.response?.data?.detail || 'Erro ao guardar', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Utilizador Stand' : 'Novo Utilizador Stand'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!user && (
            <div>
              <Label>Stand (Entidade) *</Label>
              <ClientCombobox clients={clientsData ?? []} value={standEntidadeId} onChange={setStandEntidadeId} isLoading={isClientsLoading} placeholderEmpty="Selecionar stand..." />
            </div>
          )}
          <div>
            <Label>Nome *</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do utilizador" />
          </div>
          <div>
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@stand.pt" />
          </div>
          <div>
            <Label>{user ? 'Nova Password (deixar vazio para manter)' : 'Password *'}</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <Switch checked={ativo} onCheckedChange={setAtivo} />
              <Label>Ativo</Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!nome.trim() || !email.trim() || (!user && (!password || !standEntidadeId))}>
            {user ? 'Guardar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
