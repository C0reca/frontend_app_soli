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
  FileDown,
  Loader2,
  Info,
  FileUp,
  Variable,
  FileOutput,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useDocumentTemplates, DocumentTemplateListItem } from '@/hooks/useDocumentTemplates';
import { TemplateEditorPage } from '@/components/document-templates/TemplateEditorPage';
import { DocumentTemplateDetailsModal } from '@/components/modals/DocumentTemplateDetailsModal';
import { ApplyTemplateModal } from '@/components/modals/ApplyTemplateModal';

type PageMode = { type: 'list' } | { type: 'editor'; templateId: number | null };

export const DocumentTemplates: React.FC = () => {
  const { templates, isLoading, deleteTemplate } = useDocumentTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [mode, setMode] = useState<PageMode>({ type: 'list' });
  const [detailsTemplate, setDetailsTemplate] = useState<DocumentTemplateListItem | null>(null);
  const [applyTemplate, setApplyTemplate] = useState<DocumentTemplateListItem | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  if (mode.type === 'editor') {
    return (
      <TemplateEditorPage
        templateId={mode.templateId}
        onBack={() => setMode({ type: 'list' })}
      />
    );
  }

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

  const handleDelete = (id: number) => {
    if (confirm('Tem a certeza que deseja eliminar este template?')) {
      deleteTemplate.mutate(id);
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
          <h1 className="text-3xl font-bold text-gray-900">Templates de Documentos</h1>
          <p className="text-gray-600">Crie e reutilize modelos de documentos com campos dinâmicos</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInfo(!showInfo)}
            className="text-blue-600"
          >
            <Info className="mr-1.5 h-4 w-4" />
            {showInfo ? 'Ocultar ajuda' : 'Como funciona?'}
            {showInfo ? <ChevronUp className="ml-1 h-3.5 w-3.5" /> : <ChevronDown className="ml-1 h-3.5 w-3.5" />}
          </Button>
          <Button onClick={() => setMode({ type: 'editor', templateId: null })}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* Painel informativo */}
      {showInfo && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3 mb-4">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">O que são os Templates de Documentos?</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Os Templates de Documentos permitem criar modelos reutilizáveis para gerar documentos como contratos,
                  procurações, requerimentos e outros. Cada template pode conter <strong>variáveis dinâmicas</strong> que
                  são automaticamente preenchidas com os dados do processo, entidade ou sistema no momento da geração.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <div className="flex items-start gap-2.5 bg-white rounded-lg p-3 border border-blue-100">
                <FileUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">1. Criar ou Importar</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Crie um template do zero no editor visual ou importe um ficheiro Word (.docx, .doc) ou PDF existente.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-white rounded-lg p-3 border border-blue-100">
                <Variable className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">2. Adicionar Variáveis</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Arraste variáveis do painel lateral para o documento: dados da entidade, processo, funcionário ou datas do sistema.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-white rounded-lg p-3 border border-blue-100">
                <FileOutput className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">3. Gerar Documento</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Escolha um processo e gere um documento Word (.docx) com todos os campos preenchidos automaticamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-blue-100">
              <p className="text-xs text-gray-500">
                <strong>Variáveis disponíveis:</strong> Entidade (nome, NIF, morada, contactos...) · Processo (título, tipo, estado, datas...) · Funcionário (nome, cargo...) · Entidades secundárias · Sistema (data de hoje, hora, dia da semana...)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Pesquisar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{template.nome}</CardTitle>
                </div>
                <Badge className={getCategoryColor(template.categoria)}>
                  {template.categoria}
                </Badge>
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
                <span className="text-gray-500">Criado em:</span>
                <p className="font-medium">
                  {template.criado_em
                    ? new Date(template.criado_em).toLocaleDateString('pt-PT')
                    : '-'}
                </p>
              </div>

              {template.variaveis && template.variaveis.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.variaveis.slice(0, 4).map((v) => (
                    <Badge key={v} variant="outline" className="text-[10px] px-1.5 py-0">
                      {v}
                    </Badge>
                  ))}
                  {template.variaveis.length > 4 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      +{template.variaveis.length - 4}
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailsTemplate(template)}
                  title="Ver detalhes"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode({ type: 'editor', templateId: template.id })}
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setApplyTemplate(template)}
                  title="Aplicar a processo"
                >
                  <FileDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                  className="text-red-600 hover:text-red-700"
                  title="Eliminar"
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
            {searchTerm
              ? 'Tente ajustar os filtros de pesquisa.'
              : 'Comece criando um novo template.'}
          </p>
          {!searchTerm && (
            <Button
              className="mt-4"
              onClick={() => setMode({ type: 'editor', templateId: null })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Template
            </Button>
          )}
        </div>
      )}

      <DocumentTemplateDetailsModal
        isOpen={!!detailsTemplate}
        onClose={() => setDetailsTemplate(null)}
        template={detailsTemplate}
      />

      <ApplyTemplateModal
        isOpen={!!applyTemplate}
        onClose={() => setApplyTemplate(null)}
        template={applyTemplate}
      />
    </div>
  );
};
