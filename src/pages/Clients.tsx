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

  const filteredClients = clients.filter((client: Client) => {
    console.log(client)
    const nome = getClientName(client)?.toLowerCase() || '';
    const email = client.email?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return nome.includes(searchLower) || email.includes(searchLower);
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
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        )}
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
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
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
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {(client.tipo || 'singular') === 'singular' ? (
                        <>
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="text-xs text-muted-foreground">Particular</span>
                        </>
                      ) : (
                        <>
                          <Building className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-muted-foreground">Empresa</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{getClientName(client)}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{getClientPhone(client)}</TableCell>
                  <TableCell>{(client.tipo || 'singular') === 'singular' ? (client as any).nif : (client as any).nif_empresa}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      client.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {client.status === 'active' ? 'Ativo' : 'Inativo'}
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