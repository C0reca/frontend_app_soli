
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

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
  distrito?: string;
  pais?: string;
  
  // Pessoa Coletiva
  nif_empresa?: string;
  forma_juridica?: string;
  data_constituicao?: string;
  registo_comercial?: string;
  cae?: string;
  capital_social?: string;
  
  // Representante Legal
  representante_nome?: string;
  representante_nif?: string;
  representante_email?: string;
  representante_telemovel?: string;
  representante_cargo?: string;
  
  // Documentos e outros
  iban?: string;
  certidao_permanente?: string;
  observacoes?: string;
  senha_financas?: string;
  senha_ss?: string;
  incapacidade?: number;
}

export type Client = IndividualClient | CorporateClient;

const DEFAULT_PAGE_SIZE = 25;
const LIMIT_FULL = 5000;

export interface UseClientsOptions {
  skip?: number;
  limit?: number;
  search?: string;
}

export const useClients = (options: UseClientsOptions = {}) => {
  const { skip = 0, limit = LIMIT_FULL, search } = options;
  const queryClient = useQueryClient();

  const {
    data: rawData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['clients', skip, limit, search ?? ''],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
        if (search != null && search.trim()) params.set('search', search.trim());
        const response = await api.get(`/clientes?${params.toString()}`);
        const data = response?.data;
        if (data && typeof data === 'object' && 'items' in data) {
          const items = Array.isArray((data as { items?: unknown }).items) ? (data as { items: Client[] }).items : [];
          const total = typeof (data as { total?: number }).total === 'number' ? (data as { total: number }).total : items.length;
          return { items, total };
        }
        if (Array.isArray(data)) return { items: data, total: data.length };
        return { items: [], total: 0 };
      } catch {
        return { items: [], total: 0 };
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  const clients = Array.isArray(rawData?.items) ? rawData.items : [];
  const clientsTotal = typeof rawData?.total === 'number' ? rawData.total : clients.length;

  const createClient = useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'createdAt'>) => {
      const response = await api.post('/clientes', client);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: any) => {
      // Error handling will be done in the component
      throw error;
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
    onError: (error: any) => {
      // Error handling will be done in the component
      throw error;
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clientes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  return {
    clients,
    clientsTotal,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
  };
};
