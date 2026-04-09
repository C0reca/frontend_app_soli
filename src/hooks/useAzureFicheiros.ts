import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { azureFiles, AzureEntityType } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface AzureFicheiro {
  nome: string;
  tamanho_bytes: number;
  ultima_modificacao: string | null;
  tipo: 'ficheiro' | 'pasta';
  caminho_completo: string;
}

export function useListarFicheiros(tipo: AzureEntityType, id: number | null, subpasta?: string) {
  return useQuery<AzureFicheiro[]>({
    queryKey: ['azure-ficheiros', tipo, id, subpasta ?? ''],
    queryFn: async () => {
      if (!id) return [];
      const res = await azureFiles.listar(tipo, id, subpasta);
      return res.data;
    },
    enabled: !!id,
    staleTime: 30_000,
    retry: 1,
  });
}

export function useUploadFicheiro(tipo: AzureEntityType, id: number | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ ficheiro, subpasta }: { ficheiro: File; subpasta?: string }) => {
      if (!id) throw new Error('ID não definido');
      const res = await azureFiles.upload(tipo, id, ficheiro, subpasta);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['azure-ficheiros', tipo, id] });
      toast({ title: 'Ficheiro enviado', description: variables.ficheiro.name });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao enviar ficheiro';
      toast({ title: 'Erro no upload', description: msg, variant: 'destructive' });
    },
  });
}

export function useApagarFicheiro(tipo: AzureEntityType, id: number | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (caminho: string) => {
      if (!id) throw new Error('ID não definido');
      await azureFiles.apagar(tipo, id, caminho);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['azure-ficheiros', tipo, id] });
      toast({ title: 'Ficheiro apagado' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao apagar ficheiro';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    },
  });
}

export function useConfigurarPasta(tipo: AzureEntityType, id: number | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (azure_folder_path: string) => {
      if (!id) throw new Error('ID não definido');
      const res = await azureFiles.configurarPasta(tipo, id, azure_folder_path);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tipo] });
      toast({ title: 'Pasta Azure configurada' });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || 'Erro ao configurar pasta';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    },
  });
}

export async function downloadFicheiroAzure(tipo: AzureEntityType, id: number, caminho: string) {
  const res = await azureFiles.download(tipo, id, caminho);
  const blob = new Blob([res.data]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = caminho.split('/').pop() || 'ficheiro';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
