/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Building, CheckCircle, XCircle, AlertTriangle, Clock, Edit, Trash2, Eye } from 'lucide-react';
import { useRegistosPrediais, RegistoPredial } from '@/hooks/useRegistosPrediais';
import { useClients } from '@/hooks/useClients';
import { RegistoPredialModal } from '@/components/modals/RegistoPredialModal';
import { RegistoPredialDetailsModal } from '@/components/modals/RegistoPredialDetailsModal';

export const RegistosPrediais: React.FC = () => {
  const { registos, isLoading, deleteRegisto } = useRegistosPrediais();
  const { clients } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
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
  const filteredRegistos = registos.filter((registo: any) =>
    safe(registo.numero_processo).includes(searchTerm.toLowerCase()) ||
    safe(registo.predio).includes(searchTerm.toLowerCase()) ||
    safe(registo.freguesia).includes(searchTerm.toLowerCase()) ||
    safe(registo.cliente?.nome).includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'concluido':
        return 'bg-green-100 text-green-800';
      case 'desistencia':
        return 'bg-gray-100 text-gray-800';
      case 'recusado':
        return 'bg-red-100 text-red-800';
      case 'provisorios':
        return 'bg-yellow-100 text-yellow-800';
      case 'registo':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      case 'provisorios':
        return 'Provisórios';
      case 'registo':
        return 'Registo';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'concluido':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'desistencia':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'recusado':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'provisorios':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'registo':
        return <Building className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
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

  const handleCloseModal = () => {
    setSelectedRegisto(null);
    setIsModalOpen(false);
  };

  const handleCloseDetailsModal = () => {
    setSelectedRegistoDetails(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Registos Prediais</h1>
          <p className="text-gray-600">Gerencie os registos prediais</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Registo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {registos.filter((r: any) => r.estado_key === 'concluido').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-600" />
              Registos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {registos.filter((r: any) => r.estado_key === 'registo').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5 text-yellow-600" />
              Provisórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {registos.filter((r: any) => r.estado_key === 'provisorios').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <XCircle className="mr-2 h-5 w-5 text-red-600" />
              Recusados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {registos.filter((r: any) => r.estado_key === 'recusado').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <XCircle className="mr-2 h-5 w-5 text-gray-600" />
              Desistências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {registos.filter((r: any) => r.estado_key === 'desistencia').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Registos Prediais</CardTitle>
          <CardDescription>
            Total de {registos.length} registos cadastrados
          </CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar registos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRegistos.map((registo: any) => (
              <Card 
                key={registo.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleView(registo)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(registo.estado_key)}
                        <h3 className="font-semibold">
                          {registo.numero_processo} - {registo.cliente?.nome || clientNameById(registo.cliente_id) || 'N/A'}
                        </h3>
                        <Badge className={getStatusColor(registo.estado_key)}>
                          {getStatusLabel(registo.estado_key)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{registo.predio} - {registo.freguesia}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span><strong>Registo:</strong> {registo.registo}</span>
                        <span><strong>Data:</strong> {new Date(registo.data).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(registo)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(registo)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(registo.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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