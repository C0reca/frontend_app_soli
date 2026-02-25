
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export interface Representante {
  id: number;
  empresa_id: number;
  cliente_id?: number | null;
  nome?: string;
  nif?: string;
  email?: string;
  telemovel?: string;
  cargo?: string;
  quota_valor?: number | null;
  quota_tipo?: string | null;
  criado_em?: string;
  atualizado_em?: string;
}

// Base client interface (id pode ser number da API ou string)
export interface BaseClient {
  id: string | number;
  tipo?: 'singular' | 'coletivo';
  internalNumber?: string;
  responsibleEmployee?: string;
  status?: 'active' | 'inactive';
  createdAt: string;
  internalNotes: string;
}

// Individual client (Pessoa Singular)
export interface IndividualClient extends BaseClient {
  tipo?: 'singular';
  
  // Dados principais
  nome: string;
  designacao?: string;
  email?: string;
  telefone?: string;
  
  // Morada
  morada?: string;
  codigo_postal?: string;
  localidade?: string;
  concelho?: string;
  distrito?: string;
  pais?: string;
  
  // Pessoa Singular
  nif?: string;
  data_nascimento?: string;
  estado_civil?: string;
  profissao?: string;
  num_cc?: string;
  validade_cc?: string;
  num_ss?: string;
  num_sns?: string;
  num_ident_civil?: string;
  nacionalidade?: string;
  naturalidade_freguesia?: string;
  naturalidade_concelho?: string;

  // Documentos e outros
  iban?: string;
  observacoes?: string;
  senha_financas?: string;
  senha_ss?: string;
  incapacidade?: number;
}

// Corporate client (Pessoa Coletiva)
export interface CorporateClient extends BaseClient {
  tipo?: 'coletivo';
  
  // Dados principais
  nome_empresa: string;
  designacao?: string;
  email?: string;
  telefone?: string;
  
  // Morada
  morada?: string;
  codigo_postal?: string;
  localidade?: string;
  concelho?: string;
  distrito?: string;
  pais?: string;
  
  // Pessoa Coletiva
  nif_empresa?: string;
  forma_juridica?: string;
  data_constituicao?: string;
  registo_comercial?: string;
  cae?: string;
  capital_social?: string;
  
  // Representante Legal (campos legados, mantidos para retrocompatibilidade)
  representante_nome?: string;
  representante_nif?: string;
  representante_email?: string;
  representante_telemovel?: string;
  representante_cargo?: string;

  // Representantes legais (nova relação)
  representantes?: Representante[];

  // Documentos e outros
  iban?: string;
  codigo_rcbe?: string;
  certidao_permanente?: string;
  observacoes?: string;
  senha_financas?: string;
  senha_ss?: string;
  incapacidade?: number;
}

export type Client = IndividualClient | CorporateClient;

/** Tipo efetivo da entidade: infere 'coletivo' quando nome_empresa está preenchido mesmo se tipo for null */
export function getEffectiveTipo(client: Client): 'singular' | 'coletivo' {
  if (client.tipo === 'coletivo') return 'coletivo';
  const nomeEmpresa = (client as CorporateClient).nome_empresa;
  if (nomeEmpresa != null && String(nomeEmpresa).trim() !== '') return 'coletivo';
  return 'singular';
}

export const useClients = () => {
  const queryClient = useQueryClient();

  const {
    data: rawData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const response = await api.get('/clientes');
        const data = response?.data;
        // Garantir que retornamos sempre um array (evita crash se a API devolver objeto ou null)
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        return [];
      } catch {
        // Em caso de erro de rede ou API, devolver array vazio para não quebrar a UI
        return [];
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Garantir que clients é sempre um array (evita crash em .filter, .map, .find)
  const clients = Array.isArray(rawData) ? rawData : [];

  const createClient = useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'createdAt'>) => {
      const response = await api.post('/clientes', client);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...client }: Partial<Client> & { id: string }) => {
      const response = await api.put(`/clientes/${id}`, client);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clientes/${id}`);
      return id;
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['clients'] });
      const previous = queryClient.getQueryData<Client[]>(['clients']);
      queryClient.setQueryData<Client[]>(['clients'], (old) =>
        (old || []).filter((c) => String(c.id) !== String(id))
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['clients'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-duplicates'] });
    },
  });

  return {
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
  };
};

export interface DuplicateGroup {
  nif: string;
  clientes: Client[];
}

export const useDuplicateClients = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['clients-duplicates'],
    queryFn: async () => {
      const response = await api.get('/clientes/duplicados');
      return (response?.data || []) as DuplicateGroup[];
    },
    retry: 1,
  });

  const mergeClients = useMutation({
    mutationFn: async (payload: { manter_id: number; remover_ids: number[]; dados_finais: Record<string, any>; contactos_extra?: { tipo: string; valor: string }[] }) => {
      const response = await api.post('/clientes/merge', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients-duplicates'] });
      // Invalidar cache de dossiês e processos para que os transferidos apareçam
      queryClient.invalidateQueries({ queryKey: ['dossie'] });
      queryClient.invalidateQueries({ queryKey: ['dossies'] });
      queryClient.invalidateQueries({ queryKey: ['processes'] });
    },
  });

  return {
    duplicates: data || [],
    isLoading,
    error,
    mergeClients,
  };
};

export interface NameDuplicateGroup {
  score: number;
  scores: Record<string, number>;
  clientes: Client[];
}

export const useNameDuplicateClients = (threshold: number = 75) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['clients-duplicates-name', threshold],
    queryFn: async () => {
      const response = await api.get(`/clientes/duplicados-nome?threshold=${threshold / 100}`);
      return (response?.data || []) as NameDuplicateGroup[];
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  return {
    nameDuplicates: data || [],
    isLoading,
    error,
  };
};
