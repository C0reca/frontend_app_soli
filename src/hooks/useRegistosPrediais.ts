import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export interface Predio {
  id?: number;
  predio: string;
  freguesia?: string;
  codigo_certidao_permanente?: string;
}

export interface RegistoPredial {
  id: string;
  numero_processo: string;
  cliente_id: number;
  predio: string; // Mantido para compatibilidade
  freguesia: string; // Mantido para compatibilidade
  predios?: Predio[]; // Nova lista de prédios
  registo: string;
  conservatoria: string;
  requisicao: string;
  apresentacao: string;
  data: string;
  apresentacao_complementar?: string;
  data_criacao: string;
  outras_observacoes?: string;
  estado: 'Concluído' | 'Desistência' | 'Recusado' | 'Provisórios';
  cliente?: {
    id: number;
    nome: string;
  };
}

export const useRegistosPrediais = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: registos = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['registos-prediais'],
    queryFn: async () => {
      const response = await api.get('/registos/');
      const normalize = (v: string | null | undefined) => {
        if (!v) return '';
        const s = v.toString().trim().toLowerCase();
        return s
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/\s+/g, ' ');
      };
      const mapEstadoKey = (estado: any) => {
        const e = normalize(estado);
        if (e.includes('concluido')) return 'concluido';
        if (e.includes('desistencia')) return 'desistencia';
        if (e.includes('recusado')) return 'recusado';
        if (e.includes('provisorio')) return 'provisorios';
        if (e.includes('registo')) return 'registo';
        return 'desconhecido';
      };
      return (response.data || []).map((r: any) => ({
        ...r,
        estado_key: mapEstadoKey(r?.estado),
      }));
    },
  });

  const createRegisto = useMutation({
    mutationFn: async (registo: Omit<RegistoPredial, 'id' | 'data_criacao'>) => {
      const response = await api.post('/registos/', registo);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registos-prediais'] });
      toast({
        title: "Sucesso",
        description: "Registo predial criado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar registo predial.",
        variant: "destructive",
      });
    },
  });

  const updateRegisto = useMutation({
    mutationFn: async ({ id, ...registo }: Partial<RegistoPredial> & { id: string }) => {
      const response = await api.put(`/registos/${id}`, registo);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registos-prediais'] });
      toast({
        title: "Sucesso",
        description: "Registo predial atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar registo predial.",
        variant: "destructive",
      });
    },
  });

  const deleteRegisto = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/registos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registos-prediais'] });
      toast({
        title: "Sucesso",
        description: "Registo predial excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir registo predial.",
        variant: "destructive",
      });
    },
  });

  return {
    registos,
    isLoading,
    error,
    createRegisto,
    updateRegisto,
    deleteRegisto,
  };
};