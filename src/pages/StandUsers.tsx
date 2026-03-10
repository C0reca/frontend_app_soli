import React, { useState } from 'react';
import { Plus, Car, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStandUsers, useStandUserMutations, type StandUser } from '@/hooks/usePortalStand';
import { StandUserModal } from '@/components/modals/StandUserModal';
import { useToast } from '@/hooks/use-toast';

export const StandUsers: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<StandUser | null>(null);
  const { data: users = [], isLoading } = useStandUsers();
  const { apagar } = useStandUserMutations();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    if (!confirm('Tem a certeza que deseja eliminar este utilizador?')) return;
    try {
      await apagar.mutateAsync(id);
      toast({ title: 'Utilizador eliminado' });
    } catch {
      toast({ title: 'Erro ao eliminar', variant: 'destructive' });
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('pt-PT');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="h-6 w-6" />
            Portal Stand — Utilizadores
          </h1>
          <p className="text-sm text-muted-foreground">Gerir acessos ao portal de stands de automóveis</p>
        </div>
        <Button onClick={() => { setEditUser(null); setModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Utilizador
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Stand</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último Login</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">A carregar...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum utilizador registado</TableCell></TableRow>
            ) : (
              users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell className="text-sm">{u.stand_nome || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={u.ativo ? 'default' : 'secondary'}>
                      {u.ativo ? <><Check className="h-3 w-3 mr-1" />Ativo</> : <><X className="h-3 w-3 mr-1" />Inativo</>}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(u.last_login)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(u.criado_em)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setEditUser(u); setModalOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-600" onClick={() => handleDelete(u.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StandUserModal open={modalOpen} onOpenChange={setModalOpen} user={editUser} />
    </div>
  );
};
