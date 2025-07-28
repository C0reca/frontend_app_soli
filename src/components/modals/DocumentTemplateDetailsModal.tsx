import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, 
  Calendar, 
  Download, 
  Edit,
  Hash,
  Tag,
  FileType,
  Variable
} from 'lucide-react';
import { DocumentTemplate } from '@/hooks/useDocumentTemplates';

interface DocumentTemplateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: DocumentTemplate | null;
}

export const DocumentTemplateDetailsModal: React.FC<DocumentTemplateDetailsModalProps> = ({
  isOpen,
  onClose,
  template
}) => {
  if (!template) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Detalhes do Template</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{template.name}</h3>
              <p className="text-gray-600 mt-1">{template.description}</p>
            </div>
            <Badge className={getCategoryColor(template.category)}>
              {template.category}
            </Badge>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <FileType className="h-4 w-4" />
                  <span>Formato</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{template.format}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  <span>Tamanho</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{template.size}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Criado em</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <span>Usos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{template.usageCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Variables */}
          {template.variables && template.variables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Variable className="h-4 w-4" />
                  <span>Variáveis Disponíveis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {template.variables.map((variable, index) => (
                    <Badge key={index} variant="secondary">
                      {variable}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Estas variáveis serão substituídas pelos valores reais ao gerar um documento
                </p>
              </CardContent>
            </Card>
          )}

          {/* File Path */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Caminho do Arquivo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                {template.filePath}
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};