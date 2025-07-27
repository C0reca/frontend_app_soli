import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: number;
  estimatedDuration: string;
  createdAt: string;
  usageCount: number;
}

export const useTemplates = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: templates = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const response = await api.get('/templates');
      return response.data;
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<Template, 'id' | 'createdAt' | 'usageCount'>) => {
      const response = await api.post('/templates', template);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Sucesso",
        description: "Template criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar template.",
        variant: "destructive",
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...template }: Partial<Template> & { id: string }) => {
      const response = await api.put(`/templates/${id}`, template);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Sucesso",
        description: "Template atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar template.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Sucesso",
        description: "Template excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir template.",
        variant: "destructive",
      });
    },
  });

  const useTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await api.post(`/templates/${templateId}/use`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({
        title: "Sucesso",
        description: "Processo criado a partir do template.",
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
    useTemplate,
  };
};