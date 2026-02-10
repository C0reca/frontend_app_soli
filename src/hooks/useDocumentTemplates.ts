import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  format: string;
  size: string;
  filePath: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export const useDocumentTemplates = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: templates = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['document-templates'],
    queryFn: async () => {
      // Mock data for development
      const { mockDocumentTemplates } = await import('@/data/mockData');
      return mockDocumentTemplates;
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
      const response = await api.post('/document-templates/', template);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({
        title: "Sucesso",
        description: "Template de documento criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar template de documento.",
        variant: "destructive",
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...template }: Partial<DocumentTemplate> & { id: string }) => {
      const response = await api.put(`/document-templates/${id}`, template);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({
        title: "Sucesso",
        description: "Template de documento atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar template de documento.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/document-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      toast({
        title: "Sucesso",
        description: "Template de documento excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir template de documento.",
        variant: "destructive",
      });
    },
  });

  const generateDocument = useMutation({
    mutationFn: async ({ templateId, variables }: { templateId: string; variables: Record<string, string> }) => {
      const response = await api.post(`/document-templates/${templateId}/generate`, { variables });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-templates'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Sucesso",
        description: "Documento gerado com sucesso a partir do template.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao gerar documento a partir do template.",
        variant: "destructive",
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
  };
};