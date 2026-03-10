import React, { useState, useEffect } from 'react';
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
import { Loader2, FileDown, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ProcessCombobox } from '@/components/ui/processcombobox';
import { useProcesses } from '@/hooks/useProcesses';
import { useDocumentTemplates, DocumentTemplateListItem } from '@/hooks/useDocumentTemplates';
import api from '@/services/api';

interface VariablePreview {
  variavel: string;
  valor: string;
  vazia: boolean;
}

interface PreviewResult {
  variaveis: VariablePreview[];
  vazias: string[];
  preenchidas: string[];
}

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
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Fetch variable preview when process is selected
  useEffect(() => {
    if (!selectedProcessoId || !template?.variaveis?.length) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const res = await api.post(`/documento-templates/${template.id}/preview-variaveis`, {
          processo_id: selectedProcessoId,
        });
        if (!cancelled) setPreview(res.data);
      } catch {
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    };
    fetchPreview();
    return () => { cancelled = true; };
  }, [selectedProcessoId, template?.id, template?.variaveis?.length]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedProcessoId(null);
      setPreview(null);
    }
  }, [isOpen]);

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
  const hasEmptyVars = preview && preview.vazias.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
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

          {/* Variable preview with empty warnings */}
          {selectedProcessoId && variableCount > 0 && (
            <div className="space-y-2">
              {loadingPreview ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>A verificar variáveis...</span>
                </div>
              ) : preview ? (
                <>
                  {hasEmptyVars && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">
                          {preview.vazias.length} variável(eis) sem dados
                        </p>
                        <p className="text-amber-700 mt-0.5">
                          O documento será gerado com campos em branco. Pode continuar ou preencher os dados primeiro.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="max-h-48 overflow-y-auto">
                    <Label className="mb-2 block text-sm text-gray-500">
                      Campos do template:
                    </Label>
                    <div className="space-y-1">
                      {preview.variaveis.map((v) => (
                        <div
                          key={v.variavel}
                          className={`flex items-center justify-between text-xs px-2 py-1.5 rounded ${
                            v.vazia
                              ? 'bg-amber-50 border border-amber-200'
                              : 'bg-green-50 border border-green-200'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {v.vazia ? (
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            )}
                            <span className="font-mono">{v.variavel}</span>
                          </div>
                          <span className={`truncate max-w-[200px] ${v.vazia ? 'text-amber-500 italic' : 'text-gray-600'}`}>
                            {v.vazia ? '(vazio)' : v.valor}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {template.variaveis?.map((v) => (
                    <Badge key={v} variant="secondary" className="text-xs">
                      {v}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fallback: show variables list when no process selected */}
          {!selectedProcessoId && template.variaveis && template.variaveis.length > 0 && (
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
            {hasEmptyVars ? 'Gerar Mesmo Assim' : 'Gerar Documento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
