/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus, Search, Car, Eye, Edit, Trash2, X, Calendar, Lock, CheckCircle, Clock,
  ChevronLeft, ChevronRight, List, FileDown, CalendarDays,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRegistosAutomoveis, RegistoAutomovel } from '@/hooks/useRegistosAutomoveis';
import { useStandSemanas, StandSemana } from '@/hooks/useStandSemanas';
import { useClients } from '@/hooks/useClients';
import { RegistoAutomovelModal } from '@/components/modals/RegistoAutomovelModal';
import { RegistoAutomovelDetailsModal } from '@/components/modals/RegistoAutomovelDetailsModal';
import { StandSemanaModal } from '@/components/modals/StandSemanaModal';
import { ClickableClientName } from '@/components/ClickableClientName';
import { usePermissions } from '@/hooks/usePermissions';
import { normalizeString } from '@/lib/utils';
import api from '@/services/api';

// Helper: get Monday of a given date's week
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDatePT(d?: string): string {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('pt-PT'); } catch { return d; }
}

export const RegistosAutomoveis: React.FC = () => {
  const { canCreate, canEdit } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterPagamento, setFilterPagamento] = useState<string>('todos');

  // Date navigation for daily/weekly tabs
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(getMonday(new Date()));

  const { registos, isLoading, deleteRegisto, changeEstado } = useRegistosAutomoveis();
  const { semanas, isLoading: isLoadingSemanas, fecharSemana, deleteSemana } = useStandSemanas();
  const { clients } = useClients();

  // Daily registos query
  const dailyDateStr = formatDateISO(selectedDate);
  const { registos: registosDia, isLoading: isLoadingDia } = useRegistosAutomoveis({
    data_inicio: dailyDateStr,
    data_fim: dailyDateStr,
  });

  // Weekly registos query
  const weekEnd = new Date(selectedWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const { registos: registosSemana, isLoading: isLoadingSemana } = useRegistosAutomoveis({
    data_inicio: formatDateISO(selectedWeekStart),
    data_fim: formatDateISO(weekEnd),
  });

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRegisto, setSelectedRegisto] = useState<RegistoAutomovel | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<RegistoAutomovel | null>(null);
  const [isSemanaOpen, setIsSemanaOpen] = useState(false);
  const [selectedSemana, setSelectedSemana] = useState<StandSemana | null>(null);

  // Filtrar registos (all tab)
  const filteredRegistos = registos.filter((r: RegistoAutomovel) => {
    const searchN = normalizeString(searchTerm);
    const matchesSearch = !searchTerm ||
      normalizeString(r.matricula || '').includes(searchN) ||
      normalizeString(r.marca || '').includes(searchN) ||
      normalizeString(r.sa_nome || '').includes(searchN) ||
      normalizeString(r.sp_nome || '').includes(searchN) ||
      normalizeString(r.entidade?.nome || '').includes(searchN) ||
      normalizeString(r.numero_pedido || '').includes(searchN);
    const matchesTipo = filterTipo === 'todos' || r.tipo === filterTipo;
    const matchesPagamento = filterPagamento === 'todos' || r.estado_pagamento === filterPagamento;
    return matchesSearch && matchesTipo && matchesPagamento;
  });

  // Group registos by stand
  const groupByStand = (list: RegistoAutomovel[]) => {
    const groups: Record<string, { standId: number | null; standName: string; registos: RegistoAutomovel[] }> = {};
    const particulares: RegistoAutomovel[] = [];

    for (const r of list) {
      if (r.tipo === 'stand' && r.entidade) {
        const key = `stand-${r.entidade.id}`;
        if (!groups[key]) {
          groups[key] = { standId: r.entidade.id, standName: r.entidade.nome, registos: [] };
        }
        groups[key].registos.push(r);
      } else {
        particulares.push(r);
      }
    }

    return { standGroups: Object.values(groups), particulares };
  };

  const diaGrouped = useMemo(() => groupByStand(registosDia), [registosDia]);
  const semanaGrouped = useMemo(() => groupByStand(registosSemana), [registosSemana]);

  const handleView = (r: RegistoAutomovel) => {
    setSelectedDetails(r);
    setIsDetailsOpen(true);
  };

  const handleEdit = (r: RegistoAutomovel) => {
    setSelectedRegisto(r);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja eliminar este registo automóvel?')) {
      await deleteRegisto.mutateAsync(id);
    }
  };

  const handleCloseModal = () => {
    setSelectedRegisto(null);
    setIsModalOpen(false);
  };

  const handleExport = async (periodo: 'dia' | 'semana', formato: 'pdf' | 'csv', dataRef?: Date) => {
    try {
      const refDate = dataRef || new Date();
      const refStr = formatDateISO(refDate);
      const endpoint = formato === 'pdf' ? '/registos-automoveis/exportar-pdf' : '/registos-automoveis/exportar-csv';
      const response = await api.get(endpoint, {
        params: { periodo, data_ref: refStr },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      const ext = formato === 'pdf' ? 'pdf' : 'csv';
      link.setAttribute('download', `registos_automoveis_${periodo}_${refStr}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      console.error('Erro ao exportar relatório');
    }
  };

  const getEstadoClasses = (estado?: string) => {
    switch (estado) {
      case 'em_curso':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'concluido':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'recusado':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  // Stats
  const totalRegistos = registos.length;
  const totalParticular = registos.filter((r: any) => r.tipo === 'particular').length;
  const totalStand = registos.filter((r: any) => r.tipo === 'stand').length;
  const totalPendente = registos.filter((r: any) => r.estado_pagamento === 'pendente').length;
  const totalPago = registos.filter((r: any) => r.estado_pagamento === 'pago').length;

  // Navigation helpers
  const navigateDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
  };

  const navigateWeek = (offset: number) => {
    const d = new Date(selectedWeekStart);
    d.setDate(d.getDate() + (offset * 7));
    setSelectedWeekStart(d);
  };

  const isToday = formatDateISO(selectedDate) === formatDateISO(new Date());
  const isThisWeek = formatDateISO(selectedWeekStart) === formatDateISO(getMonday(new Date()));

  // Shared registo card renderer
  const RegistoCard = ({ r }: { r: RegistoAutomovel }) => (
    <Card
      key={r.id}
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleView(r)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-1.5 mb-1">
              <Car className="h-3.5 w-3.5 text-gray-400" />
              <h3 className="font-semibold text-sm">
                {r.matricula || 'Sem matrícula'}
                {r.marca && ` - ${r.marca}`}
              </h3>
              <Badge variant="outline" className="text-xs">
                {r.tipo === 'stand' ? 'Stand' : 'Particular'}
              </Badge>
              {r.tipo === 'stand' && r.entidade && (
                <span className="text-xs font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                  {r.entidade.nome}
                </span>
              )}
              <div onClick={(e) => e.stopPropagation()}>
                <Select
                  value={r.estado || 'pendente'}
                  onValueChange={(val) => changeEstado.mutate({ id: r.id, estado: val })}
                >
                  <SelectTrigger className={`h-6 w-[120px] rounded-full border-2 text-xs font-medium ${getEstadoClasses(r.estado)}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_curso">Em Curso</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="recusado">Recusado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Badge className={`text-xs ${r.estado_pagamento === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {r.estado_pagamento === 'pago' ? 'Pago' : 'Pendente'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5 text-xs text-gray-500">
              {r.entidade ? (
                <span>
                  <strong>Entidade:</strong>{' '}
                  <ClickableClientName clientId={r.entidade.id} clientName={r.entidade.nome} />
                </span>
              ) : r.tipo === 'stand' ? (
                <span className="text-orange-500"><strong>Entidade:</strong> Não associada</span>
              ) : null}
              {r.sa_nome && <span><strong>Comprador:</strong> {r.sa_nome}</span>}
              {r.sp_nome && <span><strong>Vendedor:</strong> {r.sp_nome}</span>}
              {r.valor && <span><strong>Valor:</strong> {Number(r.valor).toFixed(2)} €</span>}
              {r.numero_pedido && <span><strong>Pedido:</strong> {r.numero_pedido}</span>}
              <span><strong>Criado:</strong> {formatDatePT(r.data_criacao)}</span>
            </div>
          </div>
          <div className="flex space-x-1 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleView(r)}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            {canEdit("registos_automoveis") && (
              <>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(r)}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                  onClick={() => handleDelete(r.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Grouped listing renderer
  const GroupedListing = ({
    standGroups,
    particulares,
    emptyMessage,
    loading,
  }: {
    standGroups: { standId: number | null; standName: string; registos: RegistoAutomovel[] }[];
    particulares: RegistoAutomovel[];
    emptyMessage: string;
    loading: boolean;
  }) => {
    if (loading) {
      return <div className="text-center py-8 text-gray-500">A carregar...</div>;
    }

    const totalItems = standGroups.reduce((acc, g) => acc + g.registos.length, 0) + particulares.length;
    const totalValor = [...standGroups.flatMap(g => g.registos), ...particulares]
      .reduce((acc, r) => acc + (r.valor ? Number(r.valor) : 0), 0);

    if (totalItems === 0) {
      return <div className="text-center py-8 text-gray-500">{emptyMessage}</div>;
    }

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
            <span className="text-xs font-medium text-gray-600">Total</span>
            <span className="text-lg font-bold">{totalItems}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
            <span className="text-xs font-medium text-purple-600">Stands</span>
            <span className="text-lg font-bold text-purple-600">{standGroups.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
            <span className="text-xs font-medium text-blue-600">Particulares</span>
            <span className="text-lg font-bold text-blue-600">{particulares.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
            <span className="text-xs font-medium text-green-600">Valor Total</span>
            <span className="text-lg font-bold text-green-600">{totalValor.toFixed(2)} €</span>
          </div>
        </div>

        {/* Stand groups */}
        {standGroups.map((group) => {
          const groupTotal = group.registos.reduce((acc, r) => acc + (r.valor ? Number(r.valor) : 0), 0);
          return (
            <Card key={`stand-${group.standId}`}>
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Car className="h-4 w-4 text-purple-500" />
                    {group.standName}
                    <Badge variant="outline" className="text-xs">Stand</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500">{group.registos.length} registo(s)</span>
                    <span className="font-semibold">{groupTotal.toFixed(2)} €</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="space-y-2">
                  {group.registos.map((r) => (
                    <RegistoCard key={r.id} r={r} />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Particulares */}
        {particulares.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-500" />
                  Particulares
                </CardTitle>
                <span className="text-sm text-gray-500">{particulares.length} registo(s)</span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-2">
                {particulares.map((r) => (
                  <RegistoCard key={r.id} r={r} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registos Automóveis</h1>
          <p className="text-gray-600">Gestão de transferências de propriedade de veículos</p>
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
          {canCreate("registos_automoveis") && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Registo
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="registos">
        <TabsList>
          <TabsTrigger value="registos">
            <Car className="h-4 w-4 mr-2" />
            Todos ({totalRegistos})
          </TabsTrigger>
          <TabsTrigger value="dia">
            <Calendar className="h-4 w-4 mr-2" />
            Dia
          </TabsTrigger>
          <TabsTrigger value="semana">
            <List className="h-4 w-4 mr-2" />
            Semana
          </TabsTrigger>
          <TabsTrigger value="stand-semanas">
            <Lock className="h-4 w-4 mr-2" />
            Stands - Semanas ({semanas.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB TODOS */}
        <TabsContent value="registos" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setFilterTipo(filterTipo === 'particular' ? 'todos' : 'particular')}
              className={`flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow ${filterTipo === 'particular' ? 'ring-2 ring-blue-500' : ''}`}
            >
              <span className="text-xs sm:text-sm font-medium text-blue-600 flex items-center gap-1">
                <Car className="h-4 w-4 shrink-0" />
                Particular
              </span>
              <span className="text-lg font-bold text-blue-600">{totalParticular}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterTipo(filterTipo === 'stand' ? 'todos' : 'stand')}
              className={`flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow ${filterTipo === 'stand' ? 'ring-2 ring-purple-500' : ''}`}
            >
              <span className="text-xs sm:text-sm font-medium text-purple-600 flex items-center gap-1">
                <Car className="h-4 w-4 shrink-0" />
                Stand
              </span>
              <span className="text-lg font-bold text-purple-600">{totalStand}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterPagamento(filterPagamento === 'pendente' ? 'todos' : 'pendente')}
              className={`flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow ${filterPagamento === 'pendente' ? 'ring-2 ring-yellow-500' : ''}`}
            >
              <span className="text-xs sm:text-sm font-medium text-yellow-600 flex items-center gap-1">
                <Clock className="h-4 w-4 shrink-0" />
                Pendente
              </span>
              <span className="text-lg font-bold text-yellow-600">{totalPendente}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterPagamento(filterPagamento === 'pago' ? 'todos' : 'pago')}
              className={`flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow ${filterPagamento === 'pago' ? 'ring-2 ring-green-500' : ''}`}
            >
              <span className="text-xs sm:text-sm font-medium text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Pago
              </span>
              <span className="text-lg font-bold text-green-600">{totalPago}</span>
            </button>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <Input
                placeholder="Pesquisar por matrícula, marca, nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSearchTerm(''); setFilterTipo('todos'); setFilterPagamento('todos'); }}
              className="shrink-0 h-9"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Limpar
            </Button>
          </div>

          {/* Lista */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Registos</CardTitle>
              <CardDescription>
                {filteredRegistos.length === 0
                  ? 'Nenhum registo encontrado'
                  : `${filteredRegistos.length} registo${filteredRegistos.length !== 1 ? 's' : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredRegistos.map((r: RegistoAutomovel) => (
                  <RegistoCard key={r.id} r={r} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB DIA */}
        <TabsContent value="dia" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDay(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={formatDateISO(selectedDate)}
                  onChange={(e) => setSelectedDate(new Date(e.target.value + 'T12:00:00'))}
                  className="h-9 w-[160px]"
                />
                {!isToday && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                    Hoje
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => navigateDay(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-700">
                {selectedDate.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileDown className="mr-1.5 h-3.5 w-3.5" />
                    Exportar Dia
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('dia', 'pdf', selectedDate)}>
                    PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('dia', 'csv', selectedDate)}>
                    CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <GroupedListing
            standGroups={diaGrouped.standGroups}
            particulares={diaGrouped.particulares}
            emptyMessage="Nenhum registo automóvel para este dia."
            loading={isLoadingDia}
          />
        </TabsContent>

        {/* TAB SEMANA */}
        <TabsContent value="semana" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium px-2">
                  {formatDatePT(formatDateISO(selectedWeekStart))} - {formatDatePT(formatDateISO(weekEnd))}
                </span>
                {!isThisWeek && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedWeekStart(getMonday(new Date()))}>
                    Esta semana
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileDown className="mr-1.5 h-3.5 w-3.5" />
                  Exportar Semana
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('semana', 'pdf', selectedWeekStart)}>
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('semana', 'csv', selectedWeekStart)}>
                  CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <GroupedListing
            standGroups={semanaGrouped.standGroups}
            particulares={semanaGrouped.particulares}
            emptyMessage="Nenhum registo automóvel para esta semana."
            loading={isLoadingSemana}
          />
        </TabsContent>

        {/* TAB STAND SEMANAS */}
        <TabsContent value="stand-semanas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Semanas de Stands</CardTitle>
              <CardDescription>
                Agrupamento semanal de registos por stand/concessionário
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSemanas ? (
                <div className="text-center py-8 text-gray-500">A carregar...</div>
              ) : semanas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma semana registada. As semanas são criadas automaticamente ao adicionar registos do tipo "Stand".
                </div>
              ) : (
                <div className="space-y-3">
                  {semanas.map((s: StandSemana) => (
                    <Card
                      key={s.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => { setSelectedSemana(s); setIsSemanaOpen(true); }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-semibold text-sm">
                                {formatDatePT(s.semana_inicio)} - {formatDatePT(s.semana_fim)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {s.stand_entidade?.nome || `Stand ID ${s.stand_entidade_id}`}
                                {' | '}
                                {s.registos_count != null ? `${s.registos_count} registo(s)` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {s.total != null && (
                              <span className="font-bold text-sm">{Number(s.total).toFixed(2)} €</span>
                            )}
                            <Badge className={s.estado === 'fechada' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                              {s.estado === 'fechada' ? 'Fechada' : 'Aberta'}
                            </Badge>
                            {s.estado === 'aberta' && canEdit("registos_automoveis") && (
                              <div onClick={(e) => e.stopPropagation()} className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Fechar esta semana? Todos os registos serão marcados como pagos.')) {
                                      fecharSemana.mutateAsync(s.id);
                                    }
                                  }}
                                  title="Fechar semana"
                                >
                                  <Lock className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (confirm('Eliminar esta semana?')) {
                                      deleteSemana.mutateAsync(s.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                  title="Eliminar semana"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <RegistoAutomovelModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        registo={selectedRegisto}
      />
      <RegistoAutomovelDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedDetails(null); }}
        registo={selectedDetails}
      />
      <StandSemanaModal
        isOpen={isSemanaOpen}
        onClose={() => { setIsSemanaOpen(false); setSelectedSemana(null); }}
        semana={selectedSemana}
        onFechar={(id) => fecharSemana.mutateAsync(id)}
      />
    </div>
  );
};
