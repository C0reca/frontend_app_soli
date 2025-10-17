
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { useProcesses, Process } from '@/hooks/useProcesses';
import { ProcessModal } from '@/components/modals/ProcessModal';
import { ProcessDetailsModal } from '@/components/modals/ProcessDetailsModal';


export const Processes: React.FC = () => {
  const { processes, isLoading, deleteProcess } = useProcesses();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProcessDetails, setSelectedProcessDetails] = useState<Process | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const filteredProcesses = processes.filter((process) =>
    process.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (process.cliente?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (process.funcionario?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este processo?')) {
      await deleteProcess.mutateAsync(id);
    }
  };

  const handleCloseModal = () => {
    setSelectedProcess(null);
    setIsModalOpen(false);
  };

  const handleCloseDetailsModal = () => {
    setSelectedProcessDetails(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Processos</h1>
          <p className="text-gray-600">Gerencie os processos da sua empresa</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Processo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Processos</CardTitle>
          <CardDescription>
            Total de {processes.length} processos cadastrados
          </CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar processos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {filteredProcesses.map((process) => (
              <Card key={process.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleView(process)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{process.titulo}</h3>
                        {process.tipo && (
                          <Badge variant="outline">
                            {process.tipo}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Cliente:</span> {process.cliente?.nome || `ID: ${process.cliente_id}`}
                        </div>
                        <div>
                          <span className="font-medium">Responsável:</span> {process.funcionario?.nome || `ID: ${process.funcionario_id}`}
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
                         <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={(e) => { e.stopPropagation(); handleDelete(process.id); }}>
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
           </div>
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
       />
     </div>
   );
 };
