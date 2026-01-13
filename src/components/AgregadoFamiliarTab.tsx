import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, User } from 'lucide-react';
import { useAgregadoFamiliar, AgregadoFamiliar } from '@/hooks/useAgregadoFamiliar';
import { useClients } from '@/hooks/useClients';
import { ClientCombobox } from '@/components/ui/clientcombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Client, IndividualClient } from '@/hooks/useClients';

interface AgregadoFamiliarTabProps {
  clienteId: number;
  cliente?: Client;
}

export const AgregadoFamiliarTab: React.FC<AgregadoFamiliarTabProps> = ({ clienteId, cliente }) => {
  const { agregado, isLoading, createRelacao, deleteRelacao } = useAgregadoFamiliar(clienteId);
  const { clients } = useClients();
  
  // Obter dados do cliente principal se não foi passado
  const clientePrincipal = cliente || clients.find(c => Number(c.id) === clienteId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<number | undefined>();
  const [tipoRelacao, setTipoRelacao] = useState<'esposo' | 'esposa' | 'filho' | 'filha'>('esposa');

  // Preparar clientes para o ClientCombobox (excluir o próprio cliente, inclui campos de NIF para pesquisa)
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

  const handleAddRelacao = async () => {
    if (!selectedClienteId) {
      alert('Selecione um cliente');
      return;
    }

    await createRelacao.mutateAsync({
      cliente_id: clienteId,
      cliente_relacionado_id: selectedClienteId,
      tipo_relacao: tipoRelacao,
    });

    setIsModalOpen(false);
    setSelectedClienteId(undefined);
    setTipoRelacao('esposa');
  };

  const handleDelete = async (relacao: AgregadoFamiliar) => {
    if (confirm('Tem certeza que deseja eliminar esta relação?')) {
      await deleteRelacao.mutateAsync(relacao.id);
    }
  };

  const getTipoRelacaoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      esposo: 'Esposo',
      esposa: 'Esposa',
      filho: 'Filho',
      filha: 'Filha',
      pai: 'Pai',
      mae: 'Mãe',
    };
    return labels[tipo] || tipo;
  };

  const getTipoRelacaoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      esposo: 'bg-blue-100 text-blue-800',
      esposa: 'bg-pink-100 text-pink-800',
      filho: 'bg-green-100 text-green-800',
      filha: 'bg-purple-100 text-purple-800',
      pai: 'bg-orange-100 text-orange-800',
      mae: 'bg-rose-100 text-rose-800',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  const getClienteNome = (relacao: AgregadoFamiliar) => {
    if (relacao.cliente_relacionado) {
      const tipo = relacao.cliente_relacionado.tipo || 'singular';
      return tipo === 'singular'
        ? relacao.cliente_relacionado.nome
        : relacao.cliente_relacionado.nome_empresa;
    }
    return `Cliente #${relacao.cliente_relacionado_id}`;
  };

  const getClienteNIF = (relacao: AgregadoFamiliar) => {
    if (relacao.cliente_relacionado) {
      const tipo = relacao.cliente_relacionado.tipo || 'singular';
      return tipo === 'singular'
        ? relacao.cliente_relacionado.nif
        : relacao.cliente_relacionado.nif_empresa;
    }
    return '-';
  };

  const getClienteSenhaFinancas = (relacao: AgregadoFamiliar) => {
    if (relacao.cliente_relacionado) {
      return relacao.cliente_relacionado.senha_financas || 'Não definida';
    }
    return '-';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Informações do Cliente Principal */}
      {clientePrincipal && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Dados do Titular</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {clientePrincipal.incapacidade !== undefined && clientePrincipal.incapacidade !== null && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Incapacidade</label>
                  <p className="text-lg font-semibold">{clientePrincipal.incapacidade}%</p>
                </div>
              )}
              {clientePrincipal.iban && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">IBAN</label>
                  <p className="font-mono text-sm">{clientePrincipal.iban}</p>
                </div>
              )}
              {(clientePrincipal as IndividualClient).estado_civil && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Estado Civil</label>
                  <p className="text-sm">{(clientePrincipal as IndividualClient).estado_civil}</p>
                </div>
              )}
            </div>
            {agregado.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Última Atualização do Agregado Familiar</label>
                  <p className="text-sm">
                    {new Date(
                      Math.max(
                        ...agregado.map((rel) => new Date(rel.atualizado_em).getTime())
                      )
                    ).toLocaleString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Agregado Familiar</span>
            </CardTitle>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {agregado.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum membro adicionado ao agregado familiar.</p>
              <p className="text-sm mt-2">Clique em "Adicionar Membro" para associar uma entidade.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>NIF</TableHead>
                  <TableHead>Password Finanças</TableHead>
                  <TableHead>Relação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agregado.map((relacao) => (
                  <TableRow key={relacao.id}>
                    <TableCell className="font-medium">
                      {getClienteNome(relacao)}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{getClienteNIF(relacao) || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{getClienteSenhaFinancas(relacao)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTipoRelacaoBadge(relacao.tipo_relacao)}>
                        {getTipoRelacaoLabel(relacao.tipo_relacao)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(relacao)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro ao Agregado Familiar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <ClientCombobox
                clients={clientsForCombobox}
                value={selectedClienteId}
                onChange={(value) => setSelectedClienteId(value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Relação *</Label>
              <Select
                value={tipoRelacao}
                onValueChange={(value) => setTipoRelacao(value as 'esposo' | 'esposa' | 'filho' | 'filha')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="esposo">Esposo</SelectItem>
                  <SelectItem value="esposa">Esposa</SelectItem>
                  <SelectItem value="filho">Filho</SelectItem>
                  <SelectItem value="filha">Filha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddRelacao} disabled={!selectedClienteId || createRelacao.isPending}>
              {createRelacao.isPending ? 'A adicionar...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
