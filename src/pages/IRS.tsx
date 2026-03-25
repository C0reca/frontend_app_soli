import React, { useState, useEffect } from 'react';
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
import { TaskModal } from '@/components/modals/TaskModal';
import { ClickableClientName } from '@/components/ClickableClientName';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { normalizeString } from '@/lib/utils';
import { TableSkeleton } from '@/components/ui/card-skeleton';

export const IRS: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selectedIRS, setSelectedIRS] = useState<IRS | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedIRSDetails, setSelectedIRSDetails] = useState<IRS | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [irsToMarkAsPaid, setIrsToMarkAsPaid] = useState<IRS | null>(null);
  const [openDetailsInReciboTab, setOpenDetailsInReciboTab] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskInitialData, setTaskInitialData] = useState<any>(null);
  const [filters, setFilters] = useState({
    estado: 'all',
    estadoEntrega: 'all',
    ano: 'all',
    showConcluidos: true, // Por padrão mostrar todos os IRS, incluindo concluídos
  });
  
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<{ field: string; value: string } | null>(null);

  // Sempre buscar todos os IRS, filtrar no frontend
  const { irsList, isLoading, generateRecibo, updateIRS, deleteIRS, bulkUpdateIRS } = useIRS(undefined);
  const { clients } = useClients();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { canCreate, canEdit } = usePermissions();

  // Calcular estatísticas
  const porPagarCount = irsList.filter((irs: IRS) => irs.estado === 'Por Pagar').length;
  
  // Estatísticas de Estado de Entrega
  const enviadoCount = irsList.filter((irs: IRS) => irs.estado_entrega === 'Enviado').length;
  const levantadoCount = irsList.filter((irs: IRS) => irs.estado_entrega === 'Levantado Pelo Cliente').length;
  const aguardaDocCount = irsList.filter((irs: IRS) => irs.estado_entrega === 'Aguarda Documentos').length;
  const contenciosoCount = irsList.filter((irs: IRS) => irs.estado_entrega === 'Contencioso Administrativo').length;
  const emAnaliseCount = irsList.filter((irs: IRS) => irs.estado_entrega === 'Em Análise').length;
  const verificadoCount = irsList.filter((irs: IRS) => irs.estado_entrega === 'Verificado').length;
  const concluidoCount = irsList.filter((irs: IRS) => irs.estado_entrega === 'Concluído').length;

  // Obter anos únicos para filtro
  const anos = Array.from(new Set(irsList.map((irs: IRS) => irs.ano))).sort((a, b) => b - a);

  const filteredIRS = irsList.filter((irs: IRS) => {
    const clienteNome = irs.cliente?.nome || '';
    const searchNormalized = normalizeString(searchTerm);
    const matchesSearch = searchTerm === '' || normalizeString(clienteNome).includes(searchNormalized);
    
    const matchesEstado = filters.estado === 'all' || irs.estado === filters.estado;
    
    const matchesEstadoEntrega = filters.estadoEntrega === 'all' || 
      (filters.estadoEntrega === 'sem' && !irs.estado_entrega) ||
      irs.estado_entrega === filters.estadoEntrega;
    
    const matchesAno = filters.ano === 'all' || irs.ano.toString() === filters.ano;
    
    // Por padrão mostrar todos os IRS (incluindo concluídos)
    // O filtro showConcluidos permite esconder os concluídos se desejado
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

  // Função para obter classes de cor do estado de pagamento
  const getEstadoPagamentoClasses = (estado: string) => {
    if (estado === 'Pago') {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (estado === 'Isento') {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    } else {
      return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  // Função para obter classes de cor do estado de entrega
  const getEstadoEntregaClasses = (estadoEntrega?: string) => {
    if (!estadoEntrega || estadoEntrega === 'none') {
      return 'bg-gray-100 text-gray-800 border-gray-300';
    }
    if (estadoEntrega === 'Enviado') {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (estadoEntrega === 'Levantado Pelo Cliente') {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (estadoEntrega === 'Concluído') {
      return 'bg-purple-100 text-purple-800 border-purple-300';
    } else if (estadoEntrega === 'Verificado') {
      return 'bg-green-100 text-green-800 border-green-300';
    } else if (estadoEntrega === 'Em Análise') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    } else if (estadoEntrega === 'Contencioso Administrativo') {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    } else if (estadoEntrega === 'Aguarda Documentos') {
      return 'bg-amber-100 text-amber-800 border-amber-300';
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
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
    setIsConfirmModalOpen(true);
  };

  const handleConfirmPaid = async () => {
    if (!irsToMarkAsPaid) return;

    await updateIRS.mutateAsync({
      id: irsToMarkAsPaid.id,
      data: { estado: 'Pago' }
    });

    setIsConfirmModalOpen(false);

    const irsWithPagoState: IRS = {
      ...irsToMarkAsPaid,
      estado: 'Pago' as const
    };

    setOpenDetailsInReciboTab(true);
    setSelectedIRSDetails(irsWithPagoState);
    setIsDetailsModalOpen(true);

    setIrsToMarkAsPaid(null);
  };

  const handleCancelConfirm = () => {
    setIsConfirmModalOpen(false);
    setIrsToMarkAsPaid(null);
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredIRS.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIRS.map((irs: IRS) => irs.id)));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) return;
    const payload: any = { ids: Array.from(selectedIds) };
    if (bulkAction.field === 'estado') payload.estado = bulkAction.value;
    else payload.estado_entrega = bulkAction.value;
    await bulkUpdateIRS.mutateAsync(payload);
    setSelectedIds(new Set());
    setIsBulkModalOpen(false);
    setBulkAction(null);
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
      <div className="space-y-6">
        <TableSkeleton rows={8} cols={6} />
      </div>
    );
  }

  const clearFilters = () => {
    setFilters({
      estado: 'all',
      estadoEntrega: 'all',
      ano: 'all',
      showConcluidos: true, // Por padrão mostrar todos os IRS
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
        {canCreate("irs") && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Novo IRS
          </Button>
        )}
      </div>

      {/* Estatísticas + Filtros e Pesquisa (zona comprimida) */}
      <Card className="overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
            <button
              type="button"
              onClick={() => setFilters({ estado: 'Por Pagar', estadoEntrega: 'all', ano: 'all', showConcluidos: true })}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow"
            >
              <span className="text-xs sm:text-sm font-medium text-yellow-600 flex items-center gap-1">
                <Clock className="h-4 w-4 shrink-0" />
                Por Pagar
              </span>
              <span className="text-lg font-bold text-yellow-600">{porPagarCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilters({ estado: 'all', estadoEntrega: 'Enviado', ano: 'all', showConcluidos: true })}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow"
            >
              <span className="text-xs sm:text-sm font-medium text-blue-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Enviado
              </span>
              <span className="text-lg font-bold text-blue-600">{enviadoCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilters({ estado: 'all', estadoEntrega: 'Concluído', ano: 'all', showConcluidos: true })}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow"
            >
              <span className="text-xs sm:text-sm font-medium text-purple-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Concluído
              </span>
              <span className="text-lg font-bold text-purple-600">{concluidoCount}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <Input
                placeholder="Pesquisar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters} className="shrink-0 h-9">
              <X className="mr-1.5 h-3.5 w-3.5" />
              Limpar
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={filters.estado} onValueChange={(value) => setFilters(prev => ({ ...prev, estado: value }))}>
                <SelectTrigger className="w-[110px] h-8 text-xs">
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
            <Select value={filters.estadoEntrega} onValueChange={(value) => setFilters(prev => ({ ...prev, estadoEntrega: value }))}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Estado Entrega" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sem">Sem Estado</SelectItem>
                <SelectItem value="Enviado">Enviado</SelectItem>
                <SelectItem value="Levantado Pelo Cliente">Levantado</SelectItem>
                <SelectItem value="Aguarda Documentos">Aguarda Doc.</SelectItem>
                <SelectItem value="Contencioso Administrativo">Contencioso</SelectItem>
                <SelectItem value="Em Análise">Em Análise</SelectItem>
                <SelectItem value="Verificado">Verificado</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.ano} onValueChange={(value) => setFilters(prev => ({ ...prev, ano: value }))}>
              <SelectTrigger className="w-[90px] h-8 text-xs">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {anos.map(ano => (
                  <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Checkbox
                id="showConcluidos"
                checked={filters.showConcluidos}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showConcluidos: checked === true }))}
              />
              <label htmlFor="showConcluidos" className="cursor-pointer text-xs">Mostrar concluídos</label>
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
          {/* Barra de ações em massa */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-700">
                {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  setBulkAction({ field: 'estado', value: 'Pago' });
                  setIsBulkModalOpen(true);
                }}
              >
                <CheckCircle className="w-3 h-3 mr-1" />Marcar Pago
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  setBulkAction({ field: 'estado_entrega', value: 'Concluído' });
                  setIsBulkModalOpen(true);
                }}
              >
                <Check className="w-3 h-3 mr-1" />Marcar Concluído
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  setBulkAction({ field: 'estado_entrega', value: 'Enviado' });
                  setIsBulkModalOpen(true);
                }}
              >
                Marcar Enviado
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs ml-auto"
                onClick={() => setSelectedIds(new Set())}
              >
                <X className="w-3 h-3 mr-1" />Limpar
              </Button>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredIRS.length > 0 && selectedIds.size === filteredIRS.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
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
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      Nenhum IRS encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIRS.map((irs: IRS) => (
                    <TableRow
                      key={irs.id}
                      className={`cursor-pointer ${
                        selectedIds.has(irs.id) ? 'bg-blue-50' :
                        irs.estado === 'Pago' ? 'bg-green-50 hover:bg-green-100' :
                        irs.estado === 'Isento' ? 'bg-gray-50 hover:bg-gray-100' :
                        'bg-yellow-50 hover:bg-yellow-100'
                      }`}
                      onClick={() => handleViewDetails(irs)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(irs.id)}
                          onCheckedChange={() => handleToggleSelect(irs.id)}
                        />
                      </TableCell>
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
                          <Select
                            value={irs.estado}
                            onValueChange={async (value) => {
                              const novoEstado = value as 'Por Pagar' | 'Pago' | 'Isento';
                              if (novoEstado !== irs.estado) {
                                if (novoEstado === 'Pago') {
                                  // Usar o mesmo fluxo de confirmação
                                  handleMarkAsPaid(irs);
                                } else {
                                  await updateIRS.mutateAsync({
                                    id: irs.id,
                                    data: { estado: novoEstado }
                                  });
                                }
                              }
                            }}
                            disabled={irs.estado === 'Pago' && !!irs.numero_recibo}
                          >
                            <SelectTrigger className={`h-8 w-[120px] rounded-full border-2 ${getEstadoPagamentoClasses(irs.estado)}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Por Pagar">Por Pagar</SelectItem>
                              <SelectItem value="Pago">Pago</SelectItem>
                              <SelectItem value="Isento">Isento</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={irs.estado_entrega || 'none'}
                            onValueChange={async (value) => {
                              if (value !== (irs.estado_entrega || 'none')) {
                                await updateIRS.mutateAsync({
                                  id: irs.id,
                                  data: { estado_entrega: value === 'none' ? undefined : value }
                                });
                              }
                            }}
                          >
                            <SelectTrigger className={`h-8 w-[180px] rounded-full border-2 ${getEstadoEntregaClasses(irs.estado_entrega)} [&>span]:text-left [&>span]:block [&>span]:truncate`}>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não definido</SelectItem>
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
          onCreateTask={async (irsData) => {
            // Buscar dados completos do cliente
            let clienteNome = '';
            try {
              const clienteResponse = await api.get(`/clientes/${irsData.cliente_id}`);
              const cliente = clienteResponse.data;
              const tipo = cliente.tipo || 'singular';
              clienteNome = tipo === 'singular' 
                ? cliente.nome 
                : cliente.nome_empresa;
              
              // Se ainda não tiver nome, tentar buscar da lista de clientes
              if (!clienteNome) {
                const clienteNaLista = clients.find(c => c.id === irsData.cliente_id);
                if (clienteNaLista) {
                  const tipoLista = clienteNaLista.tipo || 'singular';
                  clienteNome = tipoLista === 'singular'
                    ? (clienteNaLista as any).nome
                    : (clienteNaLista as any).nome_empresa;
                }
              }
            } catch (error) {
              console.error('Erro ao buscar dados do cliente:', error);
              // Tentar buscar da lista de clientes como fallback
              const clienteNaLista = clients.find(c => c.id === irsData.cliente_id);
              if (clienteNaLista) {
                const tipo = clienteNaLista.tipo || 'singular';
                clienteNome = tipo === 'singular'
                  ? (clienteNaLista as any).nome
                  : (clienteNaLista as any).nome_empresa;
              }
            }
            
            // Preparar dados iniciais da tarefa baseados no IRS
            const numeroIRS = irsData.numero_recibo || `#${irsData.id}`;
            setTaskInitialData({
              titulo: clienteNome 
                ? `IRS ${irsData.ano} - Nº ${numeroIRS} - ${clienteNome}`
                : `IRS ${irsData.ano} - Nº ${numeroIRS}`,
              descricao: clienteNome
                ? `Tarefa relacionada com o IRS ${irsData.ano}, Fase ${irsData.fase} do cliente ${clienteNome}.`
                : `Tarefa relacionada com o IRS ${irsData.ano}, Fase ${irsData.fase}.`,
            });
            setIsTaskModalOpen(true);
            handleCloseModal();
          }}
        />
      )}

      {isTaskModalOpen && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setTaskInitialData(null);
          }}
          initialData={taskInitialData}
        />
      )}

      {/* Modal de Confirmação de Pagamento */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Marcar este IRS como Pago e abrir o wizard do recibo?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {irsToMarkAsPaid && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Cliente:</strong> {irsToMarkAsPaid.cliente?.nome || `Cliente #${irsToMarkAsPaid.cliente_id}`}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Ano:</strong> {irsToMarkAsPaid.ano} &bull; <strong>Fase:</strong> {irsToMarkAsPaid.fase}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelConfirm}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmPaid}>
              Confirmar e Abrir Recibo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Ação em Massa */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ação em Massa</DialogTitle>
            <DialogDescription>
              {bulkAction?.field === 'estado'
                ? `Marcar ${selectedIds.size} IRS como "${bulkAction?.value}"?`
                : `Alterar estado de entrega de ${selectedIds.size} IRS para "${bulkAction?.value}"?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsBulkModalOpen(false); setBulkAction(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleBulkAction} disabled={bulkUpdateIRS.isPending}>
              {bulkUpdateIRS.isPending ? 'A atualizar...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <IRSDetailsModal
        isOpen={isDetailsModalOpen && !!selectedIRSDetails}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedIRSDetails(null);
          setOpenDetailsInReciboTab(false);
        }}
        irs={selectedIRSDetails}
        onEdit={() => {
          setIsDetailsModalOpen(false);
          const irs = selectedIRSDetails;
          setSelectedIRSDetails(null);
          setOpenDetailsInReciboTab(false);
          if (irs) handleEdit(irs);
        }}
        onGenerateRecibo={() => {
          if (selectedIRSDetails) handleGenerateRecibo(selectedIRSDetails);
        }}
        onOpenReciboWizard={(irs) => {
          setIsDetailsModalOpen(false);
          setSelectedIRSDetails(null);
          setOpenDetailsInReciboTab(false);
          const irsWithPagoState: IRS = {
            ...irs,
            estado: 'Pago' as const
          };
          setSelectedIRS(irsWithPagoState);
          setIsModalOpen(true);
        }}
        initialTab={openDetailsInReciboTab && selectedIRSDetails?.estado === 'Pago' ? 'recibo' : undefined}
      />
    </div>
  );
};

