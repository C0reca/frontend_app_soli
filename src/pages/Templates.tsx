import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Copy, Edit, Trash2 } from 'lucide-react';
import { useTemplates, Template } from '@/hooks/useTemplates';
import { TemplateModal } from '@/components/modals/TemplateModal';

export const Templates: React.FC = () => {
  const { templates, isLoading, deleteTemplate, useTemplate } = useTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleEdit = (template: Template) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      await deleteTemplate.mutateAsync(id);
    }
  };

  const handleUse = async (id: string) => {
    await useTemplate.mutateAsync(id);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
    setIsModalOpen(false);
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
          <h1 className="text-3xl font-bold text-gray-900">Templates de Processos</h1>
          <p className="text-gray-600">Crie e gerencie templates reutilizáveis</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
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
                        <FileText className="h-5 w-5 text-gray-600" />
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
                       <Button variant="outline" size="sm" onClick={() => handleUse(template.id)}>
                         <Copy className="h-4 w-4 mr-1" />
                         Usar
                       </Button>
                       <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(template.id)}>
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

       <TemplateModal
         isOpen={isModalOpen}
         onClose={handleCloseModal}
         template={selectedTemplate}
       />
     </div>
   );
 };
