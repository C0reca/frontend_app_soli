import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Users, Loader2 } from 'lucide-react';
import { useFiliacao, useAgregadoFamiliar, TipoRelacao } from '@/hooks/useAgregadoFamiliar';
import { useClients } from '@/hooks/useClients';
import { ClientCombobox } from '@/components/ui/clientcombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ClickableClientName } from '@/components/ClickableClientName';

interface FiliacaoSectionProps {
  clienteId: number;
}

const TIPOS_RELACAO: { value: TipoRelacao; label: string }[] = [
  { value: 'conjuge', label: 'Cônjuge' },
  { value: 'filho', label: 'Filho' },
  { value: 'filha', label: 'Filha' },
  { value: 'pai', label: 'Pai' },
  { value: 'mae', label: 'Mãe' },
  { value: 'irmao', label: 'Irmão' },
  { value: 'irma', label: 'Irmã' },
  { value: 'avo', label: 'Avô' },
  { value: 'avó', label: 'Avó' },
  { value: 'neto', label: 'Neto' },
  { value: 'neta', label: 'Neta' },
  { value: 'sogro', label: 'Sogro' },
  { value: 'sogra', label: 'Sogra' },
  { value: 'genro', label: 'Genro' },
  { value: 'nora', label: 'Nora' },
  { value: 'tio', label: 'Tio' },
  { value: 'tia', label: 'Tia' },
  { value: 'sobrinho', label: 'Sobrinho' },
  { value: 'sobrinha', label: 'Sobrinha' },
  { value: 'padrasto', label: 'Padrasto' },
  { value: 'madrasta', label: 'Madrasta' },
  { value: 'enteado', label: 'Enteado' },
  { value: 'enteada', label: 'Enteada' },
];

const getRelacaoLabel = (tipo: string): string => {
  const found = TIPOS_RELACAO.find(t => t.value === tipo);
  return found?.label || tipo;
};

export const FiliacaoSection: React.FC<FiliacaoSectionProps> = ({ clienteId }) => {
  const { filiacao, isLoading } = useFiliacao(clienteId);
  const { createRelacao, updateRelacao, deleteRelacao } = useAgregadoFamiliar(clienteId);
  const { clients } = useClients();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<number | undefined>();
  const [tipoRelacao, setTipoRelacao] = useState<TipoRelacao>('conjuge');
  const [fazParteAgregado, setFazParteAgregado] = useState(false);

  const clientsForCombobox = clients
    .filter((c) => c.id !== clienteId)
    .map((client) => {
      const tipo = client.tipo || 'singular';
      const nome = tipo === 'singular'
        ? (client as any).nome
        : (client as any).nome_empresa;
      return {
        id: parseInt(client.id.toString()),
        nome: nome || `Cliente #${client.id}`,
        nome_empresa: tipo === 'coletivo' ? (client as any).nome_empresa : null,
        tipo: tipo as 'singular' | 'coletivo',
        nif: tipo === 'singular' ? (client as any).nif : null,
        nif_empresa: tipo === 'coletivo' ? (client as any).nif_empresa : null,
      };
    });

  const handleAdd = async () => {
    if (!selectedClienteId) return;
    await createRelacao.mutateAsync({
      cliente_id: clienteId,
      cliente_relacionado_id: selectedClienteId,
      tipo_relacao: tipoRelacao,
      faz_parte_agregado: fazParteAgregado,
    });
    setIsModalOpen(false);
    setSelectedClienteId(undefined);
    setTipoRelacao('conjuge');
    setFazParteAgregado(false);
  };

  const handleToggleAgregado = async (relacaoId: number, currentValue: boolean) => {
    await updateRelacao.mutateAsync({
      id: relacaoId,
      data: { faz_parte_agregado: !currentValue },
    });
  };

  const handleDelete = async (relacaoId: number) => {
    await deleteRelacao.mutateAsync(relacaoId);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5" />
            Filiação
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filiacao.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sem relações de filiação registadas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Relação</TableHead>
                  <TableHead>Agregado</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filiacao.map((rel) => {
                  const nome = rel.cliente_relacionado?.nome || rel.cliente_relacionado?.nome_empresa || `#${rel.cliente_relacionado_id}`;
                  return (
                    <TableRow key={rel.id}>
                      <TableCell>
                        <ClickableClientName
                          clientId={rel.cliente_relacionado_id}
                          clientName={nome}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getRelacaoLabel(rel.tipo_relacao)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={rel.faz_parte_agregado}
                          onCheckedChange={() => handleToggleAgregado(rel.id, rel.faz_parte_agregado)}
                          disabled={updateRelacao.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rel.id)}
                          disabled={deleteRelacao.isPending}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Filiação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Entidade</Label>
              <ClientCombobox
                clients={clientsForCombobox}
                selectedClientId={selectedClienteId}
                onSelect={setSelectedClienteId}
                placeholder="Pesquisar entidade..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Relação</Label>
              <Select value={tipoRelacao} onValueChange={(v) => setTipoRelacao(v as TipoRelacao)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_RELACAO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Faz parte do Agregado Familiar</Label>
              <Switch checked={fazParteAgregado} onCheckedChange={setFazParteAgregado} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedClienteId || createRelacao.isPending}
            >
              {createRelacao.isPending ? 'A adicionar...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
