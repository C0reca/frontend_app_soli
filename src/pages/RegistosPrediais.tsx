/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Building, CheckCircle, XCircle, AlertTriangle, Clock, Edit, Trash2, Eye, Archive } from 'lucide-react';
import { useRegistosPrediais, RegistoPredial } from '@/hooks/useRegistosPrediais';
import { useClients } from '@/hooks/useClients';
import { RegistoPredialModal } from '@/components/modals/RegistoPredialModal';
import { RegistoPredialDetailsModal } from '@/components/modals/RegistoPredialDetailsModal';
import { ClickableClientName } from '@/components/ClickableClientName';
import { normalizeString } from '@/lib/utils';

export const RegistosPrediais: React.FC = () => {
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
        <Card 
          className={`cursor-pointer hover:shadow-lg transition-shadow ${filterEstado === 'concluido' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => {
            if (filterEstado === 'concluido') {
              setFilterEstado(null);
              setShowConcluidos(false);
            } else {
              setFilterEstado('concluido');
              setShowConcluidos(true);
            }
          }}
        >
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

        <Card 
          className={`cursor-pointer hover:shadow-lg transition-shadow ${filterEstado === 'registo' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setFilterEstado(filterEstado === 'registo' ? null : 'registo')}
        >
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

        <Card 
          className={`cursor-pointer hover:shadow-lg transition-shadow ${filterEstado === 'provisorios' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setFilterEstado(filterEstado === 'provisorios' ? null : 'provisorios')}
        >
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

        <Card 
          className={`cursor-pointer hover:shadow-lg transition-shadow ${filterEstado === 'recusado' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setFilterEstado(filterEstado === 'recusado' ? null : 'recusado')}
        >
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

        <Card 
          className={`cursor-pointer hover:shadow-lg transition-shadow ${filterEstado === 'desistencia' ? 'ring-2 ring-gray-500' : ''}`}
          onClick={() => setFilterEstado(filterEstado === 'desistencia' ? null : 'desistencia')}
        >
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Registos Prediais</CardTitle>
              <CardDescription>
                Total de {registos.length} registos cadastrados
                {!showConcluidos && (
                  <span className="ml-2">
                    ({registos.filter((r: any) => r.estado_key !== 'concluido').length} ativos)
                  </span>
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowConcluidos(!showConcluidos)}
            >
              <Archive className="mr-2 h-4 w-4" />
              {showConcluidos ? 'Ocultar Concluídos' : 'Mostrar Concluídos'}
            </Button>
          </div>
          <div className="flex items-center space-x-2 mt-4">
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
            {sortedRegistos.map((registo: any) => (
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
                          {registo.numero_processo} -{' '}
                          <ClickableClientName 
                            clientId={registo.cliente_id} 
                            client={registo.cliente}
                            clientName={registo.cliente?.nome || clientNameById(registo.cliente_id) || 'N/A'}
                          />
                        </h3>
                        <Badge className={getStatusColor(registo.estado_key)}>
                          {getStatusLabel(registo.estado_key)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{registo.predio} - {registo.freguesia}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span><strong>Registo:</strong> {registo.registo}</span>
                        <span><strong>Data:</strong> {new Date(registo.data).toLocaleDateString('pt-BR')}</span>
                        {registo.predios && registo.predios.length > 0 && registo.predios.some((p: any) => p.codigo_certidao_permanente) && (
                          <span><strong>Códigos Certidão:</strong> {registo.predios.filter((p: any) => p.codigo_certidao_permanente).map((p: any) => p.codigo_certidao_permanente).join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      {registo.estado_key !== 'concluido' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsConcluido(registo)}
                          className="text-green-600 hover:text-green-700"
                          title="Marcar como concluído"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
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