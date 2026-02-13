import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileDown, Search, FileText, Calendar } from 'lucide-react';
import {
  useDocumentTemplates,
  DocumentTemplateListItem,
} from '@/hooks/useDocumentTemplates';

interface GenerateFromTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  processoId: number;
  processoTitulo?: string;
  onDocumentGenerated?: () => void;
}

export const GenerateFromTemplateModal: React.FC<GenerateFromTemplateModalProps> = ({
  isOpen,
  onClose,
  processoId,
  processoTitulo,
  onDocumentGenerated,
}) => {
  const { templates, isLoading, generateDocument } = useDocumentTemplates();
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplateListItem | null>(null);

  const filteredTemplates = templates.filter((t) => {
    const term = search.toLowerCase();
    return (
      t.nome.toLowerCase().includes(term) ||
      t.categoria.toLowerCase().includes(term) ||
      (t.descricao || '').toLowerCase().includes(term)
    );
  });

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    try {
      await generateDocument.mutateAsync({
        templateId: selectedTemplate.id,
        processoId,
      });
      onDocumentGenerated?.();
      setSelectedTemplate(null);
      setSearch('');
      onClose();
    } catch {
      // error handled by mutation
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerar Documento a partir de Template</DialogTitle>
        </DialogHeader>

        {processoTitulo && (
          <p className="text-sm text-gray-500">
            Processo: <span className="font-medium text-gray-700">{processoTitulo}</span>
          </p>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Template list */}
        <ScrollArea className="max-h-[320px]">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {search ? 'Nenhum template encontrado.' : 'Nenhum template disponível.'}
            </div>
          ) : (
            <div className="space-y-2 pr-2">
              {filteredTemplates.map((template) => {
                const isSelected = selectedTemplate?.id === template.id;
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(isSelected ? null : template)}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-all
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-sm truncate">{template.nome}</span>
                        </div>
                        {template.descricao && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1 ml-6">
                            {template.descricao}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {template.categoria}
                      </Badge>
                    </div>
                    {template.variaveis && template.variaveis.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 ml-6">
                        <span className="text-[10px] text-gray-400">
                          {template.variaveis.length} campo(s)
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selectedTemplate || generateDocument.isPending}
          >
            {generateDocument.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 mr-1" />
            )}
            Gerar Documento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
