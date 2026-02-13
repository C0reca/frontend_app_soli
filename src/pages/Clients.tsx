import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Eye, Edit, Trash2, User, Building, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useClients, Client, getEffectiveTipo } from '@/hooks/useClients';
import { ClientModal } from '@/components/modals/ClientModal';
import { ClientDetailsModal } from '@/components/modals/ClientDetailsModal';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeString } from '@/lib/utils';

export const Clients: React.FC = () => {
  const { clients, isLoading, deleteClient } = useClients();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
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
    return tipo === 'singular' ? (client as any).nome : (client as any).nome_empresa;
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
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
      </div>

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

      <ClientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        client={selectedClient}
      />

      <ClientDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        client={selectedClientDetails}
      />
    </div>
  );
};