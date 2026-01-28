
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Base client interface
export interface BaseClient {
  id: string;
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

export const useClients = () => {
  const queryClient = useQueryClient();

  const {
    data: clients = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get('/clientes');
      // Handle both paginated and non-paginated responses
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data; // Paginated response
      }
      return response.data || []; // Direct array response
    },
  });

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
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
  };
};
