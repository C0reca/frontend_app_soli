
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Base client interface
export interface BaseClient {
  id: string;
  tipo: 'singular' | 'coletivo';
  internalNumber: string;
  responsibleEmployee: string;
  status: 'active' | 'inactive';
  createdAt: string;
  internalNotes: string;
}

// Individual client (Pessoa Singular)
export interface IndividualClient extends BaseClient {
  tipo: 'singular';
  
  // Dados principais
  nome: string;
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
}

// Corporate client (Pessoa Coletiva)
export interface CorporateClient extends BaseClient {
  tipo: 'coletivo';
  
  // Dados principais
  nome_empresa: string;
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
}

export type Client = IndividualClient | CorporateClient;

interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

interface PaginatedResponse {
  data: Client[];
  total: number;
  page: number;
  totalPages: number;
}

export const useClients = (params?: PaginationParams) => {
  const queryClient = useQueryClient();

  const {
    data: response,
    isLoading,
    error
  } = useQuery({
    queryKey: ['clients', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);
      
      const url = `/clientes${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await api.get<PaginatedResponse>(url);
      return response.data;
    },
  });

  const clients = response?.data || [];
  const total = response?.total || 0;
  const totalPages = response?.totalPages || 0;

  const createClient = useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'createdAt'>) => {
      console.log(client);
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  return {
    clients,
    total,
    totalPages,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
  };
};
