import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { TemplateEditor } from '@/components/editor/TemplateEditor';
import { VariablesSidebar } from '@/components/editor/VariablesSidebar';
import {
  useDocumentTemplates,
  useDocumentTemplate,
  DocumentTemplateListItem,
} from '@/hooks/useDocumentTemplates';

interface TemplateEditorPageProps {
  templateId: number | null; // null = new template
  onBack: () => void;
}

const CATEGORIAS = ['Contrato', 'Requerimento', 'Procuração', 'Declaração', 'Relatório', 'Fatura', 'Outros'];

export const TemplateEditorPage: React.FC<TemplateEditorPageProps> = ({
  templateId,
  onBack,
}) => {
  const { createTemplate, updateTemplate, importDocx } = useDocumentTemplates();
  const { data: existingTemplate, isLoading: loadingTemplate } = useDocumentTemplate(templateId);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Outros');
  const [conteudoHtml, setConteudoHtml] = useState('');
  const [variaveis, setVariaveis] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing template data
  useEffect(() => {
    if (existingTemplate) {
      setNome(existingTemplate.nome);
      setDescricao(existingTemplate.descricao || '');
      setCategoria(existingTemplate.categoria);
      setConteudoHtml(existingTemplate.conteudo_html || '');
      setVariaveis(existingTemplate.variaveis || []);
    }
  }, [existingTemplate]);

  const handleSave = useCallback(async () => {
    if (!nome.trim()) return;
    setSaving(true);
    try {
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
      onBack();
    } finally {
      setSaving(false);
    }
  }, [nome, descricao, categoria, conteudoHtml, variaveis, templateId, existingTemplate]);

  // Click-to-insert handler for sidebar
  const handleVariableClick = useCallback((variablePath: string, label: string) => {
    const editorContainer = document.querySelector('.template-editor') as HTMLDivElement | null;
    if (editorContainer && (editorContainer as any).__insertVariable) {
      (editorContainer as any).__insertVariable(variablePath, label);
    }
  }, []);

  // Import DOCX
  const handleImportDocx = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importDocx.mutateAsync(file);
      setConteudoHtml(result.html);
    } catch {
      // error handled by mutation
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [importDocx]);

  if (templateId && loadingTemplate) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
      </div>

      {/* Hidden file input for DOCX import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.doc,.docm,.dotx,.dotm,.dot,.rtf,.odt,.wps,.pdf"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  );
};
