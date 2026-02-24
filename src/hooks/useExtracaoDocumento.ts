import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/services/api';

export interface EntidadeExtraida {
  papel?: string;
  nome?: string;
  nif?: string;
  morada?: string;
  codigo_postal?: string;
  localidade?: string;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
  estado_civil?: string;
  entidade_existente_id?: number;
  entidade_existente_nome?: string;
}

export interface ProcessoSugerido {
  titulo_sugerido: string;
  tipo_sugerido: string;
  descricao: string;
}

export interface TarefaSugerida {
  titulo: string;
  descricao: string;
  prioridade: string;
}

export interface ExtracaoResponse {
  entidades: EntidadeExtraida[];
  processo: ProcessoSugerido;
  tarefas_sugeridas: TarefaSugerida[];
  confianca: 'alta' | 'media' | 'baixa';
  notas: string;
}

export function useExtracaoStatus() {
  return useQuery({
    queryKey: ['extracao-status'],
    queryFn: async () => {
      const { data } = await api.get<{ habilitado: boolean }>('/extracao-documento/status');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useExtrairDocumento() {
  return useMutation({
    mutationFn: async ({ ficheiro, tipo_processo }: { ficheiro: File; tipo_processo: string }) => {
      const formData = new FormData();
      formData.append('ficheiro', ficheiro);
      formData.append('tipo_processo', tipo_processo);

      const { data } = await api.post<ExtracaoResponse>('/extracao-documento/extrair', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      return data;
    },
  });
}
