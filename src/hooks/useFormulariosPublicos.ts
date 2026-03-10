import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface CampoConfig {
  nome: string;
  label: string;
  tipo: string;
  obrigatorio: boolean;
  opcoes?: string[];
  placeholder?: string;
}

export interface FormularioPublico {
  id: number;
  processo_id?: number;
  cliente_id?: number;
  tipo: string;
  titulo: string;
  descricao?: string;
  token: string;
  campos_config?: CampoConfig[];
  dados_preenchidos?: Record<string, any>;
  estado: string;
  preenchido_em?: string;
  expira_em?: string;
  criado_por_id?: number;
  criado_em?: string;
  processo_titulo?: string;
  cliente_nome?: string;
  criado_por_nome?: string;
}

export function useFormularios(processoId?: number, estado?: string) {
  return useQuery<FormularioPublico[]>({
    queryKey: ['formularios', processoId, estado],
    queryFn: async () => {
      const params: any = {};
      if (processoId) params.processo_id = processoId;
      if (estado && estado !== 'all') params.estado = estado;
      const { data } = await api.get('/formularios', { params });
      return data;
    },
  });
}

export function useFormulario(id: number) {
  return useQuery<FormularioPublico>({
    queryKey: ['formularios', id],
    queryFn: async () => {
      const { data } = await api.get(`/formularios/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useTiposFormulario() {
  return useQuery<Record<string, { titulo_default: string; campos_count: number }>>({
    queryKey: ['formularios-tipos'],
    queryFn: async () => {
      const { data } = await api.get('/formularios/tipos');
      return data;
    },
    staleTime: 60_000 * 5,
  });
}

export function useFormularioMutations() {
  const qc = useQueryClient();

  const criar = useMutation({
    mutationFn: async (dados: {
      processo_id?: number;
      cliente_id?: number;
      tipo: string;
      titulo: string;
      descricao?: string;
      campos_config?: CampoConfig[];
      expira_em?: string;
    }) => {
      const { data } = await api.post('/formularios', dados);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['formularios'] }),
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, ...dados }: { id: number; titulo?: string; descricao?: string; estado?: string; expira_em?: string }) => {
      const { data } = await api.put(`/formularios/${id}`, dados);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['formularios'] }),
  });

  const apagar = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/formularios/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['formularios'] }),
  });

  return { criar, atualizar, apagar };
}
