
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';

interface Process {
  id: string;
  name: string;
  client: string;
  employee: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  dueDate: string;
}

const mockProcesses: Process[] = [
  {
    id: '1',
    name: 'Processo de Onboarding - João Silva',
    client: 'João Silva',
    employee: 'Maria Santos',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2024-01-15',
    dueDate: '2024-01-30'
  },
  {
    id: '2',
    name: 'Análise Financeira - Empresa ABC',
    client: 'Empresa ABC',
    employee: 'Pedro Costa',
    status: 'pending',
    priority: 'medium',
    createdAt: '2024-01-14',
    dueDate: '2024-02-14'
  },
  {
    id: '3',
    name: 'Auditoria Interna - Q4 2024',
    client: 'Empresa XYZ',
    employee: 'Ana Silva',
    status: 'completed',
    priority: 'high',
    createdAt: '2024-01-10',
    dueDate: '2024-01-25'
  }
];

export const Processes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [processes] = useState<Process[]>(mockProcesses);

  const filteredProcesses = processes.filter((process) =>
    process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.employee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'in_progress':
        return 'Em Andamento';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return priority;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Processos</h1>
          <p className="text-gray-600">Gerencie os processos da sua empresa</p>
        </div>
        <Button>
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
              <Card key={process.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">{process.name}</h3>
                        <Badge className={getPriorityColor(process.priority)}>
                          {getPriorityLabel(process.priority)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Cliente:</span> {process.client}
                        </div>
                        <div>
                          <span className="font-medium">Responsável:</span> {process.employee}
                        </div>
                        <div>
                          <span className="font-medium">Criado em:</span> {new Date(process.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        <div>
                          <span className="font-medium">Prazo:</span> {new Date(process.dueDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(process.status)}>
                        {getStatusLabel(process.status)}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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
    </div>
  );
};
