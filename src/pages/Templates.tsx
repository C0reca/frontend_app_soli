
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileTemplate, Copy, Edit, Trash2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: number;
  estimatedDuration: string;
  createdAt: string;
  usageCount: number;
}

const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Template de Onboarding de Cliente',
    description: 'Processo padrão para integração de novos clientes',
    category: 'Onboarding',
    steps: 8,
    estimatedDuration: '5-7 dias',
    createdAt: '2024-01-10',
    usageCount: 12
  },
  {
    id: '2',
    name: 'Processo de Auditoria Interna',
    description: 'Template para condução de auditorias internas',
    category: 'Auditoria',
    steps: 15,
    estimatedDuration: '2-3 semanas',
    createdAt: '2024-01-08',
    usageCount: 8
  },
  {
    id: '3',
    name: 'Aprovação de Documentos',
    description: 'Fluxo de aprovação para documentos críticos',
    category: 'Aprovação',
    steps: 5,
    estimatedDuration: '2-3 dias',
    createdAt: '2024-01-05',
    usageCount: 25
  }
];

export const Templates: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [templates] = useState<Template[]>(mockTemplates);

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'onboarding':
        return 'bg-blue-100 text-blue-800';
      case 'auditoria':
        return 'bg-purple-100 text-purple-800';
      case 'aprovação':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates de Processos</h1>
          <p className="text-gray-600">Crie e gerencie templates reutilizáveis</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total de Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {templates.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Mais Utilizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {templates.reduce((prev, current) => 
                prev.usageCount > current.usageCount ? prev : current
              ).name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.max(...templates.map(t => t.usageCount))} utilizações
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {new Set(templates.map(t => t.category)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Templates</CardTitle>
          <CardDescription>
            Gerencie seus templates de processos
          </CardDescription>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileTemplate className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-semibold">{template.name}</h3>
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{template.description}</p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Etapas:</span> {template.steps}
                        </div>
                        <div>
                          <span className="font-medium">Duração:</span> {template.estimatedDuration}
                        </div>
                        <div>
                          <span className="font-medium">Utilizações:</span> {template.usageCount}
                        </div>
                        <div>
                          <span className="font-medium">Criado em:</span> {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-1" />
                        Usar
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
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
    </div>
  );
};
