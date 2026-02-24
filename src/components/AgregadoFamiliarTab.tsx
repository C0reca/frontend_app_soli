import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, User, Home, Loader2, Check } from 'lucide-react';
import { useAgregadoFamiliar, AgregadoFamiliar } from '@/hooks/useAgregadoFamiliar';
import { useClients } from '@/hooks/useClients';
import { ClientCombobox } from '@/components/ui/clientcombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DynamicSelect } from '@/components/ui/DynamicSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Client, IndividualClient } from '@/hooks/useClients';
import { ClickableClientName } from '@/components/ClickableClientName';
import { ClientModal } from '@/components/modals/ClientModal';
import { ClientModalResumido } from '@/components/modals/ClientModalResumido';
import { useToast } from '@/hooks/use-toast';

interface AgregadoFamiliarTabProps {
  clienteId: number;
  cliente?: Client;
  irsId?: number;
  onRegistrarHistorico?: (acao: string, campoAlterado?: string, valorAnterior?: string, valorNovo?: string, detalhes?: string) => Promise<void>;
}

// Função para traduzir estado civil de inglês para português
const getEstadoCivilLabel = (estadoCivil?: string): string => {
  if (!estadoCivil) return '-';
  const traducoes: Record<string, string> = {
    'single': 'Solteiro(a)',
    'married': 'Casado(a)',
    'uniao_facto': 'União de Facto',
    'divorced': 'Divorciado(a)',
    'separated': 'Separado(a)', // legado: já não aparece no selector
    'separacao_facto': 'Separação de Facto',
    'widowed': 'Viúvo(a)',
  };
  return traducoes[estadoCivil.toLowerCase()] || estadoCivil;
};

export const AgregadoFamiliarTab: React.FC<AgregadoFamiliarTabProps> = ({ clienteId, cliente, irsId, onRegistrarHistorico }) => {
  const { agregado, isLoading, createRelacao, deleteRelacao } = useAgregadoFamiliar(clienteId);
  const { clients, updateClient } = useClients();
  const { toast } = useToast();
  
  // Obter dados do cliente principal se não foi passado
  const clientePrincipal = cliente || clients.find(c => Number(c.id) === clienteId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<number | undefined>();
  const [tipoRelacao, setTipoRelacao] = useState<'conjuge' | 'filho' | 'filha' | 'pai' | 'mae' | 'irmao' | 'irma'>('conjuge');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientFormMode, setClientFormMode] = useState<'resumido' | 'completo'>('resumido');
  
  // Estados para o modal de atualização de morada
  const [isMoradaModalOpen, setIsMoradaModalOpen] = useState(false);
  const [newMorada, setNewMorada] = useState({ morada: '', codigo_postal: '', localidade: '' });
  const [updatingMoradas, setUpdatingMoradas] = useState(false);
  
  // Estados para o modal de atualização de password do titular
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  // Estados para o modal de atualização de password dos membros
  const [isMemberPasswordModalOpen, setIsMemberPasswordModalOpen] = useState(false);
  const [selectedMemberForPassword, setSelectedMemberForPassword] = useState<AgregadoFamiliar | null>(null);
  const [memberNewPassword, setMemberNewPassword] = useState('');
  const [updatingMemberPassword, setUpdatingMemberPassword] = useState(false);
  
  // Estados para o modal de atualização de incapacidade do titular
  const [isIncapacidadeModalOpen, setIsIncapacidadeModalOpen] = useState(false);
  const [newIncapacidade, setNewIncapacidade] = useState('');
  const [updatingIncapacidade, setUpdatingIncapacidade] = useState(false);
  
  // Estados para o modal de atualização de incapacidade dos membros
  const [isMemberIncapacidadeModalOpen, setIsMemberIncapacidadeModalOpen] = useState(false);
  const [selectedMemberForIncapacidade, setSelectedMemberForIncapacidade] = useState<AgregadoFamiliar | null>(null);
  const [memberNewIncapacidade, setMemberNewIncapacidade] = useState('');
  const [updatingMemberIncapacidade, setUpdatingMemberIncapacidade] = useState(false);

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

    const selectedClient = clients.find(c => Number(c.id) === selectedClienteId);
    const nomeCliente = selectedClient 
      ? (selectedClient.tipo === 'singular' ? (selectedClient as any).nome : (selectedClient as any).nome_empresa)
      : `Cliente #${selectedClienteId}`;

    await createRelacao.mutateAsync({
      cliente_id: clienteId,
      cliente_relacionado_id: selectedClienteId,
      tipo_relacao: tipoRelacao,
      faz_parte_agregado: true,
    });

    // Registrar no histórico do IRS se disponível
    if (irsId && onRegistrarHistorico) {
      await onRegistrarHistorico(
        'alteracao',
        'agregado_familiar',
        '',
        nomeCliente,
        `Membro adicionado ao agregado familiar: ${nomeCliente} (${getTipoRelacaoLabel(tipoRelacao)})`
      );
    }

    setIsModalOpen(false);
    setSelectedClienteId(undefined);
    setTipoRelacao('conjuge');
  };

  const handleClientCreated = (createdClient: Client) => {
    if (createdClient?.id) {
      const newId = typeof createdClient.id === 'string' ? parseInt(createdClient.id, 10) : createdClient.id;
      if (!Number.isNaN(newId)) {
        setSelectedClienteId(newId);
      }
    }
    setIsClientModalOpen(false);
  };

  const handleDelete = async (relacao: AgregadoFamiliar) => {
    if (confirm('Tem certeza que deseja eliminar esta relação?')) {
      const nomeCliente = getClienteNome(relacao);
      
      await deleteRelacao.mutateAsync(relacao.id);

      // Registrar no histórico do IRS se disponível
      if (irsId && onRegistrarHistorico) {
        await onRegistrarHistorico(
          'alteracao',
          'agregado_familiar',
          nomeCliente,
          '',
          `Membro removido do agregado familiar: ${nomeCliente} (${getTipoRelacaoLabel(relacao.tipo_relacao)})`
        );
      }
    }
  };

  const getTipoRelacaoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      conjuge: 'Cônjuge',
      filho: 'Filho',
      filha: 'Filha',
      pai: 'Pai',
      mae: 'Mãe',
      irmao: 'Irmão',
      irma: 'Irmã',
    };
    return labels[tipo] || tipo;
  };

  const getTipoRelacaoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      conjuge: 'bg-blue-100 text-blue-800',
      filho: 'bg-green-100 text-green-800',
      filha: 'bg-purple-100 text-purple-800',
      pai: 'bg-orange-100 text-orange-800',
      mae: 'bg-rose-100 text-rose-800',
      irmao: 'bg-cyan-100 text-cyan-800',
      irma: 'bg-pink-100 text-pink-800',
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

  const getClienteIncapacidade = (relacao: AgregadoFamiliar) => {
    if (relacao.cliente_relacionado) {
      return relacao.cliente_relacionado.incapacidade;
    }
    return null;
  };

  const handleOpenMoradaModal = () => {
    if (clientePrincipal) {
      setNewMorada({
        morada: (clientePrincipal as any).morada || '',
        codigo_postal: (clientePrincipal as any).codigo_postal || '',
        localidade: (clientePrincipal as any).localidade || '',
      });
    }
    setIsMoradaModalOpen(true);
  };

  const handleUpdateTitularMorada = async () => {
    if (!clienteId || !clientePrincipal) {
      toast({
        title: 'Erro',
        description: 'Cliente não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    if (!newMorada.morada.trim()) {
      toast({
        title: 'Erro',
        description: 'A morada não pode estar vazia.',
        variant: 'destructive',
      });
      return;
    }

    const moradaAnterior = `${(clientePrincipal as any).morada || ''}, ${(clientePrincipal as any).codigo_postal || ''} ${(clientePrincipal as any).localidade || ''}`.trim();
    const moradaNova = `${newMorada.morada}, ${newMorada.codigo_postal || ''} ${newMorada.localidade || ''}`.trim();

    setUpdatingMoradas(true);
    try {
      await updateClient.mutateAsync({
        id: clienteId.toString(),
        morada: newMorada.morada,
        codigo_postal: newMorada.codigo_postal,
        localidade: newMorada.localidade,
      });

      // Registrar no histórico do IRS se disponível
      if (irsId && onRegistrarHistorico) {
        await onRegistrarHistorico(
          'alteracao',
          'morada',
          moradaAnterior || 'Não definida',
          moradaNova,
          `Morada do titular atualizada`
        );
      }

      toast({
        title: 'Sucesso',
        description: 'Morada do titular atualizada com sucesso.',
      });
      setIsMoradaModalOpen(false);
      setNewMorada({ morada: '', codigo_postal: '', localidade: '' });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao atualizar morada.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingMoradas(false);
    }
  };

  const handleUpdateAgregadoFamiliarMoradas = async () => {
    if (!clienteId || !clientePrincipal) {
      toast({
        title: 'Erro',
        description: 'Cliente não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    if (!newMorada.morada.trim()) {
      toast({
        title: 'Erro',
        description: 'A morada não pode estar vazia.',
        variant: 'destructive',
      });
      return;
    }

    if (agregado.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Não há membros no agregado familiar para atualizar.',
        variant: 'destructive',
      });
      return;
    }

    const moradaNova = `${newMorada.morada}, ${newMorada.codigo_postal || ''} ${newMorada.localidade || ''}`.trim();

    setUpdatingMoradas(true);
    try {
      // Atualizar moradas de todos os membros do agregado familiar (sem o cliente principal)
      const promises = agregado.map(async (membro) => {
        const membroId = membro.cliente_relacionado_id;
        return updateClient.mutateAsync({
          id: membroId.toString(),
          morada: newMorada.morada,
          codigo_postal: newMorada.codigo_postal,
          localidade: newMorada.localidade,
        });
      });

      await Promise.all(promises);

      // Registrar no histórico do IRS se disponível
      if (irsId && onRegistrarHistorico) {
        await onRegistrarHistorico(
          'alteracao',
          'morada',
          'Várias moradas',
          moradaNova,
          `Moradas atualizadas para ${agregado.length} membro(s) do agregado familiar`
        );
      }

      toast({
        title: 'Sucesso',
        description: `Moradas atualizadas para ${agregado.length} membro(s) do agregado familiar.`,
      });
      setIsMoradaModalOpen(false);
      setNewMorada({ morada: '', codigo_postal: '', localidade: '' });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao atualizar moradas.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingMoradas(false);
    }
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Dados do Titular</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Nome</label>
                <p className="text-sm font-medium">
                  <ClickableClientName 
                    clientId={clientePrincipal.id} 
                    client={clientePrincipal}
                    clientName={(clientePrincipal.tipo === 'singular' || !clientePrincipal.tipo)
                      ? (clientePrincipal as any).nome || `Cliente #${clientePrincipal.id}`
                      : (clientePrincipal as any).nome_empresa || `Cliente #${clientePrincipal.id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  />
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">NIF</label>
                <p className="font-mono text-sm">
                  {(clientePrincipal.tipo === 'singular' || !clientePrincipal.tipo)
                    ? (clientePrincipal as any).nif || '-'
                    : (clientePrincipal as any).nif_empresa || '-'}
                </p>
              </div>
              {(clientePrincipal as any).telefone && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Telefone</label>
                  <p className="text-sm">{(clientePrincipal as any).telefone}</p>
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">Password Finanças</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewPassword((clientePrincipal as any).senha_financas || '');
                      setIsPasswordModalOpen(true);
                    }}
                    className="h-6 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Atualizar
                  </Button>
                </div>
                <p className="font-mono text-sm">{(clientePrincipal as any).senha_financas || 'Não definida'}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Incapacidade</label>
                <div>
                  {clientePrincipal.incapacidade !== undefined && clientePrincipal.incapacidade !== null && clientePrincipal.incapacidade > 0 ? (
                    <Badge className="bg-red-100 text-red-800 border border-red-300 text-xs px-2 py-0.5 font-semibold">
                      {clientePrincipal.incapacidade}%
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">0%</p>
                  )}
                </div>
              </div>
              {clientePrincipal.iban && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">IBAN</label>
                  <p className="font-mono text-sm">{clientePrincipal.iban}</p>
                </div>
              )}
              {(clientePrincipal as IndividualClient).estado_civil && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Estado Civil</label>
                  <p className="text-sm">{getEstadoCivilLabel((clientePrincipal as IndividualClient).estado_civil)}</p>
                </div>
              )}
            </div>
            
            {/* Campos de Morada */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Home className="h-3 w-3" />
                  Morada
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenMoradaModal}
                  className="h-7 text-xs"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Atualizar Morada
                </Button>
              </div>
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Morada</label>
                  <p className="text-sm">{(clientePrincipal as any).morada || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Código Postal</label>
                    <p className="text-sm font-mono">{(clientePrincipal as any).codigo_postal || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Freguesia</label>
                    <p className="text-sm">{(clientePrincipal as any).localidade || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Agregado Familiar</span>
            </CardTitle>
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsModalOpen(true);
              }} 
              size="sm" 
              className="text-sm"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar Membro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {agregado.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum membro adicionado ao agregado familiar.</p>
              <p className="text-xs mt-2">Clique em "Adicionar Membro" para associar uma entidade.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Nome</TableHead>
                  <TableHead className="text-xs">NIF</TableHead>
                  <TableHead className="text-xs">Password Finanças</TableHead>
                  <TableHead className="text-xs">Incapacidade</TableHead>
                  <TableHead className="text-xs">Relação</TableHead>
                  <TableHead className="text-xs">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Linha do Titular */}
                {clientePrincipal && (
                  <TableRow>
                    <TableCell className="text-sm">
                      <ClickableClientName 
                        clientId={clientePrincipal.id} 
                        client={clientePrincipal}
                        clientName={(clientePrincipal.tipo === 'singular' || !clientePrincipal.tipo)
                          ? (clientePrincipal as any).nome || `Cliente #${clientePrincipal.id}`
                          : (clientePrincipal as any).nome_empresa || `Cliente #${clientePrincipal.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {(clientePrincipal.tipo === 'singular' || !clientePrincipal.tipo)
                          ? (clientePrincipal as any).nif || '-'
                          : (clientePrincipal as any).nif_empresa || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{(clientePrincipal as any).senha_financas || 'Não definida'}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            setNewPassword((clientePrincipal as any).senha_financas || '');
                            setIsPasswordModalOpen(true);
                          }}
                          title="Atualizar Password Finanças"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {clientePrincipal.incapacidade !== undefined && clientePrincipal.incapacidade !== null && clientePrincipal.incapacidade > 0 ? (
                          <Badge className="bg-red-100 text-red-800 border border-red-300 text-xs px-2 py-0.5 font-semibold">
                            {clientePrincipal.incapacidade}%
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">0%</span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            setNewIncapacidade((clientePrincipal as any).incapacidade?.toString() || '0');
                            setIsIncapacidadeModalOpen(true);
                          }}
                          title="Atualizar Incapacidade"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-gray-100 text-gray-800 text-xs px-1.5 py-0">
                        Titular
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {/* Titular não pode ser removido */}
                    </TableCell>
                  </TableRow>
                )}
                {/* Membros do agregado familiar */}
                {agregado.map((relacao) => (
                  <TableRow key={relacao.id}>
                    <TableCell className="text-sm">
                      <ClickableClientName 
                        clientId={relacao.cliente_relacionado_id} 
                        client={relacao.cliente_relacionado}
                        clientName={getClienteNome(relacao)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                      />
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{getClienteNIF(relacao) || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{getClienteSenhaFinancas(relacao)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedMemberForPassword(relacao);
                            setMemberNewPassword(relacao.cliente_relacionado?.senha_financas || '');
                            setIsMemberPasswordModalOpen(true);
                          }}
                          title="Atualizar Password Finanças"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const incapacidade = getClienteIncapacidade(relacao);
                          if (incapacidade !== undefined && incapacidade !== null && incapacidade > 0) {
                            return (
                              <Badge className="bg-red-100 text-red-800 border border-red-300 text-xs px-2 py-0.5 font-semibold">
                                {incapacidade}%
                              </Badge>
                            );
                          }
                          return <span className="text-xs text-muted-foreground">0%</span>;
                        })()}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            const incapacidade = getClienteIncapacidade(relacao);
                            setMemberNewIncapacidade(incapacidade?.toString() || '0');
                            setSelectedMemberForIncapacidade(relacao);
                            setIsMemberIncapacidadeModalOpen(true);
                          }}
                          title="Atualizar Incapacidade"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getTipoRelacaoBadge(relacao.tipo_relacao)} text-xs px-1.5 py-0`}>
                        {getTipoRelacaoLabel(relacao.tipo_relacao)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(relacao)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {agregado.length > 0 && (
            <div className="pt-4 mt-4 border-t">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Última Atualização do Agregado Familiar</label>
                <p className="text-xs">
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

      <Dialog 
        open={isModalOpen} 
        onOpenChange={(open) => {
          setIsModalOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro ao Agregado Familiar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Cliente *</Label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setClientFormMode('resumido');
                    setIsClientModalOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nova Entidade
                </Button>
              </div>
              <ClientCombobox
                clients={clientsForCombobox}
                value={selectedClienteId}
                onChange={(value) => setSelectedClienteId(value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Relação *</Label>
              <DynamicSelect
                categoria="tipo_relacao_familiar"
                value={tipoRelacao}
                onValueChange={(value) => setTipoRelacao(value as 'conjuge' | 'filho' | 'filha' | 'pai' | 'mae' | 'irmao' | 'irma')}
                placeholder="Selecionar..."
                fallbackOptions={[
                  { value: "conjuge", label: "Cônjuge" },
                  { value: "filho", label: "Filho(a)" },
                  { value: "pai", label: "Pai" },
                  { value: "mae", label: "Mãe" },
                  { value: "irmao", label: "Irmão/Irmã" },
                  { value: "outro", label: "Outro" },
                ]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsModalOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddRelacao();
              }} 
              disabled={!selectedClienteId || createRelacao.isPending}
            >
              {createRelacao.isPending ? 'A adicionar...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {clientFormMode === 'resumido' ? (
        <ClientModalResumido
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSuccess={handleClientCreated}
          onOpenFullForm={() => setClientFormMode('completo')}
        />
      ) : (
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSuccess={handleClientCreated}
        />
      )}

      {/* Modal de Atualização de Password */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Atualizar Password Finanças</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password Finanças</Label>
              <Input
                id="password"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova password"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={updatingPassword}
              className="w-full sm:w-auto order-3 sm:order-1"
            >
              Cancelar
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2 sm:ml-auto">
              <Button
                type="button"
                variant="default"
                onClick={async () => {
                  if (!clienteId || !clientePrincipal) {
                    toast({
                      title: 'Erro',
                      description: 'Cliente não encontrado.',
                      variant: 'destructive',
                    });
                    return;
                  }

                  const passwordAnterior = (clientePrincipal as any).senha_financas || 'Não definida';

                  setUpdatingPassword(true);
                  try {
                    await updateClient.mutateAsync({
                      id: clienteId.toString(),
                      senha_financas: newPassword,
                    });

                    // Registrar no histórico do IRS se disponível
                    if (irsId && onRegistrarHistorico) {
                      await onRegistrarHistorico(
                        'alteracao',
                        'senha_financas',
                        passwordAnterior ? '***' : '',
                        '***',
                        `Password Finanças do titular atualizada`
                      );
                    }

                    toast({
                      title: 'Sucesso',
                      description: 'Password Finanças do titular atualizada com sucesso.',
                    });
                    setIsPasswordModalOpen(false);
                    setNewPassword('');
                  } catch (error: any) {
                    toast({
                      title: 'Erro',
                      description: error.response?.data?.detail || 'Erro ao atualizar password.',
                      variant: 'destructive',
                    });
                  } finally {
                    setUpdatingPassword(false);
                  }
                }}
                disabled={updatingPassword}
                className="w-full sm:w-auto"
              >
                {updatingPassword ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Atualizar Só Titular
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Atualização de Incapacidade do Titular */}
      <Dialog open={isIncapacidadeModalOpen} onOpenChange={setIsIncapacidadeModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Atualizar Incapacidade do Titular</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="incapacidade">Incapacidade (%)</Label>
              <Input
                id="incapacidade"
                type="number"
                min="0"
                max="100"
                value={newIncapacidade}
                onChange={(e) => setNewIncapacidade(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsIncapacidadeModalOpen(false)}
              disabled={updatingIncapacidade}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!clienteId || !clientePrincipal) {
                  toast({
                    title: 'Erro',
                    description: 'Cliente não encontrado.',
                    variant: 'destructive',
                  });
                  return;
                }

                const incapacidadeAnterior = (clientePrincipal as any).incapacidade?.toString() || '0';

                setUpdatingIncapacidade(true);
                try {
                  await updateClient.mutateAsync({
                    id: clienteId.toString(),
                    incapacidade: newIncapacidade ? parseInt(newIncapacidade) : null,
                  });

                  // Registrar no histórico do IRS se disponível
                  if (irsId && onRegistrarHistorico) {
                    await onRegistrarHistorico(
                      'alteracao',
                      'incapacidade',
                      incapacidadeAnterior ? `${incapacidadeAnterior}%` : '0%',
                      newIncapacidade ? `${newIncapacidade}%` : '0%',
                      `Incapacidade do titular atualizada`
                    );
                  }

                  toast({
                    title: 'Sucesso',
                    description: 'Incapacidade do titular atualizada com sucesso.',
                  });
                  setIsIncapacidadeModalOpen(false);
                  setNewIncapacidade('0');
                } catch (error: any) {
                  toast({
                    title: 'Erro',
                    description: error.response?.data?.detail || 'Erro ao atualizar incapacidade.',
                    variant: 'destructive',
                  });
                } finally {
                  setUpdatingIncapacidade(false);
                }
              }}
              disabled={updatingIncapacidade}
            >
              {updatingIncapacidade ? 'A atualizar...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Atualização de Incapacidade dos Membros */}
      <Dialog open={isMemberIncapacidadeModalOpen} onOpenChange={setIsMemberIncapacidadeModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Atualizar Incapacidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedMemberForIncapacidade && (
              <div className="space-y-2">
                <Label>Membro</Label>
                <p className="text-sm font-medium">{getClienteNome(selectedMemberForIncapacidade)}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="member-incapacidade">Incapacidade (%)</Label>
              <Input
                id="member-incapacidade"
                type="number"
                min="0"
                max="100"
                value={memberNewIncapacidade}
                onChange={(e) => setMemberNewIncapacidade(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMemberIncapacidadeModalOpen(false)}
              disabled={updatingMemberIncapacidade}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!selectedMemberForIncapacidade) return;

                const membroId = selectedMemberForIncapacidade.cliente_relacionado_id;
                const nomeMembro = getClienteNome(selectedMemberForIncapacidade);
                const incapacidadeAnterior = getClienteIncapacidade(selectedMemberForIncapacidade)?.toString() || '0';

                setUpdatingMemberIncapacidade(true);
                try {
                  await updateClient.mutateAsync({
                    id: membroId.toString(),
                    incapacidade: memberNewIncapacidade ? parseInt(memberNewIncapacidade) : null,
                  });

                  // Registrar no histórico do IRS se disponível
                  if (irsId && onRegistrarHistorico) {
                    await onRegistrarHistorico(
                      'alteracao',
                      'incapacidade',
                      incapacidadeAnterior ? `${incapacidadeAnterior}%` : '0%',
                      memberNewIncapacidade ? `${memberNewIncapacidade}%` : '0%',
                      `Incapacidade de ${nomeMembro} atualizada`
                    );
                  }

                  toast({
                    title: 'Sucesso',
                    description: 'Incapacidade atualizada com sucesso.',
                  });
                  setIsMemberIncapacidadeModalOpen(false);
                  setSelectedMemberForIncapacidade(null);
                  setMemberNewIncapacidade('0');
                } catch (error: any) {
                  toast({
                    title: 'Erro',
                    description: error.response?.data?.detail || 'Erro ao atualizar incapacidade.',
                    variant: 'destructive',
                  });
                } finally {
                  setUpdatingMemberIncapacidade(false);
                }
              }}
              disabled={updatingMemberIncapacidade}
            >
              {updatingMemberIncapacidade ? 'A atualizar...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Atualização de Password dos Membros */}
      <Dialog open={isMemberPasswordModalOpen} onOpenChange={setIsMemberPasswordModalOpen}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Atualizar Password Finanças</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedMemberForPassword && (
              <div className="space-y-2">
                <Label>Membro</Label>
                <p className="text-sm font-medium">{getClienteNome(selectedMemberForPassword)}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="member-password">Password Finanças</Label>
              <Input
                id="member-password"
                type="text"
                value={memberNewPassword}
                onChange={(e) => setMemberNewPassword(e.target.value)}
                placeholder="Digite a nova password"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsMemberPasswordModalOpen(false);
                setSelectedMemberForPassword(null);
                setMemberNewPassword('');
              }}
              disabled={updatingMemberPassword}
              className="w-full sm:w-auto order-3 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={async () => {
                if (!selectedMemberForPassword) return;

                const membroId = selectedMemberForPassword.cliente_relacionado_id;
                const passwordAnterior = selectedMemberForPassword.cliente_relacionado?.senha_financas || 'Não definida';
                const nomeMembro = getClienteNome(selectedMemberForPassword);

                setUpdatingMemberPassword(true);
                try {
                  await updateClient.mutateAsync({
                    id: membroId.toString(),
                    senha_financas: memberNewPassword,
                  });

                  // Registrar no histórico do IRS se disponível
                  if (irsId && onRegistrarHistorico) {
                    await onRegistrarHistorico(
                      'alteracao',
                      'senha_financas',
                      passwordAnterior ? '***' : '',
                      '***',
                      `Password Finanças atualizada para ${nomeMembro}`
                    );
                  }

                  toast({
                    title: 'Sucesso',
                    description: `Password Finanças de ${nomeMembro} atualizada com sucesso.`,
                  });
                  setIsMemberPasswordModalOpen(false);
                  setSelectedMemberForPassword(null);
                  setMemberNewPassword('');
                } catch (error: any) {
                  toast({
                    title: 'Erro',
                    description: error.response?.data?.detail || 'Erro ao atualizar password.',
                    variant: 'destructive',
                  });
                } finally {
                  setUpdatingMemberPassword(false);
                }
              }}
              disabled={updatingMemberPassword}
              className="w-full sm:w-auto order-1 sm:order-2 sm:ml-auto"
            >
              {updatingMemberPassword ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Atualizar Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Atualização de Morada */}
      <Dialog open={isMoradaModalOpen} onOpenChange={setIsMoradaModalOpen}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>Atualizar Morada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="morada">Morada *</Label>
              <Input
                id="morada"
                value={newMorada.morada}
                onChange={(e) => setNewMorada(prev => ({ ...prev, morada: e.target.value }))}
                placeholder="Rua, número, andar"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo_postal">Código Postal</Label>
                <Input
                  id="codigo_postal"
                  value={newMorada.codigo_postal}
                  onChange={(e) => setNewMorada(prev => ({ ...prev, codigo_postal: e.target.value }))}
                  placeholder="0000-000"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="localidade">Freguesia</Label>
                <Input
                  id="localidade"
                  value={newMorada.localidade}
                  onChange={(e) => setNewMorada(prev => ({ ...prev, localidade: e.target.value }))}
                  placeholder="Freguesia"
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsMoradaModalOpen(false)}
              disabled={updatingMoradas}
              className="w-full sm:w-auto order-3 sm:order-1"
            >
              Cancelar
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2 sm:ml-auto">
              <Button
                type="button"
                variant="default"
                onClick={handleUpdateTitularMorada}
                disabled={updatingMoradas || !newMorada.morada.trim()}
                className="w-full sm:w-auto"
              >
                {updatingMoradas ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Atualizar Só Titular
              </Button>
              {agregado.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleUpdateAgregadoFamiliarMoradas}
                  disabled={updatingMoradas || !newMorada.morada.trim()}
                  className="w-full sm:w-auto"
                >
                  {updatingMoradas ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Atualizar Todos ({agregado.length + 1})
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
