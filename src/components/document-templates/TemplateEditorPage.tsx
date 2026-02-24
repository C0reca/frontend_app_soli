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
import { ArrowLeft, Save, Loader2, FileType } from 'lucide-react';
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

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Outros');
  const [conteudoHtml, setConteudoHtml] = useState('');
  const [variaveis, setVariaveis] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // PDF overlay state
  const [tipoTemplate, setTipoTemplate] = useState<'html' | 'pdf_overlay'>('html');
  const [overlayFields, setOverlayFields] = useState<OverlayFieldData[]>([]);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pagesInfo, setPagesInfo] = useState<PdfPageInfo[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Load existing template data
  useEffect(() => {
    if (existingTemplate) {
      setNome(existingTemplate.nome);
      setDescricao(existingTemplate.descricao || '');
      setCategoria(existingTemplate.categoria);
      setConteudoHtml(existingTemplate.conteudo_html || '');
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
            variaveis,
          });
        } else {
          await createTemplate.mutateAsync({
            nome,
            descricao: descricao || undefined,
            categoria,
            conteudo_html: conteudoHtml,
            variaveis,
          });
        }
      }
      onBack();
    } finally {
      setSaving(false);
    }
  }, [nome, descricao, categoria, conteudoHtml, variaveis, templateId, existingTemplate, tipoTemplate, overlayFields, pdfBase64]);

  // Click-to-insert handler for sidebar (HTML mode)
  const handleVariableClick = useCallback((variablePath: string, label: string) => {
    if (tipoTemplate === 'html') {
      const editorContainer = document.querySelector('.template-editor') as HTMLDivElement | null;
      if (editorContainer && (editorContainer as any).__insertVariable) {
        (editorContainer as any).__insertVariable(variablePath, label);
      }
    }
    // In PDF overlay mode, clicking a variable in the sidebar does nothing special
    // (user drags variables onto the PDF instead)
  }, [tipoTemplate]);

  // Import DOCX (for HTML mode)
  const handleImportDocx = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();

    // If it's a PDF, offer overlay mode
    if (ext === 'pdf') {
      try {
        const result = await importPdfOverlay.mutateAsync(file);
        setTipoTemplate('pdf_overlay');
        setPdfBase64(result.pdf_base64);
        setPagesInfo(result.pages);
        setOverlayFields([]);
      } catch {
        // error handled by mutation
      }
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
  }, [importDocx, importPdfOverlay]);

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
