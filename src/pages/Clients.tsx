import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Trash2, User, Building, Filter, X, ChevronLeft, ChevronRight, GitMerge, AlertTriangle, Users, FileWarning, ScanSearch } from 'lucide-react';
import { useClients, Client, getEffectiveTipo, useDuplicateClients, DuplicateGroup, useNameDuplicateClients, NameDuplicateGroup } from '@/hooks/useClients';
import { ClientModal } from '@/components/modals/ClientModal';
import { ClientDetailsModal } from '@/components/modals/ClientDetailsModal';
import { MergeClientsModal } from '@/components/modals/MergeClientsModal';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { normalizeString } from '@/lib/utils';

export const Clients: React.FC = () => {
  const navigate = useNavigate();
  const { clients, isLoading, deleteClient } = useClients();
  const { duplicates, isLoading: isDuplicatesLoading } = useDuplicateClients();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { canCreate, canEdit } = usePermissions();
  const [activeTab, setActiveTab] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'singular' | 'coletivo'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'id' | 'createdAt' | 'nome' | 'email' | 'nif' | 'status'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientDetails, setSelectedClientDetails] = useState<Client | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [searchParams, setSearchParams] = useSearchParams();
  const [mergeGroup, setMergeGroup] = useState<DuplicateGroup | null>(null);
  const [dupSubTab, setDupSubTab] = useState<'nif' | 'nome'>('nif');
  const [nameThreshold, setNameThreshold] = useState(90);
  const [dupNifPage, setDupNifPage] = useState(1);
  const [dupNomePage, setDupNomePage] = useState(1);
  const [debouncedThreshold, setDebouncedThreshold] = useState(nameThreshold);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedThreshold(nameThreshold), 400);
    return () => clearTimeout(timer);
  }, [nameThreshold]);
  const { nameDuplicates, isLoading: isNameDuplicatesLoading } = useNameDuplicateClients(debouncedThreshold);
  const dupPageSize = 10;
  const [incompletosPage, setIncompletosPage] = useState(1);
  const [incompletosFilter, setIncompletosFilter] = useState<'all' | string>('all');

  React.useEffect(() => {
    const abrir = searchParams.get('abrir');
    if (abrir && clients.length > 0) {
      const c = clients.find((x: Client) => String(x.id) === abrir);
      if (c) {
        setSelectedClientDetails(c);
        setIsDetailsModalOpen(true);
      }
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('abrir');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, clients]);

  const getClientName = (client: Client) => {
    const tipo = getEffectiveTipo(client);
    const name = tipo === 'singular' ? (client as any).nome : (client as any).nome_empresa;
    return name ? name.toUpperCase() : name;
  };

  const getClientPhone = (client: Client) => {
    return client.telefone;
  };

  const filteredClients = clients
    .filter((client: Client) => {
      const nome = getClientName(client) || '';
      const email = client.email || '';
      const nifVal = (getEffectiveTipo(client) === 'singular' ? (client as any).nif : (client as any).nif_empresa) || '';
      const searchNormalized = normalizeString(searchTerm);

      const matchesSearch = normalizeString(nome).includes(searchNormalized) ||
                           normalizeString(email).includes(searchNormalized) ||
                           normalizeString(String(nifVal)).includes(searchNormalized);
      const matchesTipo = filterTipo === 'all' || getEffectiveTipo(client) === filterTipo;
      const matchesStatus = filterStatus === 'all' || (client.status || 'active') === filterStatus;
      return matchesSearch && matchesTipo && matchesStatus;
    })
    .sort((a: Client, b: Client) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const valA = (() => {
        if (sortBy === 'id') {
          const v = (a as any).id;
          return typeof v === 'string' ? parseInt(v, 10) || 0 : (v || 0);
        }
        if (sortBy === 'createdAt') {
          const d = (a as any).criado_em || (a as any).createdAt || '';
          return new Date(d).getTime() || 0;
        }
        if (sortBy === 'nome') return (getClientName(a) || '').toLowerCase();
        if (sortBy === 'email') return (a.email || '').toLowerCase();
        if (sortBy === 'nif') return String((getEffectiveTipo(a) === 'singular' ? (a as any).nif : (a as any).nif_empresa) || '').toLowerCase();
        if (sortBy === 'status') return (a.status || 'active');
        return '';
      })();
      const valB = (() => {
        if (sortBy === 'id') {
          const v = (b as any).id;
          return typeof v === 'string' ? parseInt(v, 10) || 0 : (v || 0);
        }
        if (sortBy === 'createdAt') {
          const d = (b as any).criado_em || (b as any).createdAt || '';
          return new Date(d).getTime() || 0;
        }
        if (sortBy === 'nome') return (getClientName(b) || '').toLowerCase();
        if (sortBy === 'email') return (b.email || '').toLowerCase();
        if (sortBy === 'nif') return String((getEffectiveTipo(b) === 'singular' ? (b as any).nif : (b as any).nif_empresa) || '').toLowerCase();
        if (sortBy === 'status') return (b.status || 'active');
        return '';
      })();
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTipo, filterStatus, sortBy, sortDir]);

  const totalFiltered = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedClients = filteredClients.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );
  const startItem = totalFiltered === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalFiltered);

  // ── Entidades incompletas (campos principais vazios) ──
  const CAMPOS_PRINCIPAIS: { key: string; label: string; check: (c: Client) => boolean }[] = React.useMemo(() => [
    { key: 'nome', label: 'Nome', check: (c) => {
      const tipo = getEffectiveTipo(c);
      const val = tipo === 'coletivo' ? (c as any).nome_empresa : (c as any).nome;
      return !val || !String(val).trim();
    }},
    { key: 'nif', label: 'NIF', check: (c) => {
      const tipo = getEffectiveTipo(c);
      const val = tipo === 'coletivo' ? (c as any).nif_empresa : (c as any).nif;
      return !val || !String(val).trim();
    }},
  ], []);

  const incompleteClients = React.useMemo(() => {
    return clients
      .filter((c: Client) => (c.status || 'active') === 'active')
      .map((c: Client) => {
        const missing = CAMPOS_PRINCIPAIS.filter(f => f.check(c)).map(f => f.key);
        return missing.length > 0 ? { client: c, missing } : null;
      })
      .filter(Boolean) as { client: Client; missing: string[] }[];
  }, [clients, CAMPOS_PRINCIPAIS]);

  const incompleteByField = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const campo of CAMPOS_PRINCIPAIS) {
      counts[campo.key] = incompleteClients.filter(ic => ic.missing.includes(campo.key)).length;
    }
    return counts;
  }, [incompleteClients, CAMPOS_PRINCIPAIS]);

  const filteredIncomplete = React.useMemo(() => {
    if (incompletosFilter === 'all') return incompleteClients;
    return incompleteClients.filter(ic => ic.missing.includes(incompletosFilter));
  }, [incompleteClients, incompletosFilter]);

  const singularCount = filteredClients.filter((c: Client) => getEffectiveTipo(c) === 'singular').length;
  const coletivoCount = filteredClients.filter((c: Client) => getEffectiveTipo(c) === 'coletivo').length;
  const activeCount = filteredClients.filter((c: Client) => (c.status || 'active') === 'active').length;

  const handleView = (client: Client) => {
    setSelectedClientDetails(client);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (isAdmin && confirm('Tem certeza que deseja excluir este cliente?')) {
      await deleteClient.mutateAsync(id);
    }
  };

  const handleCloseModal = () => {
    setSelectedClient(null);
    setIsModalOpen(false);
  };

  const handleCloseDetailsModal = () => {
    setSelectedClientDetails(null);
    setIsDetailsModalOpen(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterTipo('all');
    setFilterStatus('all');
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
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">
            {isAdmin ? 'Gerencie os clientes da empresa' : 'Visualize e trabalhe com clientes'}
          </p>
        </div>
          <div className="flex gap-2">
            {canCreate("clientes") && (
              <Button variant="outline" onClick={() => navigate('/assistente-documentos')}>
                <ScanSearch className="mr-2 h-4 w-4" />
                Extrair de Documento
              </Button>
            )}
            {canCreate("clientes") && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            )}
          </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="todos">Todos os Clientes</TabsTrigger>
          <TabsTrigger value="duplicados" className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Duplicados
            {duplicates.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                {duplicates.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="incompletos" className="flex items-center gap-1.5">
            <FileWarning className="h-3.5 w-3.5" />
            Incompletos
            {incompleteClients.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                {incompleteClients.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-6 mt-4">
          {/* Estatísticas + Filtros e Pesquisa (zona comprimida) */}
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <button
                  type="button"
                  onClick={() => { setFilterTipo('singular'); setFilterStatus('all'); }}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow"
                >
                  <span className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1">
                    <User className="h-4 w-4 shrink-0" />
                    Particulares
                  </span>
                  <span className="text-lg font-bold text-gray-700">{singularCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterTipo('coletivo'); setFilterStatus('all'); }}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow"
                >
                  <span className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Building className="h-4 w-4 shrink-0" />
                    Empresas
                  </span>
                  <span className="text-lg font-bold text-gray-700">{coletivoCount}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterTipo('all'); setFilterStatus('active'); }}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-left hover:shadow transition-shadow"
                >
                  <span className="text-xs sm:text-sm font-medium text-green-600 flex items-center gap-1">
                    Ativos
                  </span>
                  <span className="text-lg font-bold text-green-600">{activeCount}</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                  <Input
                    placeholder="Buscar clientes..."
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
                  <Select value={filterTipo} onValueChange={(v: 'all' | 'singular' | 'coletivo') => setFilterTipo(v)}>
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="singular">Particulares</SelectItem>
                      <SelectItem value="coletivo">Empresas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Select value={filterStatus} onValueChange={(v: 'all' | 'active' | 'inactive') => setFilterStatus(v)}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v: 'id' | 'createdAt' | 'nome' | 'email' | 'nif' | 'status') => setSortBy(v)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id">ID</SelectItem>
                    <SelectItem value="createdAt">Data</SelectItem>
                    <SelectItem value="nome">Nome</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="nif">NIF</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortDir} onValueChange={(v: 'asc' | 'desc') => setSortDir(v)}>
                  <SelectTrigger className="w-[80px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Asc</SelectItem>
                    <SelectItem value="desc">Desc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Clientes</CardTitle>
              <CardDescription>
                {totalFiltered === 0
                  ? 'Nenhum cliente encontrado'
                  : totalFiltered <= pageSize
                    ? `${totalFiltered} cliente${totalFiltered !== 1 ? 's' : ''} encontrado${totalFiltered !== 1 ? 's' : ''}`
                    : `${startItem} a ${endItem} de ${totalFiltered} clientes`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nome/Empresa</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>NIF</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client: Client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleView(client)}
                    >
                      <TableCell className="font-mono text-sm">{client.id}</TableCell>
                      <TableCell className="font-medium">{getClientName(client)}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{getClientPhone(client)}</TableCell>
                      <TableCell>{getEffectiveTipo(client) === 'singular' ? (client as any).nif : (client as any).nif_empresa}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (client.status || 'active') === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {(client.status || 'active') === 'active' ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleView(client); }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleEdit(client); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleDelete(String(client.id)); }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {safePage} de {totalPages}
                  </p>
                  <div className="flex items-center gap-1 sm:gap-2">
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
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {(() => {
                      const pages: number[] = [];
                      const start = Math.max(1, safePage - 2);
                      const end = Math.min(totalPages, safePage + 2);
                      for (let i = start; i <= end; i++) pages.push(i);
                      return pages.map((p) => (
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
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
        </TabsContent>

        <TabsContent value="duplicados" className="space-y-4 mt-4">
          {/* Sub-tabs: NIF / Nome */}
          <Tabs value={dupSubTab} onValueChange={(v) => setDupSubTab(v as 'nif' | 'nome')}>
            <TabsList>
              <TabsTrigger value="nif" className="flex items-center gap-1.5">
                NIF Igual
                {duplicates.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                    {duplicates.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="nome" className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Nome Semelhante
                {nameDuplicates.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-xs">
                    {nameDuplicates.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* NIF duplicados */}
            <TabsContent value="nif" className="space-y-4 mt-3">
              {isDuplicatesLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4 animate-pulse">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : duplicates.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Não foram encontradas entidades com NIF duplicado.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {duplicates.length} grupo{duplicates.length !== 1 ? 's' : ''} de NIF duplicado
                    {duplicates.length > dupPageSize && ` — página ${dupNifPage} de ${Math.ceil(duplicates.length / dupPageSize)}`}
                  </p>
                  {duplicates.slice((dupNifPage - 1) * dupPageSize, dupNifPage * dupPageSize).map((group) => (
                    <Card key={group.nif}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              NIF: {group.nif}
                            </CardTitle>
                            <CardDescription>
                              {group.clientes.length} entidades com o mesmo NIF
                            </CardDescription>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setMergeGroup(group)}
                          >
                            <GitMerge className="mr-1.5 h-3.5 w-3.5" />
                            Fundir
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {group.clientes.map((c: Client) => {
                            const tipo = getEffectiveTipo(c);
                            const name = tipo === 'coletivo' ? (c as any).nome_empresa : (c as any).nome;
                            return (
                              <div
                                key={c.id}
                                className="rounded-lg border p-3 text-sm space-y-1 hover:border-gray-400 cursor-pointer transition-colors"
                                onClick={() => handleView(c)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{name || 'Sem nome'}</span>
                                  <Badge variant="outline" className="text-xs">ID: {c.id}</Badge>
                                </div>
                                {c.email && <p className="text-muted-foreground text-xs">Email: {c.email}</p>}
                                {c.telefone && <p className="text-muted-foreground text-xs">Tel: {c.telefone}</p>}
                                <p className="text-muted-foreground text-xs">
                                  Tipo: {tipo === 'coletivo' ? 'Empresa' : 'Particular'} |
                                  Criado: {(c as any).criado_em ? new Date((c as any).criado_em).toLocaleDateString('pt-PT') : 'N/A'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {duplicates.length > dupPageSize && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => setDupNifPage(p => Math.max(1, p - 1))} disabled={dupNifPage <= 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: Math.ceil(duplicates.length / dupPageSize) }, (_, i) => i + 1).map(p => (
                        <Button key={p} variant={p === dupNifPage ? 'default' : 'outline'} size="sm" onClick={() => setDupNifPage(p)} className="min-w-[36px]">
                          {p}
                        </Button>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setDupNifPage(p => Math.min(Math.ceil(duplicates.length / dupPageSize), p + 1))} disabled={dupNifPage >= Math.ceil(duplicates.length / dupPageSize)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Nome semelhante */}
            <TabsContent value="nome" className="space-y-4 mt-3">
              <div className="flex items-center gap-3 max-w-sm">
                <label className="text-xs text-muted-foreground whitespace-nowrap">Semelhança:</label>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={1}
                  value={nameThreshold}
                  onChange={(e) => { setNameThreshold(Number(e.target.value)); setDupNomePage(1); }}
                  className="w-32 h-1.5 accent-primary cursor-pointer"
                />
                <span className={`text-xs font-bold min-w-[36px] ${
                  nameThreshold >= 90 ? 'text-red-600' : nameThreshold >= 80 ? 'text-orange-600' : 'text-yellow-600'
                }`}>
                  {nameThreshold}%
                </span>
              </div>
              {isNameDuplicatesLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4 animate-pulse">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : nameDuplicates.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Não foram encontradas entidades com nomes semelhantes.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {nameDuplicates.length} grupo{nameDuplicates.length !== 1 ? 's' : ''} de nomes semelhantes
                    {nameDuplicates.length > dupPageSize && ` — página ${dupNomePage} de ${Math.ceil(nameDuplicates.length / dupPageSize)}`}
                  </p>
                  {nameDuplicates.slice((dupNomePage - 1) * dupPageSize, dupNomePage * dupPageSize).map((group, idx) => (
                    <Card key={idx}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              Semelhança: {group.score}%
                            </CardTitle>
                            <CardDescription>
                              {group.clientes.length} entidades com nomes semelhantes
                            </CardDescription>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setMergeGroup({ nif: `nome-${idx}`, clientes: group.clientes })}
                          >
                            <GitMerge className="mr-1.5 h-3.5 w-3.5" />
                            Fundir
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {group.clientes.map((c: Client) => {
                            const tipo = getEffectiveTipo(c);
                            const name = tipo === 'coletivo' ? (c as any).nome_empresa : (c as any).nome;
                            const nifVal = tipo === 'coletivo' ? (c as any).nif_empresa : (c as any).nif;
                            return (
                              <div
                                key={c.id}
                                className="rounded-lg border p-3 text-sm space-y-1 hover:border-gray-400 cursor-pointer transition-colors"
                                onClick={() => handleView(c)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{name || 'Sem nome'}</span>
                                  <Badge variant="outline" className="text-xs">ID: {c.id}</Badge>
                                </div>
                                {nifVal && <p className="text-muted-foreground text-xs">NIF: {nifVal}</p>}
                                {c.email && <p className="text-muted-foreground text-xs">Email: {c.email}</p>}
                                {c.telefone && <p className="text-muted-foreground text-xs">Tel: {c.telefone}</p>}
                                <p className="text-muted-foreground text-xs">
                                  Tipo: {tipo === 'coletivo' ? 'Empresa' : 'Particular'} |
                                  Criado: {(c as any).criado_em ? new Date((c as any).criado_em).toLocaleDateString('pt-PT') : 'N/A'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {nameDuplicates.length > dupPageSize && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => setDupNomePage(p => Math.max(1, p - 1))} disabled={dupNomePage <= 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {Array.from({ length: Math.ceil(nameDuplicates.length / dupPageSize) }, (_, i) => i + 1).map(p => (
                        <Button key={p} variant={p === dupNomePage ? 'default' : 'outline'} size="sm" onClick={() => setDupNomePage(p)} className="min-w-[36px]">
                          {p}
                        </Button>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => setDupNomePage(p => Math.min(Math.ceil(nameDuplicates.length / dupPageSize), p + 1))} disabled={dupNomePage >= Math.ceil(nameDuplicates.length / dupPageSize)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="incompletos" className="space-y-4 mt-4">
          {/* Filtros por campo em falta */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtrar por campo:</span>
            <Button
              variant={incompletosFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setIncompletosFilter('all'); setIncompletosPage(1); }}
            >
              Todos ({incompleteClients.length})
            </Button>
            {CAMPOS_PRINCIPAIS.map(campo => (
              <Button
                key={campo.key}
                variant={incompletosFilter === campo.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setIncompletosFilter(campo.key); setIncompletosPage(1); }}
              >
                {campo.label} ({incompleteByField[campo.key] || 0})
              </Button>
            ))}
          </div>

          {filteredIncomplete.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">Todas as entidades ativas têm a informação principal preenchida.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {filteredIncomplete.length} entidade{filteredIncomplete.length !== 1 ? 's' : ''} com dados em falta
                {filteredIncomplete.length > dupPageSize && ` — página ${incompletosPage} de ${Math.ceil(filteredIncomplete.length / dupPageSize)}`}
              </p>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">ID</TableHead>
                        <TableHead>Nome/Empresa</TableHead>
                        <TableHead>NIF</TableHead>
                        <TableHead>Campos em falta</TableHead>
                        <TableHead className="text-right w-20">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncomplete
                        .slice((incompletosPage - 1) * dupPageSize, incompletosPage * dupPageSize)
                        .map(({ client: c, missing }) => {
                          const tipo = getEffectiveTipo(c);
                          const name = tipo === 'coletivo' ? (c as any).nome_empresa : (c as any).nome;
                          const nifVal = tipo === 'coletivo' ? (c as any).nif_empresa : (c as any).nif;
                          const isFullyEmpty = missing.length === CAMPOS_PRINCIPAIS.length;
                          return (
                            <TableRow
                              key={c.id}
                              className={`cursor-pointer hover:bg-muted/50 ${isFullyEmpty ? 'bg-red-50/50' : ''}`}
                              onClick={() => handleView(c)}
                            >
                              <TableCell className="font-mono text-sm">{c.id}</TableCell>
                              <TableCell className={!name ? 'text-red-500 italic' : 'font-medium'}>
                                {name ? (name as string).toUpperCase() : '— vazio —'}
                              </TableCell>
                              <TableCell className={!nifVal ? 'text-red-500 italic' : ''}>
                                {nifVal || '— vazio —'}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {isFullyEmpty ? (
                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                      100% vazio
                                    </Badge>
                                  ) : (
                                    missing.map(key => {
                                      const campo = CAMPOS_PRINCIPAIS.find(f => f.key === key);
                                      return (
                                        <Badge key={key} variant="destructive" className="text-[10px] px-1.5 py-0">
                                          {campo?.label || key}
                                        </Badge>
                                      );
                                    })
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleView(c); }}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(c); }}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {isFullyEmpty && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={(e) => { e.stopPropagation(); handleDelete(String(c.id)); }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {filteredIncomplete.length > dupPageSize && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setIncompletosPage(p => Math.max(1, p - 1))} disabled={incompletosPage <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.ceil(filteredIncomplete.length / dupPageSize) }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - incompletosPage) <= 2)
                    .map(p => (
                      <Button key={p} variant={p === incompletosPage ? 'default' : 'outline'} size="sm" onClick={() => setIncompletosPage(p)} className="min-w-[36px]">
                        {p}
                      </Button>
                    ))}
                  <Button variant="outline" size="sm" onClick={() => setIncompletosPage(p => Math.min(Math.ceil(filteredIncomplete.length / dupPageSize), p + 1))} disabled={incompletosPage >= Math.ceil(filteredIncomplete.length / dupPageSize)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <ClientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        client={selectedClient}
        onEditExisting={(client) => {
          setSelectedClient(client);
          setIsModalOpen(true);
        }}
      />

      <ClientDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        client={selectedClientDetails}
      />

      {mergeGroup && (
        <MergeClientsModal
          isOpen={!!mergeGroup}
          onClose={() => setMergeGroup(null)}
          clients={mergeGroup.clientes}
          nif={mergeGroup.nif}
        />
      )}
    </div>
  );
};
