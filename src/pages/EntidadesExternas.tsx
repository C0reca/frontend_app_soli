import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, ArrowRightLeft, Loader2, UserX } from 'lucide-react';
import { useEntidadesExternas, EntidadeExterna } from '@/hooks/useEntidadesExternas';
import { usePermissions } from '@/hooks/usePermissions';
import { ConvertExternalEntityModal } from '@/components/modals/ConvertExternalEntityModal';

/** Embeddable component — used as a tab inside the Clients page. */
export const EntidadesExternasTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { entidades, isLoading, criar, atualizar, eliminar } = useEntidadesExternas(debouncedSearch);
  const { canCreate, canEdit } = usePermissions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<EntidadeExterna | null>(null);
  const [convertEntity, setConvertEntity] = useState<EntidadeExterna | null>(null);

  // Form state
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formContacto, setFormContacto] = useState('');
  const [formNif, setFormNif] = useState('');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const openCreate = () => {
    setEditingEntity(null);
    setFormNome('');
    setFormEmail('');
    setFormContacto('');
    setFormNif('');
    setIsModalOpen(true);
  };

  const openEdit = (ent: EntidadeExterna) => {
    setEditingEntity(ent);
    setFormNome(ent.nome || '');
    setFormEmail(ent.email || '');
    setFormContacto(ent.contacto || '');
    setFormNif(ent.nif || '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formNome.trim()) return;
    const dados = {
      nome: formNome.trim(),
      email: formEmail.trim() || undefined,
      contacto: formContacto.trim() || undefined,
      nif: formNif.trim() || undefined,
    };
    if (editingEntity) {
      await atualizar.mutateAsync({ id: editingEntity.id, ...dados });
    } else {
      await criar.mutateAsync(dados);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja desativar esta entidade externa?')) {
      await eliminar.mutateAsync(id);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome ou NIF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Badge variant="secondary">{entidades.length} resultado(s)</Badge>
              {canCreate('clientes') && (
                <Button onClick={openCreate} size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Entidade Externa
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                A carregar...
              </div>
            ) : entidades.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserX className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhuma entidade externa encontrada.</p>
                <p className="text-sm mt-1">Entidades externas têm dados mínimos e podem ser associadas como secundárias em processos.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>NIF</TableHead>
                    <TableHead className="w-[140px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entidades.map((ent) => (
                    <TableRow key={ent.id}>
                      <TableCell className="font-medium">{ent.nome}</TableCell>
                      <TableCell>{ent.email || '-'}</TableCell>
                      <TableCell>{ent.contacto || '-'}</TableCell>
                      <TableCell className="font-mono">{ent.nif || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {canEdit('clientes') && (
                            <>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(ent)} title="Editar">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setConvertEntity(ent)} title="Converter para entidade normal">
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-800" onClick={() => handleDelete(ent.id)} title="Desativar">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Criar/Editar */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingEntity ? 'Editar Entidade Externa' : 'Nova Entidade Externa'}</DialogTitle>
            <DialogDescription className="sr-only">Preencha os dados da entidade externa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ee-nome">Nome *</Label>
              <Input id="ee-nome" value={formNome} onChange={(e) => setFormNome(e.target.value)} placeholder="Nome da entidade" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ee-email">Email</Label>
              <Input id="ee-email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ee-contacto">Contacto</Label>
              <Input id="ee-contacto" value={formContacto} onChange={(e) => setFormContacto(e.target.value)} placeholder="Telefone / telemóvel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ee-nif">NIF</Label>
              <Input id="ee-nif" value={formNif} onChange={(e) => setFormNif(e.target.value)} placeholder="Número de identificação fiscal" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formNome.trim() || criar.isPending || atualizar.isPending}>
              {(criar.isPending || atualizar.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingEntity ? 'Guardar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Converter */}
      {convertEntity && (
        <ConvertExternalEntityModal
          entidade={convertEntity}
          open={!!convertEntity}
          onOpenChange={(open) => { if (!open) setConvertEntity(null); }}
        />
      )}
    </>
  );
};
