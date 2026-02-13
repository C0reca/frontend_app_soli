import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface DocumentoSistema {
  id: number;
  nome_original: string;
  caminho_ficheiro: string;
  criado_em: string | null;
  processo_id: number | null;
  processo_titulo: string;
  cliente_id: number | null;
  cliente_nome: string;
  tarefa_id: number | null;
  apagado_em: string | null;
  extensao: string;
  tamanho_bytes: number;
}

export interface DocumentosResponse {
  items: DocumentoSistema[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface DocumentoPreview {
  tipo: 'imagem' | 'pdf' | 'html' | 'texto' | 'sem_suporte';
  nome: string;
  url?: string;
  conteudo?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export { formatFileSize };

export const useDocuments = (
  page: number = 1,
  perPage: number = 50,
  search: string = '',
  status: string = 'active',
  searchContent: boolean = false,
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useQuery<DocumentosResponse>({
    queryKey: ['documentos-todos', page, perPage, search, status, searchContent],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('per_page', String(perPage));
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (searchContent) params.set('search_content', 'true');
      const response = await api.get(`/documentos/todos?${params.toString()}`);
      return response.data;
    },
    staleTime: searchContent ? 0 : 30_000,
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/documentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-todos'] });
      toast({
        title: 'Sucesso',
        description: 'Documento movido para a lixeira.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao eliminar documento.',
        variant: 'destructive',
      });
    },
  });

  const restoreDocument = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/documentos/restaurar/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-todos'] });
      toast({
        title: 'Sucesso',
        description: 'Documento restaurado com sucesso.',
      });
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Erro ao restaurar documento.',
        variant: 'destructive',
      });
    },
  });

  const downloadDocument = async (id: number, filename: string) => {
    try {
      const response = await api.get(`/documentos/download/${id}`, {
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
        title: 'Sucesso',
        description: 'Download iniciado.',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao fazer download do documento.',
        variant: 'destructive',
      });
    }
  };

  return {
    documents: data?.items ?? [],
    total: data?.total ?? 0,
    totalPages: data?.total_pages ?? 0,
    page: data?.page ?? 1,
    isLoading,
    isFetching,
    error,
    deleteDocument,
    restoreDocument,
    downloadDocument,
  };
};

export const useDocumentPreview = (documentId: number | null) => {
  return useQuery<DocumentoPreview>({
    queryKey: ['documento-preview', documentId],
    queryFn: async () => {
      const response = await api.get(`/documentos/preview/${documentId}`);
      return response.data;
    },
    enabled: !!documentId,
    staleTime: 5 * 60_000,
  });
};
