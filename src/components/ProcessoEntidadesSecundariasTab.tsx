import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, Users, Loader2 } from 'lucide-react';
import { useProcessoEntidadesSecundarias, ProcessoEntidadeSecundaria } from '@/hooks/useProcessoEntidadesSecundarias';
import { useClients } from '@/hooks/useClients';
import { ClientCombobox } from '@/components/ui/clientcombobox';
import { ClickableClientName } from '@/components/ClickableClientName';

interface ProcessoEntidadesSecundariasTabProps {
  processoId: number | null;
  clientePrincipal?: {
    id: number;
    nome?: string;
    nome_empresa?: string;
    nif?: string;
    nif_empresa?: string;
    tipo?: string;
  } | null;
}

export const ProcessoEntidadesSecundariasTab: React.FC<ProcessoEntidadesSecundariasTabProps> = ({ processoId, clientePrincipal }) => {
  const { entidades, isLoading, adicionarEntidade, atualizarEntidade, removerEntidade } = useProcessoEntidadesSecundarias(processoId);
  const { clients, isLoading: isLoadingClients } = useClients();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEntidade, setSelectedEntidade] = useState<ProcessoEntidadeSecundaria | null>(null);
  const [selectedClienteId, setSelectedClienteId] = useState<number | undefined>();
  const [tipoParticipacao, setTipoParticipacao] = useState<string>('');

  const handleAdd = () => {
    setSelectedClienteId(undefined);
    setTipoParticipacao('');
    setIsModalOpen(true);
  };

  const handleEdit = (entidade: ProcessoEntidadeSecundaria) => {
    setSelectedEntidade(entidade);
    setTipoParticipacao(entidade.tipo_participacao || '');
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedClienteId) {
      return;
    }

    await adicionarEntidade.mutateAsync({
      cliente_id: selectedClienteId,
      tipo_participacao: tipoParticipacao || undefined,
    });

    setIsModalOpen(false);
    setSelectedClienteId(undefined);
    setTipoParticipacao('');
  };

  const handleUpdate = async () => {
    if (!selectedEntidade) return;

    await atualizarEntidade.mutateAsync({
      id: selectedEntidade.id,
      tipo_participacao: tipoParticipacao || undefined,
    });

    setIsEditModalOpen(false);
    setSelectedEntidade(null);
    setTipoParticipacao('');
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja remover esta entidade secundária?')) {
      await removerEntidade.mutateAsync(id);
    }
  };

  const getClienteNome = (clienteId: number) => {
    const cliente = clients.find(c => Number(c.id) === clienteId);
    if (!cliente) return `Cliente #${clienteId}`;
    return cliente.tipo === 'singular' 
      ? (cliente as any).nome 
      : (cliente as any).nome_empresa;
  };

  const getClienteNIF = (clienteId: number) => {
    const cliente = clients.find(c => Number(c.id) === clienteId);
    if (!cliente) return '-';
    return cliente.tipo === 'singular' 
      ? (cliente as any).nif 
      : (cliente as any).nif_empresa;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p>A carregar entidades secundárias...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Entidades Secundárias</span>
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdd}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Entidade Secundária
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {entidades.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Cliente</TableHead>
                  <TableHead className="text-xs">NIF</TableHead>
                  <TableHead className="text-xs">Tipo de Participação</TableHead>
                  <TableHead className="text-xs w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entidades.map((entidade) => (
                  <TableRow key={entidade.id}>
                    <TableCell className="text-xs">
                      <ClickableClientName
                        clientId={entidade.cliente_id}
                        clientName={entidade.cliente?.nome || getClienteNome(entidade.cliente_id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {entidade.cliente?.nif || getClienteNIF(entidade.cliente_id) || '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {entidade.tipo_participacao || '-'}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleEdit(entidade)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(entidade.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma entidade secundária adicionada.</p>
              <p className="text-sm mt-2">Clique em "Adicionar Entidade Secundária" para associar outro cliente ao processo.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Adicionar Entidade */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Entidade Secundária</DialogTitle>
            <DialogDescription className="sr-only">Selecione o cliente e o tipo de participação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <ClientCombobox
                clients={clients || []}
                value={selectedClienteId}
                onChange={(value) => setSelectedClienteId(value)}
                isLoading={isLoadingClients}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_participacao">Tipo de Participação (Opcional)</Label>
              <Input
                id="tipo_participacao"
                value={tipoParticipacao}
                onChange={(e) => setTipoParticipacao(e.target.value)}
                placeholder="Ex: Testemunha, Interessado, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!selectedClienteId || adicionarEntidade.isPending}
            >
              {adicionarEntidade.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Entidade */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Entidade Secundária</DialogTitle>
            <DialogDescription className="sr-only">Altere o tipo de participação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedEntidade && (
              <div className="space-y-2">
                <Label>Cliente</Label>
                <p className="text-sm font-medium">
                  {selectedEntidade.cliente?.nome || getClienteNome(selectedEntidade.cliente_id)}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-tipo_participacao">Tipo de Participação (Opcional)</Label>
              <Input
                id="edit-tipo_participacao"
                value={tipoParticipacao}
                onChange={(e) => setTipoParticipacao(e.target.value)}
                placeholder="Ex: Testemunha, Interessado, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={atualizarEntidade.isPending}
            >
              {atualizarEntidade.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
