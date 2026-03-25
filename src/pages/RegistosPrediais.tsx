/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Building, CheckCircle, XCircle, AlertTriangle, Clock, Edit, Trash2, Eye, Archive, X, FileDown, Calendar, CalendarDays } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useRegistosPrediais, RegistoPredial } from '@/hooks/useRegistosPrediais';
import { useClients } from '@/hooks/useClients';
import { RegistoPredialModal } from '@/components/modals/RegistoPredialModal';
import { RegistoPredialDetailsModal } from '@/components/modals/RegistoPredialDetailsModal';
import { ClickableClientName } from '@/components/ClickableClientName';
import { usePermissions } from '@/hooks/usePermissions';
import { normalizeString } from '@/lib/utils';
import api from '@/services/api';
import { CardListSkeleton } from '@/components/ui/card-skeleton';

export const RegistosPrediais: React.FC = () => {
  const { canCreate, canEdit } = usePermissions();
  const { registos, isLoading, deleteRegisto, updateRegisto } = useRegistosPrediais();
  const { clients } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string | null>(null);
  const [showConcluidos, setShowConcluidos] = useState(false);
  const [selectedRegisto, setSelectedRegisto] = useState<RegistoPredial | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRegistoDetails, setSelectedRegistoDetails] = useState<RegistoPredial | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const safe = (v: any) => (v ? v.toString().toLowerCase() : '');
  const clientNameById = (id: any) => {
    if (!id) return '';
    const match = clients.find((c: any) => c.id?.toString() === id.toString());
    return match?.nome || match?.nome_empresa || '';
  };
  const filteredRegistos = registos.filter((registo: any) => {
    const searchNormalized = normalizeString(searchTerm);
    const matchesSearch = normalizeString(safe(registo.numero_processo)).includes(searchNormalized) ||
      normalizeString(safe(registo.predio)).includes(searchNormalized) ||
      normalizeString(safe(registo.freguesia)).includes(searchNormalized) ||
      normalizeString(safe(registo.cliente?.nome)).includes(searchNormalized);
    
    const matchesEstado = !filterEstado || registo.estado_key === filterEstado;
    
    // Por padrão, esconder concluídos (a menos que showConcluidos seja true ou filterEstado seja 'concluido')
    const isConcluido = registo.estado_key === 'concluido';
    const shouldShowConcluido = showConcluidos || filterEstado === 'concluido';
    if (isConcluido && !shouldShowConcluido) {
      return false;
    }
    
    return matchesSearch && matchesEstado;
  });

  // ordenar por data (mais recente primeiro)
  const sortedRegistos = [...filteredRegistos].sort((a: any, b: any) => {
    const da = a?.data ? new Date(a.data).getTime() : 0;
    const db = b?.data ? new Date(b.data).getTime() : 0;
    return db - da;
  });

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'concluido':
        return 'bg-green-100 text-green-800';
      case 'desistencia':
        return 'bg-yellow-100 text-yellow-800';
      case 'recusado':
        return 'bg-red-100 text-red-800';
      case 'em_registo':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCardBgColor = (estado: string) => {
    switch (estado) {
      case 'concluido':
        return 'border-green-200 bg-green-50';
      case 'desistencia':
        return 'border-yellow-200 bg-yellow-50';
      case 'recusado':
        return 'border-red-200 bg-red-50';
      case 'em_registo':
        return 'border-blue-200 bg-blue-50';
      default:
        return '';
    }
  };

  const getStatusLabel = (estado: string) => {
    switch (estado) {
      case 'concluido':
        return 'Concluído';
      case 'desistencia':
        return 'Desistência';
      case 'recusado':
        return 'Recusado';
      case 'em_registo':
        return 'Em Registo';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'concluido':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'desistencia':
        return <XCircle className="h-4 w-4 text-yellow-600" />;
      case 'recusado':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'em_registo':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSelectEstadoClasses = (estado: string) => {
    switch (estado) {
      case 'concluido':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'desistencia':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'recusado':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'em_registo':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleChangeEstado = async (registo: RegistoPredial, novoEstado: string) => {
    const estadoLabel: Record<string, string> = {
      concluido: 'Concluído',
      desistencia: 'Desistência',
      recusado: 'Recusado',
      em_registo: 'Em Registo',
    };
    await updateRegisto.mutateAsync({
      id: registo.id,
      estado: estadoLabel[novoEstado] || novoEstado,
    });
  };

  const handleView = (registo: RegistoPredial) => {
    setSelectedRegistoDetails(registo);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (registo: RegistoPredial) => {
    setSelectedRegisto(registo);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registo predial?')) {
      await deleteRegisto.mutateAsync(id);
    }
  };

  const handleMarkAsConcluido = async (registo: RegistoPredial) => {
    if (confirm('Tem certeza que deseja marcar este registo como concluído?')) {
      await updateRegisto.mutateAsync({
        id: registo.id,
        estado: 'Concluído'
      });
    }
  };

  const handleCloseModal = () => {
    setSelectedRegisto(null);
    setIsModalOpen(false);
  };

  const handleCloseDetailsModal = () => {
    setSelectedRegistoDetails(null);
    setIsDetailsModalOpen(false);
  };

  const handleExport = async (periodo: 'dia' | 'semana', formato: 'pdf' | 'csv') => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const endpoint = formato === 'pdf' ? '/registos/exportar-pdf' : '/registos/exportar-csv';
      const response = await api.get(endpoint, {
        params: { periodo, data_ref: hoje },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      const ext = formato === 'pdf' ? 'pdf' : 'csv';
      link.setAttribute('download', `registos_prediais_${periodo}_${hoje}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      console.error('Erro ao exportar relatório');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardListSkeleton count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registos Prediais</h1>
          <p className="text-gray-600">Gerencie os registos prediais</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Relatório do Dia</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport('dia', 'pdf')}>
                <Calendar className="mr-2 h-4 w-4" />
                PDF do Dia
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('dia', 'csv')}>
                <Calendar className="mr-2 h-4 w-4" />
                CSV do Dia
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Relatório da Semana</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport('semana', 'pdf')}>
                <CalendarDays className="mr-2 h-4 w-4" />
                PDF da Semana
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('semana', 'csv')}>
                <CalendarDays className="mr-2 h-4 w-4" />
                CSV da Semana
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canCreate("registos_prediais") && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Registo
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas + Filtros e Pesquisa (zona comprimida) */}
      <Card className="overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4">
            <button
              type="button"
              onClick={() => {
                if (filterEstado === 'concluido') {
                  setFilterEstado(null);
                  setShowConcluidos(false);
                } else {
                  setFilterEstado('concluido');
                  setShowConcluidos(true);
                }
              }}
              className={`flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow ${filterEstado === 'concluido' ? 'ring-2 ring-green-500' : ''}`}
            >
              <span className="text-xs sm:text-sm font-medium text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Concluídos
              </span>
              <span className="text-lg font-bold text-green-600">
                {registos.filter((r: any) => r.estado_key === 'concluido').length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilterEstado(filterEstado === 'em_registo' ? null : 'em_registo')}
              className={`flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow ${filterEstado === 'em_registo' ? 'ring-2 ring-blue-500' : ''}`}
            >
              <span className="text-xs sm:text-sm font-medium text-blue-600 flex items-center gap-1">
                <Clock className="h-4 w-4 shrink-0" />
                Em Registo
              </span>
              <span className="text-lg font-bold text-blue-600">
                {registos.filter((r: any) => r.estado_key === 'em_registo').length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilterEstado(filterEstado === 'recusado' ? null : 'recusado')}
              className={`flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow ${filterEstado === 'recusado' ? 'ring-2 ring-red-500' : ''}`}
            >
              <span className="text-xs sm:text-sm font-medium text-red-600 flex items-center gap-1">
                <XCircle className="h-4 w-4 shrink-0" />
                Recusados
              </span>
              <span className="text-lg font-bold text-red-600">
                {registos.filter((r: any) => r.estado_key === 'recusado').length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setFilterEstado(filterEstado === 'desistencia' ? null : 'desistencia')}
              className={`flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow ${filterEstado === 'desistencia' ? 'ring-2 ring-yellow-500' : ''}`}
            >
              <span className="text-xs sm:text-sm font-medium text-yellow-600 flex items-center gap-1">
                <XCircle className="h-4 w-4 shrink-0" />
                Desistências
              </span>
              <span className="text-lg font-bold text-yellow-600">
                {registos.filter((r: any) => r.estado_key === 'desistencia').length}
              </span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <Input
                placeholder="Buscar registos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterEstado(null);
                setShowConcluidos(false);
              }}
              className="shrink-0 h-9"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Limpar
            </Button>
            <Button
              variant={showConcluidos ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowConcluidos(!showConcluidos)}
              className="shrink-0 h-9"
            >
              <Archive className="mr-1.5 h-3.5 w-3.5" />
              {showConcluidos ? 'Ocultar Concluídos' : 'Mostrar Concluídos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Registos Prediais</CardTitle>
          <CardDescription>
            {filteredRegistos.length === 0
              ? 'Nenhum registo encontrado'
              : `${filteredRegistos.length} registo${filteredRegistos.length !== 1 ? 's' : ''} encontrado${filteredRegistos.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedRegistos.map((registo: any) => (
              <Card
                key={registo.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${getCardBgColor(registo.estado_key)}`}
                onClick={() => handleView(registo)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(registo.estado_key)}
                        <h3 className="font-semibold text-sm">
                          {registo.numero_processo} -{' '}
                          <ClickableClientName
                            clientId={registo.cliente_id}
                            client={registo.cliente}
                            clientName={registo.cliente?.nome || clientNameById(registo.cliente_id) || 'N/A'}
                          />
                        </h3>
                      </div>

                      {/* Prédios */}
                      {registo.predios && registo.predios.length > 0 ? (
                        <div className="mb-1.5 space-y-0.5">
                          {registo.predios.map((p: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <Building className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span>{p.predio}{p.freguesia ? ` - ${p.freguesia}` : ''}</span>
                              {p.codigo_certidao_permanente && (
                                <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{p.codigo_certidao_permanente}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 mb-1.5">
                          <Building className="h-3.5 w-3.5 text-gray-400 inline mr-1" />
                          {registo.predio}{registo.freguesia ? ` - ${registo.freguesia}` : ''}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                        <span><strong>Registo:</strong> {registo.registo}</span>
                        <span><strong>Conservatória:</strong> {registo.conservatoria}</span>
                        <span><strong>Facto de Registo:</strong> {registo.requisicao}</span>
                        <span><strong>Apresentação:</strong> {registo.apresentacao}</span>
                        <span><strong>Data:</strong> {new Date(registo.data).toLocaleDateString('pt-PT')}</span>
                        {registo.apresentacao_complementar && (
                          <span><strong>Apresentação Complementar:</strong> {registo.apresentacao_complementar}</span>
                        )}
                        {registo.outras_observacoes && (
                          <span><strong>Observações:</strong> {registo.outras_observacoes}</span>
                        )}
                      </div>
                    </div>

                    {/* Right column */}
                    <div className="shrink-0 flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* Estado select */}
                      <Select
                        value={registo.estado_key || 'em_registo'}
                        onValueChange={(val) => handleChangeEstado(registo, val)}
                      >
                        <SelectTrigger className={`h-7 w-[130px] rounded-full border-2 text-xs font-medium ${getSelectEstadoClasses(registo.estado_key)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="em_registo">Em Registo</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="recusado">Recusado</SelectItem>
                          <SelectItem value="desistencia">Desistência</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleView(registo)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {canEdit("registos_prediais") && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleEdit(registo)}
                              title="Editar"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(registo.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <RegistoPredialModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        registo={selectedRegisto}
      />

      <RegistoPredialDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        registo={selectedRegistoDetails}
      />
    </div>
  );
};