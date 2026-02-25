import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Users, Loader2 } from 'lucide-react';
import { useProcessoEntidadesSecundarias, ProcessoEntidadeSecundaria } from '@/hooks/useProcessoEntidadesSecundarias';
import { useClients } from '@/hooks/useClients';
import { useEntidadesExternas, EntidadeExterna } from '@/hooks/useEntidadesExternas';
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

/** Combobox simples para entidades externas */
function ExternalEntityCombobox({
  entidades,
  value,
  onChange,
  isLoading,
}: {
  entidades: EntidadeExterna[];
  value?: number;
  onChange: (id: number) => void;
  isLoading?: boolean;
}) {
  const [search, setSearch] = useState('');
  const filtered = entidades.filter((e) => {
    const term = search.toLowerCase();
    return (
      e.nome.toLowerCase().includes(term) ||
      (e.nif || '').toLowerCase().includes(term)
    );
  });
  const selected = entidades.find((e) => e.id === value);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Pesquisar entidade externa por nome ou NIF..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-48 overflow-y-auto border rounded-md">
        {isLoading ? (
          <div className="p-3 text-sm text-muted-foreground">A carregar...</div>
        ) : filtered.length === 0 ? (
          <div className="p-3 text-sm text-muted-foreground">Nenhuma entidade externa encontrada.</div>
        ) : (
          filtered.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex justify-between items-center ${
                value === e.id ? 'bg-blue-50 text-blue-700' : ''
              }`}
              onClick={() => onChange(e.id)}
            >
              <div>
                <span className="font-medium">{e.nome}</span>
                {e.nif && <span className="text-xs text-muted-foreground ml-2">NIF: {e.nif}</span>}
              </div>
              {value === e.id && <span className="text-blue-600 text-xs font-medium">Selecionada</span>}
            </button>
          ))
        )}
      </div>
      {selected && (
        <p className="text-xs text-muted-foreground">
          Selecionada: <strong>{selected.nome}</strong>
        </p>
      )}
    </div>
  );
}

export const ProcessoEntidadesSecundariasTab: React.FC<ProcessoEntidadesSecundariasTabProps> = ({ processoId, clientePrincipal }) => {
  const { entidades, isLoading, adicionarEntidade, atualizarEntidade, removerEntidade } = useProcessoEntidadesSecundarias(processoId);
  const { clients, isLoading: isLoadingClients } = useClients();
  const { entidades: entidadesExternas, isLoading: isLoadingExternas } = useEntidadesExternas();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEntidade, setSelectedEntidade] = useState<ProcessoEntidadeSecundaria | null>(null);
  const [selectedClienteId, setSelectedClienteId] = useState<number | undefined>();
  const [selectedExternaId, setSelectedExternaId] = useState<number | undefined>();
  const [tipoParticipacao, setTipoParticipacao] = useState<string>('');
  const [tipoEntidade, setTipoEntidade] = useState<'normal' | 'externa'>('normal');

  const handleAdd = () => {
    setSelectedClienteId(undefined);
    setSelectedExternaId(undefined);
    setTipoParticipacao('');
    setTipoEntidade('normal');
    setIsModalOpen(true);
  };

  const handleEdit = (entidade: ProcessoEntidadeSecundaria) => {
    setSelectedEntidade(entidade);
    setTipoParticipacao(entidade.tipo_participacao || '');
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (tipoEntidade === 'normal' && !selectedClienteId) return;
    if (tipoEntidade === 'externa' && !selectedExternaId) return;

    const dados: { cliente_id?: number; entidade_externa_id?: number; tipo_participacao?: string } = {
      tipo_participacao: tipoParticipacao || undefined,
    };

    if (tipoEntidade === 'normal') {
      dados.cliente_id = selectedClienteId;
    } else {
      dados.entidade_externa_id = selectedExternaId;
    }

    await adicionarEntidade.mutateAsync(dados);

    setIsModalOpen(false);
    setSelectedClienteId(undefined);
    setSelectedExternaId(undefined);
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

  const getEntidadeNome = (entidade: ProcessoEntidadeSecundaria): string => {
    if (entidade.entidade_externa) return entidade.entidade_externa.nome || `Externa #${entidade.entidade_externa_id}`;
    if (entidade.cliente) return entidade.cliente.nome || `Cliente #${entidade.cliente_id}`;
    if (entidade.cliente_id) {
      const cliente = clients.find(c => Number(c.id) === entidade.cliente_id);
      if (cliente) return cliente.tipo === 'singular' ? (cliente as any).nome : (cliente as any).nome_empresa;
      return `Cliente #${entidade.cliente_id}`;
    }
    return 'N/A';
  };

  const getEntidadeNIF = (entidade: ProcessoEntidadeSecundaria): string => {
    if (entidade.entidade_externa) return entidade.entidade_externa.nif || '-';
    if (entidade.cliente) return entidade.cliente.nif || '-';
    if (entidade.cliente_id) {
      const cliente = clients.find(c => Number(c.id) === entidade.cliente_id);
      if (cliente) return cliente.tipo === 'singular' ? (cliente as any).nif : (cliente as any).nif_empresa;
    }
    return '-';
  };

  const isExterna = (entidade: ProcessoEntidadeSecundaria) => !!entidade.entidade_externa_id;

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
                  <TableHead className="text-xs">Entidade</TableHead>
                  <TableHead className="text-xs">NIF</TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs">Tipo de Participação</TableHead>
                  <TableHead className="text-xs w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entidades.map((entidade) => (
                  <TableRow key={entidade.id}>
                    <TableCell className="text-xs">
                      {isExterna(entidade) ? (
                        <span className="font-medium">{getEntidadeNome(entidade)}</span>
                      ) : (
                        <ClickableClientName
                          clientId={entidade.cliente_id!}
                          clientName={getEntidadeNome(entidade)}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {getEntidadeNIF(entidade)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {isExterna(entidade) ? (
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                          Externa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Normal
                        </Badge>
                      )}
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
              <p className="text-sm mt-2">Clique em "Adicionar Entidade Secundária" para associar outro cliente ou entidade externa ao processo.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Adicionar Entidade */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Entidade Secundária</DialogTitle>
            <DialogDescription className="sr-only">Selecione o tipo de entidade, a entidade e o tipo de participação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Entidade</Label>
              <Select value={tipoEntidade} onValueChange={(v) => {
                setTipoEntidade(v as 'normal' | 'externa');
                setSelectedClienteId(undefined);
                setSelectedExternaId(undefined);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Entidade Normal</SelectItem>
                  <SelectItem value="externa">Entidade Externa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{tipoEntidade === 'normal' ? 'Cliente' : 'Entidade Externa'}</Label>
              {tipoEntidade === 'normal' ? (
                <ClientCombobox
                  clients={clients || []}
                  value={selectedClienteId}
                  onChange={(value) => setSelectedClienteId(value)}
                  isLoading={isLoadingClients}
                />
              ) : (
                <ExternalEntityCombobox
                  entidades={entidadesExternas}
                  value={selectedExternaId}
                  onChange={(id) => setSelectedExternaId(id)}
                  isLoading={isLoadingExternas}
                />
              )}
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
              disabled={
                (tipoEntidade === 'normal' && !selectedClienteId) ||
                (tipoEntidade === 'externa' && !selectedExternaId) ||
                adicionarEntidade.isPending
              }
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
                <Label>Entidade</Label>
                <p className="text-sm font-medium flex items-center gap-2">
                  {getEntidadeNome(selectedEntidade)}
                  {isExterna(selectedEntidade) && (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                      Externa
                    </Badge>
                  )}
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
