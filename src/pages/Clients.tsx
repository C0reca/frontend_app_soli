import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Edit, Trash2, User, Building } from 'lucide-react';
import { useClients, Client } from '@/hooks/useClients';
import { ClientModal } from '@/components/modals/ClientModal';
import { ClientDetailsModal } from '@/components/modals/ClientDetailsModal';
import { useAuth } from '@/contexts/AuthContext';

export const Clients: React.FC = () => {
  const { clients, isLoading, deleteClient } = useClients();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'singular' | 'coletivo'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'id' | 'createdAt' | 'nome' | 'email' | 'nif' | 'status'>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClientDetails, setSelectedClientDetails] = useState<Client | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const getClientName = (client: Client) => {
    console.log(client);
    // Se tipo for null/undefined, assume como pessoa singular
    const tipo = client.tipo || 'singular';
    if (tipo === 'singular') {
      return (client as any).nome;
    } else {
      return (client as any).nome_empresa;
    }
  };

  const getClientPhone = (client: Client) => {
    return client.telefone;
  };

  const filteredClients = clients
    .filter((client: Client) => {
      const nome = getClientName(client)?.toLowerCase() || '';
      const email = client.email?.toLowerCase() || '';
      const nifVal = ((client.tipo || 'singular') === 'singular' ? (client as any).nif : (client as any).nif_empresa) || '';
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch = nome.includes(searchLower) || email.includes(searchLower) || String(nifVal).toLowerCase().includes(searchLower);
      const matchesTipo = filterTipo === 'all' || (client.tipo || 'singular') === filterTipo;
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
        if (sortBy === 'nif') return String(((a.tipo || 'singular') === 'singular' ? (a as any).nif : (a as any).nif_empresa) || '').toLowerCase();
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
        if (sortBy === 'nif') return String(((b.tipo || 'singular') === 'singular' ? (b as any).nif : (b as any).nif_empresa) || '').toLowerCase();
        if (sortBy === 'status') return (b.status || 'active');
        return '';
      })();
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });

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

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Total de {clients.length} clientes cadastrados
          </CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select className="border rounded px-2 py-1" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value as any)}>
                <option value="all">Todos os tipos</option>
                <option value="singular">Particulares</option>
                <option value="coletivo">Empresas</option>
              </select>
              <select className="border rounded px-2 py-1" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                <option value="all">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
              <select className="border rounded px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <option value="id">Ordenar por ID</option>
                <option value="nome">Ordenar por Nome</option>
                <option value="email">Ordenar por Email</option>
                <option value="nif">Ordenar por NIF</option>
                <option value="status">Ordenar por Status</option>
              </select>
              <select className="border rounded px-2 py-1" value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          </div>
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
              {filteredClients.map((client: Client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-mono text-sm">{client.id}</TableCell>
                  <TableCell className="font-medium">{getClientName(client)}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{getClientPhone(client)}</TableCell>
                  <TableCell>{(client.tipo || 'singular') === 'singular' ? (client as any).nif : (client as any).nif_empresa}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (client.status || 'active') === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(client.status || 'active') === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(client)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
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