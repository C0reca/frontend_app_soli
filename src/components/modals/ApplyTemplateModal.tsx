import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileDown, AlertCircle } from 'lucide-react';
import { ProcessCombobox } from '@/components/ui/processcombobox';
import { useProcesses } from '@/hooks/useProcesses';
import { useDocumentTemplates, DocumentTemplateListItem } from '@/hooks/useDocumentTemplates';

interface ApplyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: DocumentTemplateListItem | null;
}

export const ApplyTemplateModal: React.FC<ApplyTemplateModalProps> = ({
  isOpen,
  onClose,
  template,
}) => {
  const { processes, isLoading: loadingProcesses } = useProcesses();
  const { generateDocument } = useDocumentTemplates();
  const [selectedProcessoId, setSelectedProcessoId] = useState<number | null>(null);

  if (!template) return null;

  const handleGenerate = async () => {
    if (!selectedProcessoId) return;
    try {
      await generateDocument.mutateAsync({
        templateId: template.id,
        processoId: selectedProcessoId,
      });
      onClose();
    } catch {
      // error handled by mutation
    }
  };

  const variableCount = template.variaveis?.length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aplicar Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Template: <span className="font-medium">{template.nome}</span>
            </p>
            {variableCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <AlertCircle className="h-4 w-4" />
                <span>{variableCount} campo(s) dinâmico(s) serão preenchidos automaticamente</span>
              </div>
            )}
          </div>

          <div>
            <Label className="mb-2 block">Selecionar Processo</Label>
            <ProcessCombobox
              processes={processes || []}
              value={selectedProcessoId}
              onChange={setSelectedProcessoId}
              isLoading={loadingProcesses}
            />
          </div>

          {template.variaveis && template.variaveis.length > 0 && (
            <div>
              <Label className="mb-2 block text-sm text-gray-500">Campos que serão preenchidos:</Label>
              <div className="flex flex-wrap gap-1.5">
                {template.variaveis.map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs">
                    {v}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selectedProcessoId || generateDocument.isPending}
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
