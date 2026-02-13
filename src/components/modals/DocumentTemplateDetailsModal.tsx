import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Calendar,
  Hash,
  Tag,
  Variable,
} from 'lucide-react';
import { DocumentTemplateListItem } from '@/hooks/useDocumentTemplates';

interface DocumentTemplateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: DocumentTemplateListItem | null;
}

export const DocumentTemplateDetailsModal: React.FC<DocumentTemplateDetailsModalProps> = ({
  isOpen,
  onClose,
  template,
}) => {
  if (!template) return null;

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Contrato: 'bg-blue-100 text-blue-800',
      Requerimento: 'bg-teal-100 text-teal-800',
      Procuração: 'bg-indigo-100 text-indigo-800',
      Declaração: 'bg-cyan-100 text-cyan-800',
      Relatório: 'bg-green-100 text-green-800',
      Fatura: 'bg-purple-100 text-purple-800',
      Outros: 'bg-gray-100 text-gray-800',
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
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{template.nome}</h3>
              {template.descricao && (
                <p className="text-gray-600 mt-1">{template.descricao}</p>
              )}
            </div>
            <Badge className={getCategoryColor(template.categoria)}>
              {template.categoria}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Criado em</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {template.criado_em
                    ? new Date(template.criado_em).toLocaleDateString('pt-PT')
                    : '-'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  <span>Última atualização</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {template.atualizado_em
                    ? new Date(template.atualizado_em).toLocaleDateString('pt-PT')
                    : '-'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <span>Utilizações</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{template.uso_count}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Variable className="h-4 w-4" />
                  <span>Campos dinâmicos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{template.variaveis?.length || 0}</p>
              </CardContent>
            </Card>
          </div>

          {template.variaveis && template.variaveis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Variable className="h-4 w-4" />
                  <span>Variáveis utilizadas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {template.variaveis.map((v, i) => (
                    <Badge key={i} variant="secondary">
                      {v}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Estas variáveis serão substituídas pelos valores reais ao gerar um documento
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
