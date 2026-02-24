import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { OverlayFieldData } from '@/components/editor/OverlayFieldRect';

export interface DocumentTemplate {
  id: number;
  nome: string;
  descricao?: string;
  categoria: string;
  conteudo_html: string;
  variaveis: string[];
  criado_por?: number;
  criado_em: string;
  atualizado_em: string;
  uso_count: number;
  tipo_template: string;
  campos_overlay?: OverlayFieldData[] | null;
  has_pdf: boolean;
}

export interface DocumentTemplateListItem {
  id: number;
  nome: string;
  descricao?: string;
  categoria: string;
  variaveis: string[];
  criado_em: string;
  atualizado_em: string;
  uso_count: number;
  tipo_template: string;
  has_pdf: boolean;
}

export interface PdfPageInfo {
  page: number;
  width: number;
  height: number;
}

export const useDocumentTemplates = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // List all templates (without HTML content)
  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery<DocumentTemplateListItem[]>({
    queryKey: ['documento-templates'],
    queryFn: async () => {
      const response = await api.get('/documento-templates');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Create
  const createTemplate = useMutation({
    mutationFn: async (data: {
      nome: string;
      descricao?: string;
      categoria: string;
      conteudo_html: string;
      variaveis?: string[];
      tipo_template?: string;
      campos_overlay?: OverlayFieldData[] | null;
      pdf_base64?: string | null;
    }) => {
      const response = await api.post('/documento-templates', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documento-templates'] });
      toast({ title: 'Sucesso', description: 'Template criado com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao criar template.', variant: 'destructive' });
    },
  });

  // Update
  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<DocumentTemplate> & { pdf_base64?: string | null }) => {
      const response = await api.put(`/documento-templates/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documento-templates'] });
      toast({ title: 'Sucesso', description: 'Template atualizado com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao atualizar template.', variant: 'destructive' });
    },
  });

  // Delete
  const deleteTemplate = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/documento-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documento-templates'] });
      toast({ title: 'Sucesso', description: 'Template eliminado com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao eliminar template.', variant: 'destructive' });
    },
  });

  // Generate document
  const generateDocument = useMutation({
    mutationFn: async ({
      templateId,
      processoId,
      clienteId,
    }: {
      templateId: number;
      processoId?: number;
      clienteId?: number;
    }) => {
      const response = await api.post(
        `/documento-templates/${templateId}/gerar`,
        { processo_id: processoId, cliente_id: clienteId },
        { responseType: 'blob' },
      );
      return response;
    },
    onSuccess: (response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const disposition = response.headers['content-disposition'] || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch ? filenameMatch[1] : 'documento.docx';
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      queryClient.invalidateQueries({ queryKey: ['documento-templates'] });
      toast({ title: 'Sucesso', description: 'Documento gerado e guardado com sucesso.' });
    },
    onError: () => {
      toast({ title: 'Erro', description: 'Erro ao gerar documento.', variant: 'destructive' });
    },
  });

  // Import DOCX → HTML
  const importDocx = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/documento-templates/importar-docx', formData, {
        headers: { 'Content-Type': undefined },
      });
      return response.data as { html: string; mensagens: string[] };
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'Ficheiro importado com sucesso.' });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      toast({
        title: 'Erro ao importar',
        description: detail || 'Erro ao importar ficheiro. Formatos suportados: .docx, .doc, .pdf',
        variant: 'destructive',
      });
    },
  });

  // Import PDF for overlay mode
  const importPdfOverlay = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/documento-templates/importar-pdf-overlay', formData, {
        headers: { 'Content-Type': undefined },
      });
      return response.data as {
        page_count: number;
        pages: PdfPageInfo[];
        pdf_base64: string;
      };
    },
    onSuccess: () => {
      toast({ title: 'Sucesso', description: 'PDF importado para modo overlay.' });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      toast({
        title: 'Erro ao importar PDF',
        description: detail || 'Erro ao importar PDF.',
        variant: 'destructive',
      });
    },
  });

  return {
    templates,
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    generateDocument,
    importDocx,
    importPdfOverlay,
  };
};

// Separate hook for fetching a single template with HTML content (for the editor)
export const useDocumentTemplate = (id: number | null) => {
  return useQuery<DocumentTemplate>({
    queryKey: ['documento-templates', id],
    queryFn: async () => {
      const response = await api.get(`/documento-templates/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
};

// Hook for getting PDF info for an existing template
export const usePdfInfo = (templateId: number | null) => {
  return useQuery<{ page_count: number; pages: PdfPageInfo[] }>({
    queryKey: ['documento-templates', templateId, 'pdf-info'],
    queryFn: async () => {
      const response = await api.get(`/documento-templates/${templateId}/pdf-info`);
      return response.data;
    },
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  });
};
