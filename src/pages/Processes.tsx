
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Eye, Edit, Trash2, ArchiveRestore, MapPin, Filter, X, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { useProcesses, Process } from '@/hooks/useProcesses';
import { getDossieDisplayLabel, Dossie } from '@/hooks/useDossies';
import { ProcessModal } from '@/components/modals/ProcessModal';
import { ProcessDetailsModal } from '@/components/modals/ProcessDetailsModal';
import { ProcessLocationModal } from '@/components/modals/ProcessLocationModal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClickableClientName } from '@/components/ClickableClientName';
import { useClients } from '@/hooks/useClients';
import { useEmployeeList } from '@/hooks/useEmployees';
import { usePermissions } from '@/hooks/usePermissions';
import { normalizeString } from '@/lib/utils';


export const Processes: React.FC = () => {
  const { canCreate, canEdit } = usePermissions();
  const { processes, isLoading, deleteProcess, getArchived, unarchiveProcess, updateProcess } = useProcesses();
  const { clients } = useClients();
  const { data: employees = [] } = useEmployeeList();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProcessDetails, setSelectedProcessDetails] = useState<Process | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProcessLocation, setSelectedProcessLocation] = useState<Process | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archived, setArchived] = useState<Process[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [filters, setFilters] = useState({
    status: 'all',
    responsavel: 'all',
    tipo: 'all',
    showArquivados: false,
  });
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [processToArchive, setProcessToArchive] = useState<Process | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    const abrir = searchParams.get('abrir');
    if (abrir && processes.length > 0) {
      const id = parseInt(abrir, 10);
      const p = (showArchived ? archived : processes).find((x: Process) => x.id === id || String(x.id) === abrir);
      if (p) {
        setSelectedProcessDetails(p);
        setIsDetailsModalOpen(true);
      }
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('abrir');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, processes, archived, showArchived]);

  React.useEffect(() => {
    if (showArchived) {
      getArchived().then(setArchived).catch(() => setArchived([]));
    }
  }, [showArchived]);

  const getClientNameById = (id?: number) => {
    if (!id) return '';
    const client = clients.find((c: any) => c.id?.toString() === id.toString());
    return (client?.nome || client?.nome_empresa || '').toUpperCase();
  };

  const getEmployeeNameById = (id?: number) => {
    if (!id) return '';
    const employee = employees.find((e: any) => e.id?.toString() === id.toString());
    return employee?.nome || '';
  };

  const source = showArchived ? archived : processes;
  
  // Calcular estatísticas
  const pendenteCount = source.filter((p: Process) => p.estado === 'pendente').length;
  const emCursoCount = source.filter((p: Process) => p.estado === 'em_curso').length;
  const concluidoCount = source.filter((p: Process) => p.estado === 'concluido').length;

  const filteredProcesses = source.filter((process) => {
    const termNormalized = normalizeString(searchTerm);
    const clienteNome = process.cliente?.nome || getClientNameById(process.cliente_id) || '';
    const funcionarioNome = process.funcionario?.nome || getEmployeeNameById(process.funcionario_id) || '';
    const matchesSearch = (
      normalizeString(process.titulo).includes(termNormalized) ||
      normalizeString(clienteNome).includes(termNormalized) ||
      normalizeString(funcionarioNome).includes(termNormalized) ||
      (process.referencia && normalizeString(process.referencia).includes(termNormalized))
    );
    
    const matchesStatus = filters.status === 'all' || process.estado === filters.status;
    
    const matchesResponsavel = filters.responsavel === 'all' || 
      process.funcionario_id?.toString() === filters.responsavel;
    
    const matchesTipo = filters.tipo === 'all' || 
      (process.tipo && process.tipo === filters.tipo);
    
    const matchesArquivados = filters.showArquivados || !showArchived;
    
    return matchesSearch && matchesStatus && matchesResponsavel && matchesTipo && matchesArquivados;
  });

  // Paginação: resetar página quando filtros/pesquisa mudam
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, showArchived]);

  const totalPages = Math.max(1, Math.ceil(filteredProcesses.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProcesses = filteredProcesses.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'bg-green-100 text-green-800';
      case 'em_curso':
        return 'bg-blue-100 text-blue-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'em_curso':
        return 'Em Curso';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  const handleView = (process: Process) => {
    setSelectedProcessDetails(process);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (process: Process) => {
    setSelectedProcess(process);
    setIsModalOpen(true);
  };

  const handleDelete = (process: Process) => {
    setProcessToArchive(process);
    setArchiveConfirmOpen(true);
  };

  const handleConfirmArchive = async () => {
    if (!processToArchive) return;
    await deleteProcess.mutateAsync(processToArchive.id);
    setArchiveConfirmOpen(false);
    setProcessToArchive(null);
  };

  const handleCloseModal = () => {
    setSelectedProcess(null);
    setIsModalOpen(false);
  };

  const handleCloseDetailsModal = () => {
    setSelectedProcessDetails(null);
    setIsDetailsModalOpen(false);
  };

  const handleEditLocation = (process: Process) => {
    setSelectedProcessLocation(process);
    setIsLocationModalOpen(true);
  };

  const handleCloseLocationModal = () => {
    setSelectedProcessLocation(null);
    setIsLocationModalOpen(false);
  };

  const handleUpdateLocation = async (processId: number, localizacao: string) => {
    await updateProcess.mutateAsync({
      id: processId,
      onde_estao: localizacao,
    });
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

  const clearFilters = () => {
    setFilters({
      status: 'all',
      responsavel: 'all',
      tipo: 'all',
      showArquivados: false,
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Processos</h1>
          <p className="text-gray-600">Gerencie os processos da sua empresa</p>
        </div>
        {canCreate("processos") && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Processo
          </Button>
        )}
      </div>

      {/* Estatísticas + Filtros e Pesquisa (zona comprimida) */}
      <Card className="overflow-hidden">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
            <button
              type="button"
              onClick={() => setFilters({ status: 'pendente', responsavel: 'all', tipo: 'all', showArquivados: false })}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow"
            >
              <span className="text-xs sm:text-sm font-medium text-yellow-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Pendente
              </span>
              <span className="text-lg font-bold text-yellow-600">{pendenteCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilters({ status: 'em_curso', responsavel: 'all', tipo: 'all', showArquivados: false })}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow"
            >
              <span className="text-xs sm:text-sm font-medium text-blue-600 flex items-center gap-1">
                <Clock className="h-4 w-4 shrink-0" />
                Em Curso
              </span>
              <span className="text-lg font-bold text-blue-600">{emCursoCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilters({ status: 'concluido', responsavel: 'all', tipo: 'all', showArquivados: false })}
              className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow"
            >
              <span className="text-xs sm:text-sm font-medium text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Concluído
              </span>
              <span className="text-lg font-bold text-green-600">{concluidoCount}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <Input
                placeholder="Buscar processos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters} className="shrink-0 h-9">
              <X className="mr-1.5 h-3.5 w-3.5" />
              Limpar
            </Button>
            <Button
              variant={showArchived ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="shrink-0 h-9"
            >
              <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" />
              {showArchived ? 'Ver Ativos' : 'Ver Arquivados'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-[115px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_curso">Em Curso</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={filters.responsavel} onValueChange={(value) => setFilters(prev => ({ ...prev, responsavel: value }))}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>{emp.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.tipo} onValueChange={(value) => setFilters(prev => ({ ...prev, tipo: value }))}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="registo_predial">Registo Predial</SelectItem>
                <SelectItem value="certidao_permanente">Certidão Permanente</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Processos {showArchived ? '(Arquivados)' : ''}</CardTitle>
          <CardDescription>
            {filteredProcesses.length} processos encontrados
            {filteredProcesses.length > pageSize && (
              <> &mdash; a mostrar {(safePage - 1) * pageSize + 1}&ndash;{Math.min(safePage * pageSize, filteredProcesses.length)}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {paginatedProcesses.map((process) => (
              <Card key={process.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleView(process)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          {process.referencia && <>{process.referencia} - </>}
                          {process.titulo}
                        </h3>
                        {process.tipo && (
                          <Badge variant="outline">
                            {process.tipo}
                          </Badge>
                        )}
                        {process.privado && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Privado
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Arquivo:</span>{' '}
                          {process.dossie_id && process.dossie
                            ? getDossieDisplayLabel(process.dossie as Dossie)
                            : '1 (pendente)'}
                        </div>
                        <div>
                          <span className="font-medium">Entidade:</span>{' '}
                          <ClickableClientName
                            clientId={process.cliente_id}
                            client={process.cliente}
                            clientName={process.cliente?.nome || getClientNameById(process.cliente_id) || `ID: ${process.cliente_id}`}
                          />
                        </div>
                        <div>
                          <span className="font-medium">Responsável:</span> {process.funcionario?.nome ?? getEmployeeNameById(process.funcionario_id) ?? (process.funcionario_id ? `ID: ${process.funcionario_id}` : 'Não atribuído')}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Localização:</span> {(process as any).onde_estao === 'Tarefas' ? 'Pendentes' : ((process as any).onde_estao || '-')}
                        </div>
                        <div>
                          <span className="font-medium">Criado em:</span> {new Date(process.criado_em).toLocaleDateString('pt-BR')}
                        </div>
                        {process.descricao && (
                          <div className="col-span-2">
                            <span className="font-medium">Descrição:</span> {process.descricao}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(process.estado)}>
                        {getStatusLabel(process.estado)}
                      </Badge>
                       <div className="flex space-x-1">
                         <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleView(process); }}>
                           <Eye className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(process); }}>
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEditLocation(process); }} title="Alterar localização">
                           <MapPin className="h-4 w-4" />
                         </Button>
                      {showArchived ? (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); unarchiveProcess.mutate(process.id); }}>
                          <ArchiveRestore className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={(e) => { e.stopPropagation(); handleDelete(process); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
           </div>

           {/* Paginação */}
           {filteredProcesses.length > 0 && (
             <div className="flex items-center justify-between pt-4 border-t mt-4">
               <p className="text-sm text-muted-foreground">
                 Página {safePage} de {totalPages}
               </p>
               <div className="flex items-center space-x-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setCurrentPage(1)}
                   disabled={safePage <= 1}
                 >
                   Primeira
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                   disabled={safePage <= 1}
                 >
                   <ChevronLeft className="h-4 w-4" />
                 </Button>
                 {/* Números de página */}
                 {(() => {
                   const pages: number[] = [];
                   const start = Math.max(1, safePage - 2);
                   const end = Math.min(totalPages, safePage + 2);
                   for (let i = start; i <= end; i++) pages.push(i);
                   return pages.map(p => (
                     <Button
                       key={p}
                       variant={p === safePage ? 'default' : 'outline'}
                       size="sm"
                       onClick={() => setCurrentPage(p)}
                       className="min-w-[36px]"
                     >
                       {p}
                     </Button>
                   ));
                 })()}
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                   disabled={safePage >= totalPages}
                 >
                   <ChevronRight className="h-4 w-4" />
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setCurrentPage(totalPages)}
                   disabled={safePage >= totalPages}
                 >
                   Última
                 </Button>
               </div>
             </div>
           )}
         </CardContent>
       </Card>

       <ProcessModal
         isOpen={isModalOpen}
         onClose={handleCloseModal}
         process={selectedProcess}
       />

      <ProcessDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        process={selectedProcessDetails}
        onEdit={(p) => {
          setSelectedProcessDetails(null);
          setIsDetailsModalOpen(false);
          setSelectedProcess(p);
          setIsModalOpen(true);
        }}
      />

       <ProcessLocationModal
         isOpen={isLocationModalOpen}
         onClose={handleCloseLocationModal}
         process={selectedProcessLocation}
         onSave={handleUpdateLocation}
         isSubmitting={updateProcess.isPending}
       />

       <Dialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Arquivar processo</DialogTitle>
             <DialogDescription>
               Tem certeza que deseja arquivar este processo? O processo será movido para a lista de arquivados e deixará de aparecer na lista de processos ativos.
               {processToArchive && (
                 <span className="block mt-2 font-medium text-foreground">
                   &quot;{processToArchive.titulo}&quot;
                 </span>
               )}
             </DialogDescription>
           </DialogHeader>
           <DialogFooter>
             <Button variant="outline" onClick={() => { setArchiveConfirmOpen(false); setProcessToArchive(null); }}>
               Cancelar
             </Button>
             <Button variant="destructive" onClick={handleConfirmArchive} disabled={deleteProcess.isPending}>
               Arquivar
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 };
