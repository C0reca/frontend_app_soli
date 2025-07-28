
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Base client interface
export interface BaseClient {
  id: string;
  clientType: 'individual' | 'corporate';
  internalNumber: string;
  responsibleEmployee: string;
  status: 'active' | 'inactive';
  createdAt: string;
  internalNotes: string;
  tags: string[];
}

// Individual client (Pessoa Singular)
export interface IndividualClient extends BaseClient {
  clientType: 'individual';
  
  // Identificação
  fullName: string;
  nif: string;
  citizenCardNumber: string;
  citizenCardExpiry: string;
  birthDate: string;
  nationality: string;
  maritalStatus: string;
  profession: string;
  socialSecurityNumber: string;
  healthUserNumber: string;
  civilIdentificationNumber: string;
  
  // Contacto
  email: string;
  mobile: string;
  landline: string;
  address: {
    street: string;
    postalCode: string;
    locality: string;
    district: string;
    country: string;
  };
  
  // Documentos
  documents: {
    citizenCardCopy?: string;
    addressProof?: string;
    bankProof?: string;
    digitalSignature?: string;
    otherDocuments?: string[];
  };
  
  // Dados Jurídicos/Processuais
  hasLegalRepresentative: boolean;
  legalRepresentativeName?: string;
  powerOfAttorney?: string;
  legalObservations?: string;
}

// Corporate client (Pessoa Coletiva)
export interface CorporateClient extends BaseClient {
  clientType: 'corporate';
  
  // Identificação
  companyName: string;
  nif: string;
  commercialRegistrationNumber: string;
  legalForm: string;
  constitutionDate: string;
  mainCAE: string;
  shareCapital: string;
  
  // Representante(s) Legal(is)
  legalRepresentatives: Array<{
    name: string;
    nif: string;
    email: string;
    mobile: string;
    position: string;
    appointmentDocument?: string;
  }>;
  
  // Contacto
  email: string;
  phone: string;
  address: {
    street: string;
    postalCode: string;
    locality: string;
    country: string;
  };
  
  // Documentos
  documents: {
    permanentCertificate?: string;
    iban?: string;
    constitutionDeed?: string;
    bylaws?: string;
    otherDocuments?: string[];
  };
  
  // Internos
  businessAreas: string[];
  observations?: string;
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
      return response.data;
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
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
  };
};
