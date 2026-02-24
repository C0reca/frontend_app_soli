import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ArrowLeft, Save, Loader2, FileType, FileText, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TemplateEditor } from '@/components/editor/TemplateEditor';
import { VariablesSidebar } from '@/components/editor/VariablesSidebar';
import { PdfOverlayEditor } from '@/components/editor/PdfOverlayEditor';
import {
  useDocumentTemplates,
  useDocumentTemplate,
  usePdfInfo,
  PdfPageInfo,
} from '@/hooks/useDocumentTemplates';
import { useCabecalhoTemplates } from '@/hooks/useCabecalhoTemplates';
import type { OverlayFieldData } from '@/components/editor/OverlayFieldRect';

interface TemplateEditorPageProps {
  templateId: number | null; // null = new template
  onBack: () => void;
}

const CATEGORIAS = ['Contrato', 'Requerimento', 'Procuração', 'Declaração', 'Relatório', 'Fatura', 'Outros'];

export const TemplateEditorPage: React.FC<TemplateEditorPageProps> = ({
  templateId,
  onBack,
}) => {
  const { createTemplate, updateTemplate, importDocx, importPdfOverlay } = useDocumentTemplates();
  const { data: existingTemplate, isLoading: loadingTemplate } = useDocumentTemplate(templateId);
  const { data: pdfInfoData } = usePdfInfo(
    existingTemplate?.tipo_template === 'pdf_overlay' && existingTemplate?.has_pdf ? templateId : null,
  );
  const { cabecalhos } = useCabecalhoTemplates();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Outros');
  const [conteudoHtml, setConteudoHtml] = useState('');
  const [cabecalhoTemplateId, setCabecalhoTemplateId] = useState<number | null>(null);
  const [variaveis, setVariaveis] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // PDF overlay state
  const [tipoTemplate, setTipoTemplate] = useState<'html' | 'pdf_overlay'>('html');
  const [overlayFields, setOverlayFields] = useState<OverlayFieldData[]>([]);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pagesInfo, setPagesInfo] = useState<PdfPageInfo[]>([]);
  const [importedPageImages, setImportedPageImages] = useState<Record<number, string> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // PDF import mode choice dialog
  const [pdfChoiceOpen, setPdfChoiceOpen] = useState(false);
  const [pendingPdfFile, setPendingPdfFile] = useState<File | null>(null);
  const [pdfImporting, setPdfImporting] = useState(false);

  // Load existing template data
  useEffect(() => {
    if (existingTemplate) {
      setNome(existingTemplate.nome);
      setDescricao(existingTemplate.descricao || '');
      setCategoria(existingTemplate.categoria);
      setConteudoHtml(existingTemplate.conteudo_html || '');
      setCabecalhoTemplateId(existingTemplate.cabecalho_template_id ?? null);
      setVariaveis(existingTemplate.variaveis || []);
      setTipoTemplate((existingTemplate.tipo_template as 'html' | 'pdf_overlay') || 'html');
      setOverlayFields(existingTemplate.campos_overlay || []);
    }
  }, [existingTemplate]);

  // Load PDF page info for existing overlay templates
  useEffect(() => {
    if (pdfInfoData) {
      setPagesInfo(pdfInfoData.pages);
    }
  }, [pdfInfoData]);

  const handleSave = useCallback(async () => {
    if (!nome.trim()) return;
    setSaving(true);
    try {
      if (tipoTemplate === 'pdf_overlay') {
        // Extract variables from overlay fields
        const overlayVars = overlayFields
          .map((f) => f.variable)
          .filter((v) => v);
        const uniqueVars = [...new Set(overlayVars)];

        if (templateId && existingTemplate) {
          await updateTemplate.mutateAsync({
            id: templateId,
            nome,
            descricao: descricao || undefined,
            categoria,
            tipo_template: 'pdf_overlay',
            campos_overlay: overlayFields,
            variaveis: uniqueVars,
            // Only send pdf_base64 for new uploads (not for existing PDFs)
            ...(pdfBase64 ? { pdf_base64: pdfBase64 } : {}),
          });
        } else {
          await createTemplate.mutateAsync({
            nome,
            descricao: descricao || undefined,
            categoria,
            conteudo_html: '',
            tipo_template: 'pdf_overlay',
            campos_overlay: overlayFields,
            variaveis: uniqueVars,
            pdf_base64: pdfBase64,
          });
        }
      } else {
        // HTML mode (existing behavior)
        if (templateId && existingTemplate) {
          await updateTemplate.mutateAsync({
            id: templateId,
            nome,
            descricao: descricao || undefined,
            categoria,
            conteudo_html: conteudoHtml,
            cabecalho_template_id: cabecalhoTemplateId ?? 0,
            variaveis,
          });
        } else {
          await createTemplate.mutateAsync({
            nome,
            descricao: descricao || undefined,
            categoria,
            conteudo_html: conteudoHtml,
            cabecalho_template_id: cabecalhoTemplateId,
            variaveis,
          });
        }
      }
      onBack();
    } finally {
      setSaving(false);
    }
  }, [nome, descricao, categoria, conteudoHtml, cabecalhoTemplateId, variaveis, templateId, existingTemplate, tipoTemplate, overlayFields, pdfBase64]);

  // Click-to-insert handler for sidebar (HTML mode)
  const handleVariableClick = useCallback((variablePath: string, label: string) => {
    if (tipoTemplate === 'html') {
      const editorContainer = document.querySelector('.template-editor:not(.header-editor)') as HTMLDivElement | null;
      if (editorContainer && (editorContainer as any).__insertVariable) {
        (editorContainer as any).__insertVariable(variablePath, label);
      }
    }
  }, [tipoTemplate]);

  // Import DOCX (for HTML mode)
  const handleImportDocx = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') {
      // Show choice dialog for PDF files
      setPendingPdfFile(file);
      setPdfChoiceOpen(true);
    } else {
      // Word/other docs → HTML mode
      try {
        const result = await importDocx.mutateAsync(file);
        setTipoTemplate('html');
        setConteudoHtml(result.html);
      } catch {
        // error handled by mutation
      }
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [importDocx]);

  // Handle PDF import mode choice
  const handlePdfChoice = useCallback(async (mode: 'html' | 'pdf_overlay') => {
    if (!pendingPdfFile) return;
    setPdfImporting(true);
    try {
      if (mode === 'html') {
        // Extract text → edit in TipTap
        const result = await importDocx.mutateAsync(pendingPdfFile);
        setTipoTemplate('html');
        setConteudoHtml(result.html);
      } else {
        // PDF Overlay mode
        const result = await importPdfOverlay.mutateAsync(pendingPdfFile);
        setTipoTemplate('pdf_overlay');
        setPdfBase64(result.pdf_base64);
        setPagesInfo(result.pages);
        setOverlayFields([]);
        setImportedPageImages(result.page_images);
      }
    } catch {
      // error handled by mutation
    } finally {
      setPdfImporting(false);
      setPdfChoiceOpen(false);
      setPendingPdfFile(null);
    }
  }, [pendingPdfFile, importDocx, importPdfOverlay]);

  // Import PDF specifically for overlay mode
  const handleImportPdf = useCallback(() => {
    pdfInputRef.current?.click();
  }, []);

  const handlePdfSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importPdfOverlay.mutateAsync(file);
      setTipoTemplate('pdf_overlay');
      setPdfBase64(result.pdf_base64);
      setPagesInfo(result.pages);
      setOverlayFields([]);
      setImportedPageImages(result.page_images);
    } catch {
      // error handled by mutation
    }
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  }, [importPdfOverlay]);

  if (templateId && loadingTemplate) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const isPdfOverlay = tipoTemplate === 'pdf_overlay';
  const hasPdfData = isPdfOverlay && (pagesInfo.length > 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-white">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>

        <div className="flex-1 flex items-center gap-3">
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Nome do template..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="font-medium"
            />
          </div>
          <div className="w-48">
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-64">
            <Input
              placeholder="Descrição (opcional)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="text-sm"
            />
          </div>
          {isPdfOverlay && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <FileType className="h-3 w-3 mr-1" />
              PDF Overlay
            </Badge>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving || !nome.trim()}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Guardar
        </Button>
      </div>

      {/* Editor area */}
      <div className="flex-1 min-h-0">
        {isPdfOverlay && hasPdfData ? (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={22} minSize={15} maxSize={35}>
              <VariablesSidebar onVariableClick={handleVariableClick} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={78}>
              <PdfOverlayEditor
                templateId={templateId}
                pagesInfo={pagesInfo}
                fields={overlayFields}
                onFieldsChange={setOverlayFields}
                importedPageImages={importedPageImages}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : isPdfOverlay && !hasPdfData ? (
          /* PDF overlay mode but no PDF loaded yet */
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <FileType className="h-16 w-16 text-gray-300 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-700">Importar PDF</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Importe um ficheiro PDF para posicionar campos de variáveis
                </p>
              </div>
              <Button onClick={handleImportPdf}>
                Importar PDF
              </Button>
            </div>
          </div>
        ) : (
          /* HTML mode */
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={22} minSize={15} maxSize={35}>
              <VariablesSidebar onVariableClick={handleVariableClick} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={78}>
              <div className="h-full overflow-auto p-4 bg-gray-50">
                {/* Header template selector */}
                <div className="mb-3 flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Cabeçalho:
                  </label>
                  <Select
                    value={cabecalhoTemplateId ? String(cabecalhoTemplateId) : 'none'}
                    onValueChange={(val) => setCabecalhoTemplateId(val === 'none' ? null : Number(val))}
                  >
                    <SelectTrigger className="w-64 bg-white">
                      <SelectValue placeholder="Sem cabeçalho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem cabeçalho</SelectItem>
                      {cabecalhos.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {cabecalhoTemplateId && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      Ativo
                    </span>
                  )}
                </div>
                <TemplateEditor
                  content={conteudoHtml}
                  onChange={setConteudoHtml}
                  onVariablesChange={setVariaveis}
                  onImportDocx={handleImportDocx}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* PDF import mode choice dialog */}
      <Dialog open={pdfChoiceOpen} onOpenChange={(open) => {
        if (!open && !pdfImporting) {
          setPdfChoiceOpen(false);
          setPendingPdfFile(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Como deseja importar o PDF?</DialogTitle>
            <DialogDescription>
              Escolha o modo de importação para o ficheiro PDF.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handlePdfChoice('html')}
              disabled={pdfImporting}
              className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="h-10 w-10 text-blue-600" />
              <div className="text-center">
                <p className="font-medium text-sm">Editar Texto</p>
                <p className="text-xs text-gray-500 mt-1">
                  Extrai o texto do PDF para edição livre no editor
                </p>
              </div>
            </button>
            <button
              onClick={() => handlePdfChoice('pdf_overlay')}
              disabled={pdfImporting}
              className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Layers className="h-10 w-10 text-purple-600" />
              <div className="text-center">
                <p className="font-medium text-sm">PDF Overlay</p>
                <p className="text-xs text-gray-500 mt-1">
                  Mantém o PDF original e posiciona campos por cima
                </p>
              </div>
            </button>
          </div>
          {pdfImporting && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-500">A importar...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.doc,.docm,.dotx,.dotm,.dot,.rtf,.odt,.wps,.pdf"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handlePdfSelected}
      />
    </div>
  );
};
