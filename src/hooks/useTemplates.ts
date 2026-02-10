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
      // Mock data for development
      const { mockTemplates } = await import('@/data/mockData');
      return mockTemplates;
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: Omit<Template, 'id' | 'createdAt' | 'usageCount'>) => {
      const response = await api.post('/templates/', template);
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
      // Mock implementation: create a process from template
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Template não encontrado');
      
      const newProcess = {
        name: `Processo baseado em ${template.name}`,
        client: 'Cliente Padrão',
        employee: 'Funcionário Padrão',
        status: 'pending' as const,
        priority: 'medium' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: `Processo criado a partir do template: ${template.description}`
      };
      
      // Simulate API call
      return new Promise(resolve => setTimeout(() => resolve(newProcess), 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      toast({
        title: "Sucesso",
        description: "Processo criado a partir do template com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao usar template.",
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
    useTemplate,
  };
};