import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Edit, FileText, CheckCircle, XCircle, Clock, ArrowLeftRight, Check, X, Trash2, Eye, AlertCircle, Filter } from 'lucide-react';
import { useIRS, IRS } from '@/hooks/useIRS';
import { IRSModal } from '@/components/modals/IRSModal';
import { IRSDetailsModal } from '@/components/modals/IRSDetailsModal';
import { ClickableClientName } from '@/components/ClickableClientName';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';

export const IRS: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selectedIRS, setSelectedIRS] = useState<IRS | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedIRSDetails, setSelectedIRSDetails] = useState<IRS | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [irsToMarkAsPaid, setIrsToMarkAsPaid] = useState<IRS | null>(null);
  const [confirmStep, setConfirmStep] = useState(1);
  const [filters, setFilters] = useState({
    estado: 'all',
    estadoEntrega: 'all',
    ano: 'all',
    showConcluidos: false,
  });
  
  const { irsList, isLoading, generateRecibo, updateIRS, deleteIRS } = useIRS(showAll ? undefined : true);
  const { clients } = useClients();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Calcular estatísticas
  const porPagarCount = irsList.filter((irs: IRS) => irs.estado === 'Por Pagar').length;
  const pagoCount = irsList.filter((irs: IRS) => irs.estado === 'Pago').length;
  const isentoCount = irsList.filter((irs: IRS) => irs.estado === 'Isento').length;

  // Obter anos únicos para filtro
  const anos = Array.from(new Set(irsList.map((irs: IRS) => irs.ano))).sort((a, b) => b - a);

  const filteredIRS = irsList.filter((irs: IRS) => {
    const clienteNome = irs.cliente?.nome?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || clienteNome.includes(searchLower);
    
    const matchesEstado = filters.estado === 'all' || irs.estado === filters.estado;
    
    const matchesEstadoEntrega = filters.estadoEntrega === 'all' || 
      (filters.estadoEntrega === 'sem' && !irs.estado_entrega) ||
      irs.estado_entrega === filters.estadoEntrega;
    
    const matchesAno = filters.ano === 'all' || irs.ano.toString() === filters.ano;
    
    // Mostra IRS concluídos (Pago com recibo) apenas se showConcluidos estiver ativo
    const isConcluido = irs.estado === 'Pago' && irs.numero_recibo;
    const matchesConcluidos = filters.showConcluidos || !isConcluido;
    
    return matchesSearch && matchesEstado && matchesEstadoEntrega && matchesAno && matchesConcluidos;
  });

  const getEstadoBadge = (estado: string, onClick?: () => void) => {
    if (estado === 'Pago') {
      return (
        <Badge 
          variant="default" 
          className={`bg-green-500 ${onClick ? "cursor-pointer hover:bg-green-600" : ""}`}
          onClick={onClick}
        >
          <CheckCircle className="w-3 h-3 mr-1" />Pago
        </Badge>
      );
    } else if (estado === 'Isento') {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Isento</Badge>;
    } else {
      return (
        <Badge 
          variant="outline" 
          className={onClick ? "cursor-pointer hover:bg-gray-100" : ""}
          onClick={onClick}
        >
          <Clock className="w-3 h-3 mr-1" />Por Pagar
        </Badge>
      );
    }
  };

  const getEstadoEntregaBadge = (estadoEntrega?: string) => {
    if (!estadoEntrega) return null;
    
    if (estadoEntrega === 'Enviado') {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Enviado</Badge>;
    } else if (estadoEntrega === 'Levantado Pelo Cliente') {
      return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Levantado Pelo Cliente</Badge>;
    } else if (estadoEntrega === 'Concluído') {
      return <Badge variant="default" className="bg-purple-500"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
    } else if (estadoEntrega === 'Verificado') {
      return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verificado</Badge>;
    } else if (estadoEntrega === 'Em Análise') {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Em Análise</Badge>;
    } else if (estadoEntrega === 'Contencioso Administrativo') {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800"><AlertCircle className="w-3 h-3 mr-1" />Contencioso Administrativo</Badge>;
    } else if (estadoEntrega === 'Aguarda Documentos') {
      return <Badge variant="outline" className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" />Aguarda Documentos</Badge>;
    }
    return <Badge variant="outline">{estadoEntrega}</Badge>;
  };

  const handleEdit = (irs: IRS) => {
    setSelectedIRS(irs);
    setIsModalOpen(true);
  };

  const handleViewDetails = (irs: IRS) => {
    setSelectedIRSDetails(irs);
    setIsDetailsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedIRS(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedIRS(null);
  };

  const handleGenerateRecibo = async (irs: IRS) => {
    await generateRecibo(irs.id);
  };

  const handleMarkAsPaid = (irs: IRS) => {
    setIrsToMarkAsPaid(irs);
    setConfirmStep(1);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmStep1 = () => {
    setConfirmStep(2);
  };

  const handleConfirmStep2 = async () => {
    if (!irsToMarkAsPaid) return;
    
    // Atualizar estado para Pago
    await updateIRS.mutateAsync({
      id: irsToMarkAsPaid.id,
      data: { estado: 'Pago' }
    });
    
    // Fechar modal de confirmação
    setIsConfirmModalOpen(false);
    setConfirmStep(1);
    
    // Criar o IRS atualizado com estado "Pago" para abrir o modal
    const irsWithPagoState: IRS = {
      ...irsToMarkAsPaid,
      estado: 'Pago' as const
    };
    
    setSelectedIRS(irsWithPagoState);
    setIsModalOpen(true);
    // O IRSModal vai receber initialStep=4 e abrir direto no step 4
    
    setIrsToMarkAsPaid(null);
  };

  const handleCancelConfirm = () => {
    setIsConfirmModalOpen(false);
    setConfirmStep(1);
    setIrsToMarkAsPaid(null);
  };

  const handleToggleEstado = async (irs: IRS) => {
    // Não permitir alterar de "Pago" para "Por Pagar" se já existe número de recibo
    if (irs.estado === 'Pago' && irs.numero_recibo) {
      return; // Não fazer nada se já tem recibo
    }
    
    // Toggle entre estados: Por Pagar <-> Pago
    // Outros estados (Isento, etc.) não mudam com toggle
    let novoEstado: 'Por Pagar' | 'Pago';
    if (irs.estado === 'Pago') {
      novoEstado = 'Por Pagar';
    } else if (irs.estado === 'Por Pagar') {
      novoEstado = 'Pago';
    } else {
      // Outros estados - não muda com toggle
      return;
    }
    
    await updateIRS.mutateAsync({
      id: irs.id,
      data: { estado: novoEstado }
    });
  };

  const handleDelete = async (irs: IRS) => {
    // Avisar se tiver recibo gerado
    let confirmMessage = 'Tem certeza que deseja eliminar este IRS?';
    if (irs.numero_recibo) {
      confirmMessage = `ATENÇÃO: Este IRS já tem um recibo gerado (${irs.numero_recibo}). Tem certeza que deseja eliminar?`;
    }
    
    if (confirm(confirmMessage)) {
      await deleteIRS.mutateAsync(irs.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const clearFilters = () => {
    setFilters({
      estado: 'all',
      estadoEntrega: 'all',
      ano: 'all',
      showConcluidos: false,
    });
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">IRS</h1>
          <p className="text-gray-600">Gestão de IRS</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Novo IRS
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => {
            setFilters({
              estado: 'Por Pagar',
              estadoEntrega: 'all',
              ano: 'all',
              showConcluidos: false,
            });
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5 text-yellow-600" />
              Por Pagar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {porPagarCount}
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => {
            setFilters({
              estado: 'Pago',
              estadoEntrega: 'all',
              ano: 'all',
              showConcluidos: false,
            });
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {pagoCount}
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => {
            setFilters({
              estado: 'Isento',
              estadoEntrega: 'all',
              ano: 'all',
              showConcluidos: false,
            });
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
              Isento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {isentoCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Pesquisa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filtros e Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Pesquisar por cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={filters.estado} onValueChange={(value) => setFilters(prev => ({ ...prev, estado: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Por Pagar">Por Pagar</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Isento">Isento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Estado de Entrega</label>
              <Select value={filters.estadoEntrega} onValueChange={(value) => setFilters(prev => ({ ...prev, estadoEntrega: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sem">Sem Estado</SelectItem>
                  <SelectItem value="Enviado">Enviado</SelectItem>
                  <SelectItem value="Levantado Pelo Cliente">Levantado Pelo Cliente</SelectItem>
                  <SelectItem value="Aguarda Documentos">Aguarda Documentos</SelectItem>
                  <SelectItem value="Contencioso Administrativo">Contencioso Administrativo</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Verificado">Verificado</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ano</label>
              <Select value={filters.ano} onValueChange={(value) => setFilters(prev => ({ ...prev, ano: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {anos.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="showConcluidos"
                checked={filters.showConcluidos}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showConcluidos: checked === true }))}
              />
              <label htmlFor="showConcluidos" className="text-sm font-medium cursor-pointer">
                Mostrar IRS concluídos (com recibo)
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de IRS</CardTitle>
          <CardDescription>
            Total de {filteredIRS.length} IRS encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº IRS</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIRS.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      Nenhum IRS encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIRS.map((irs: IRS) => (
                    <TableRow 
                      key={irs.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleViewDetails(irs)}
                    >
                      <TableCell className="font-medium font-mono">
                        {irs.numero_recibo || '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        <ClickableClientName 
                          clientId={irs.cliente_id} 
                          client={irs.cliente}
                          clientName={irs.cliente?.nome || `Cliente #${irs.cliente_id}`}
                        />
                      </TableCell>
                      <TableCell>{irs.ano}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {getEstadoBadge(
                            irs.estado,
                            !irs.numero_recibo && (irs.estado === 'Por Pagar' || irs.estado === 'Pago')
                              ? () => {
                                  if (irs.estado === 'Por Pagar') {
                                    handleMarkAsPaid(irs);
                                  } else if (irs.estado === 'Pago') {
                                    handleToggleEstado(irs);
                                  }
                                }
                              : undefined
                          )}
                          {/* Só mostrar botão para marcar como Pago se estiver Por Pagar e não tiver recibo */}
                          {!irs.numero_recibo && irs.estado === 'Por Pagar' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsPaid(irs);
                              }}
                              title="Marcar como Pago"
                            >
                              <Check className="w-4 h-4 text-green-500" />
                            </Button>
                          )}
                          {/* Só mostrar botão para marcar como Por Pagar se estiver Pago e não tiver recibo */}
                          {!irs.numero_recibo && irs.estado === 'Pago' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleEstado(irs);
                              }}
                              title="Marcar como Por Pagar"
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getEstadoEntregaBadge(irs.estado_entrega) || (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(irs)}
                            title="Ver Detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(irs)}
                            title="Editar IRS"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {irs.estado === 'Pago' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateRecibo(irs)}
                              title="Gerar Recibo"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(irs)}
                              title="Eliminar IRS"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <IRSModal
          irs={selectedIRS}
          clients={clients}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialStep={selectedIRS?.estado === 'Pago' && !selectedIRS?.numero_recibo ? 4 : undefined}
        />
      )}

      {/* Modal de Confirmação em Dois Passos */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmStep === 1 ? 'Confirmar Pagamento' : 'Confirmação Final'}
            </DialogTitle>
            <DialogDescription>
              {confirmStep === 1 
                ? 'Tem certeza que deseja marcar este IRS como Pago?'
                : 'Esta ação irá marcar o IRS como Pago e abrir o wizard do recibo. Deseja continuar?'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {irsToMarkAsPaid && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Cliente:</strong> {irsToMarkAsPaid.cliente?.nome || `Cliente #${irsToMarkAsPaid.cliente_id}`}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Ano:</strong> {irsToMarkAsPaid.ano}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Fase:</strong> {irsToMarkAsPaid.fase}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            {confirmStep === 1 ? (
              <>
                <Button variant="outline" onClick={handleCancelConfirm}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmStep1}>
                  Continuar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setConfirmStep(1)}>
                  Voltar
                </Button>
                <Button onClick={handleConfirmStep2}>
                  Confirmar e Abrir Recibo
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isDetailsModalOpen && selectedIRSDetails && (
        <IRSDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedIRSDetails(null);
          }}
          irs={selectedIRSDetails}
          onEdit={() => {
            setIsDetailsModalOpen(false);
            setSelectedIRSDetails(null);
            handleEdit(selectedIRSDetails);
          }}
          onGenerateRecibo={() => {
            handleGenerateRecibo(selectedIRSDetails);
          }}
        />
      )}
    </div>
  );
};

