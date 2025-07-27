import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  process?: string;
  status: 'active' | 'deleted';
  version: number;
  url?: string;
}

export const useDocuments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: documents = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      // Mock data for development
      const { mockDocuments } = await import('@/data/mockData');
      return mockDocuments;
    },
  });

  const uploadDocument = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/documentos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Sucesso",
        description: "Documento enviado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao enviar documento.",
        variant: "destructive",
      });
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/documentos/${id}`, { status: 'deleted' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Sucesso",
        description: "Documento excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir documento.",
        variant: "destructive",
      });
    },
  });

  const restoreDocument = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/documentos/${id}`, { status: 'active' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: "Sucesso",
        description: "Documento restaurado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao restaurar documento.",
        variant: "destructive",
      });
    },
  });

  const downloadDocument = async (id: string, filename: string) => {
    try {
      const response = await api.get(`/documentos/${id}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "Download iniciado.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer download do documento.",
        variant: "destructive",
      });
    }
  };

  return {
    documents,
    isLoading,
    error,
    uploadDocument,
    deleteDocument,
    restoreDocument,
    downloadDocument,
  };
};