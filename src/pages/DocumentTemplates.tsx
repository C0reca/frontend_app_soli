import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  FileText, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates';
import { DocumentTemplateModal } from '@/components/modals/DocumentTemplateModal';
import { DocumentTemplateDetailsModal } from '@/components/modals/DocumentTemplateDetailsModal';

export const DocumentTemplates: React.FC = () => {
  const { templates, isLoading, deleteTemplate } = useDocumentTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const filteredTemplates = templates.filter((template: any) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (template: any) => {
    setSelectedTemplate(template);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      deleteTemplate.mutate(id);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Contrato': 'bg-blue-100 text-blue-800',
      'Relatório': 'bg-green-100 text-green-800',
      'Proposta': 'bg-yellow-100 text-yellow-800',
      'Fatura': 'bg-purple-100 text-purple-800',
      'Outros': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors['Outros'];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates de Documentos</h1>
          <p className="text-gray-600">Gerencie os templates para criação de documentos</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Template
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template: any) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                </div>
                <Badge className={getCategoryColor(template.category)}>
                  {template.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">
                {template.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Formato:</span>
                  <p className="font-medium">{template.format}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tamanho:</span>
                  <p className="font-medium">{template.size}</p>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-gray-500">Criado em:</span>
                <p className="font-medium">
                  {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(template)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhum template encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece criando um novo template.'}
          </p>
        </div>
      )}

      <DocumentTemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
      />

      <DocumentTemplateDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
      />
    </div>
  );
};