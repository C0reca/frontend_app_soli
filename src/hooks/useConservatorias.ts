import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Conservatoria {
  id: number;
  nome: string;
  tipo: string;
  distrito?: string;
  concelho?: string;
  contacto?: string;
  email?: string;
  morada?: string;
  tempo_medio_dias?: number;
  total_registos?: number;
  criado_em?: string;
}

export function useConservatorias(tipo?: string, distrito?: string, search?: string) {
  return useQuery<Conservatoria[]>({
    queryKey: ['conservatorias', tipo, distrito, search],
    queryFn: async () => {
      const params: any = {};
      if (tipo) params.tipo = tipo;
      if (distrito) params.distrito = distrito;
      if (search) params.search = search;
      const { data } = await api.get('/conservatorias', { params });
      return data;
    },
  });
}

export function useDistritos() {
  return useQuery<string[]>({
    queryKey: ['conservatorias-distritos'],
    queryFn: async () => {
      const { data } = await api.get('/conservatorias/distritos');
      return data;
    },
    staleTime: 60_000 * 10,
  });
}

export function useEstimativaConservatoria(nome?: string) {
  return useQuery({
    queryKey: ['conservatoria-estimativa', nome],
    queryFn: async () => {
      const { data } = await api.get(`/conservatorias/estimativa/${encodeURIComponent(nome!)}`);
      return data as { conservatoria: string; tempo_medio_dias: number | null; total_registos_analisados: number; conservatoria_id: number | null };
    },
    enabled: !!nome && nome.length >= 2,
    staleTime: 60_000 * 5,
  });
}

export function useConservatoriaMutations() {
  const qc = useQueryClient();

  const criar = useMutation({
    mutationFn: async (dados: { nome: string; tipo?: string; distrito?: string; concelho?: string; contacto?: string; email?: string; morada?: string }) => {
      const { data } = await api.post('/conservatorias', dados);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conservatorias'] }),
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, ...dados }: { id: number; nome?: string; tipo?: string; distrito?: string; concelho?: string; contacto?: string; email?: string; morada?: string }) => {
      const { data } = await api.put(`/conservatorias/${id}`, dados);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conservatorias'] }),
  });

  const apagar = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/conservatorias/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conservatorias'] }),
  });

  const recalcular = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/conservatorias/recalcular');
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conservatorias'] }),
  });

  return { criar, atualizar, apagar, recalcular };
}
