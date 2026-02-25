import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileText,
  Trash2,
  Loader2,
  ArrowLeft,
  RotateCcw,
  FileType,
} from 'lucide-react';
import { useDocumentTemplatesLixeira } from '@/hooks/useDocumentTemplates';
import { useAuth } from '@/contexts/AuthContext';

export const TemplatesLixeira: React.FC = () => {
  const { templates, isLoading, restaurarTemplate, eliminarPermanente } = useDocumentTemplatesLixeira();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const filteredTemplates = templates.filter(
    (t) =>
      t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

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

  const handleRestaurar = (id: number) => {
    if (confirm('Restaurar este template?')) {
      restaurarTemplate.mutate(id);
    }
  };

  const handleEliminarPermanente = (id: number) => {
    if (confirm('Tem a certeza que deseja eliminar permanentemente este template? Esta ação não pode ser revertida.')) {
      eliminarPermanente.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/document-templates')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lixeira de Templates</h1>
              <p className="text-gray-600">Templates movidos para a lixeira</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Pesquisar templates na lixeira..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16">
          <Trash2 className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-sm font-medium text-gray-900">Lixeira vazia</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Nenhum template encontrado com esses critérios.'
              : 'Não existem templates na lixeira.'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/document-templates')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar aos Templates
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow border-amber-200/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <CardTitle className="text-lg text-gray-700">{template.nome}</CardTitle>
                  </div>
                  <div className="flex gap-1.5">
                    {template.tipo_template === 'pdf_overlay' && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5">
                        <FileType className="h-3 w-3 mr-0.5" />
                        PDF
                      </Badge>
                    )}
                    <Badge className={getCategoryColor(template.categoria)}>
                      {template.categoria}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.descricao && (
                  <p className="text-sm text-gray-600 line-clamp-2">{template.descricao}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Campos:</span>
                    <p className="font-medium">{template.variaveis?.length || 0} variáveis</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Utilizações:</span>
                    <p className="font-medium">{template.uso_count}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-gray-500">Movido para lixeira em:</span>
                  <p className="font-medium text-amber-700">
                    {template.apagado_em
                      ? new Date(template.apagado_em).toLocaleDateString('pt-PT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestaurar(template.id)}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="Restaurar"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restaurar
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEliminarPermanente(template.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Eliminar permanentemente"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
