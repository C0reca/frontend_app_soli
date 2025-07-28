import { Client, IndividualClient, CorporateClient } from '@/hooks/useClients';
import { Employee } from '@/hooks/useEmployees';
import { Process } from '@/hooks/useProcesses';
import { Task } from '@/hooks/useTasks';
import { Template } from '@/hooks/useTemplates';
import { Document } from '@/hooks/useDocuments';
import { DashboardKPIs } from '@/hooks/useDashboard';

export const mockClients: Client[] = [
  {
    id: '1',
    clientType: 'individual',
    internalNumber: 'CLI001',
    responsibleEmployee: 'Ana Costa',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    internalNotes: 'Cliente desde 2024',
    tags: ['heranças', 'registos'],
    
    // Identificação
    fullName: 'João Silva',
    nif: '123456789',
    citizenCardNumber: '12345678 9 ZZ4',
    citizenCardExpiry: '2030-12-31',
    birthDate: '1985-03-15',
    nationality: 'Portuguesa',
    maritalStatus: 'Solteiro',
    profession: 'Engenheiro',
    socialSecurityNumber: '11111111111',
    healthUserNumber: '123456789',
    civilIdentificationNumber: '123456789',
    
    // Contacto
    email: 'joao@email.com',
    mobile: '(11) 99999-9999',
    landline: '',
    address: {
      street: 'Rua das Flores, 123',
      postalCode: '1000-001',
      locality: 'Lisboa',
      district: 'Lisboa',
      country: 'Portugal'
    },
    
    // Documentos
    documents: {
      citizenCardCopy: 'cc_joao_silva.pdf',
      addressProof: 'comprovativo_morada.pdf',
      bankProof: 'iban_joao.pdf'
    },
    
    // Dados Jurídicos/Processuais
    hasLegalRepresentative: false
  } as IndividualClient,
  {
    id: '2',
    clientType: 'corporate',
    internalNumber: 'CLI002',
    responsibleEmployee: 'Carlos Oliveira',
    status: 'active',
    createdAt: '2024-02-10T14:30:00Z',
    internalNotes: 'Cliente estratégico',
    tags: ['fiscal', 'laboral'],
    
    // Identificação
    companyName: 'Empresa B',
    nif: '501234567',
    commercialRegistrationNumber: '501234567',
    legalForm: 'Sociedade Anónima',
    constitutionDate: '2020-05-15',
    mainCAE: '62010',
    shareCapital: '50000',
    
    // Representante(s) Legal(is)
    legalRepresentatives: [{
      name: 'Maria Santos',
      nif: '234567890',
      email: 'maria@email.com',
      mobile: '(11) 88888-8888',
      position: 'Administradora'
    }],
    
    // Contacto
    email: 'geral@empresab.pt',
    phone: '(11) 88888-8888',
    address: {
      street: 'Av. da Liberdade, 456',
      postalCode: '1250-001',
      locality: 'Lisboa',
      country: 'Portugal'
    },
    
    // Documentos
    documents: {
      permanentCertificate: 'RNPC501234567',
      iban: 'PT50 0123 4567 8901 2345 6789 0'
    },
    
    // Internos
    businessAreas: ['fiscal', 'laboral'],
    observations: 'Cliente estratégico'
  } as CorporateClient
];

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Ana Costa',
    email: 'ana@empresa.com',
    phone: '(11) 77777-7777',
    position: 'Analista',
    department: 'TI',
    status: 'active',
    createdAt: '2024-01-20T09:00:00Z'
  },
  {
    id: '2',
    name: 'Carlos Oliveira',
    email: 'carlos@empresa.com',
    phone: '(11) 66666-6666',
    position: 'Gerente',
    department: 'Vendas',
    status: 'active',
    createdAt: '2024-02-05T11:15:00Z'
  }
];

export const mockProcesses: Process[] = [
  {
    id: '1',
    name: 'Processo Cliente A',
    client: 'João Silva',
    employee: 'Ana Costa',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2024-03-01T08:00:00Z',
    dueDate: '2024-03-15T18:00:00Z',
    description: 'Processo importante para cliente A'
  },
  {
    id: '2',
    name: 'Processo Cliente B',
    client: 'Maria Santos',
    employee: 'Carlos Oliveira',
    status: 'pending',
    priority: 'medium',
    createdAt: '2024-03-05T10:30:00Z',
    dueDate: '2024-03-20T17:00:00Z'
  }
];

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Revisar documentação',
    description: 'Revisar todos os documentos do processo',
    process: 'Processo Cliente A',
    assignee: 'Ana Costa',
    priority: 'high',
    status: 'in_progress',
    dueDate: '2024-03-10T17:00:00Z',
    createdAt: '2024-03-01T09:00:00Z'
  },
  {
    id: '2',
    title: 'Entrar em contato com cliente',
    description: 'Ligar para confirmar detalhes',
    process: 'Processo Cliente B',
    assignee: 'Carlos Oliveira',
    priority: 'medium',
    status: 'pending',
    dueDate: '2024-03-12T16:00:00Z',
    createdAt: '2024-03-05T11:00:00Z'
  }
];

export const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Template Processo Padrão',
    description: 'Template para processos padrão da empresa',
    category: 'Geral',
    steps: 5,
    estimatedDuration: '2 semanas',
    createdAt: '2024-01-10T10:00:00Z',
    usageCount: 12
  },
  {
    id: '2',
    name: 'Template Processo Urgente',
    description: 'Template para processos urgentes',
    category: 'Urgente',
    steps: 3,
    estimatedDuration: '3 dias',
    createdAt: '2024-02-01T14:00:00Z',
    usageCount: 5
  }
];

export const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Contrato Cliente A.pdf',
    type: 'PDF',
    size: '2.5 MB',
    uploadedBy: 'Ana Costa',
    uploadedAt: '2024-03-01T10:30:00Z',
    process: 'Processo Cliente A',
    status: 'active',
    version: 1
  },
  {
    id: '2',
    name: 'Proposta Cliente B.docx',
    type: 'DOCX',
    size: '1.2 MB',
    uploadedBy: 'Carlos Oliveira',
    uploadedAt: '2024-03-05T15:45:00Z',
    process: 'Processo Cliente B',
    status: 'active',
    version: 1
  }
];

export const mockDocumentTemplates = [
  {
    id: '1',
    name: 'Contrato de Prestação de Serviços',
    description: 'Template padrão para contratos de prestação de serviços com variáveis personalizáveis',
    category: 'Contrato',
    format: 'DOCX',
    size: '45 KB',
    filePath: '/templates/contrato-prestacao-servicos.docx',
    variables: ['nomeCliente', 'nomeEmpresa', 'dataInicio', 'prazo', 'valor', 'descricaoServicos'],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-20T10:30:00Z',
    usageCount: 12
  },
  {
    id: '2',
    name: 'Relatório Mensal de Atividades',
    description: 'Template para relatórios mensais de atividades e progresso de projetos',
    category: 'Relatório',
    format: 'DOCX',
    size: '32 KB',
    filePath: '/templates/relatorio-mensal.docx',
    variables: ['mes', 'ano', 'nomeResponsavel', 'projetos', 'resultados', 'proximosPassos'],
    createdAt: '2024-01-10T09:15:00Z',
    updatedAt: '2024-01-25T14:20:00Z',
    usageCount: 8
  },
  {
    id: '3',
    name: 'Proposta Comercial',
    description: 'Template para propostas comerciais com detalhamento de serviços e valores',
    category: 'Proposta',
    format: 'PDF',
    size: '28 KB',
    filePath: '/templates/proposta-comercial.pdf',
    variables: ['nomeCliente', 'empresa', 'dataValidade', 'servicos', 'investimento', 'condicoes'],
    createdAt: '2024-01-05T11:30:00Z',
    updatedAt: '2024-01-22T16:45:00Z',
    usageCount: 15
  },
  {
    id: '4',
    name: 'Fatura de Serviços',
    description: 'Template para emissão de faturas de serviços prestados',
    category: 'Fatura',
    format: 'PDF',
    size: '22 KB',
    filePath: '/templates/fatura-servicos.pdf',
    variables: ['numeroFatura', 'nomeCliente', 'dataEmissao', 'dataVencimento', 'servicos', 'valor', 'impostos'],
    createdAt: '2024-01-12T07:45:00Z',
    updatedAt: '2024-01-28T13:10:00Z',
    usageCount: 25
  },
  {
    id: '5',
    name: 'Termo de Confidencialidade',
    description: 'Template para acordos de confidencialidade e não divulgação',
    category: 'Contrato',
    format: 'DOCX',
    size: '18 KB',
    filePath: '/templates/termo-confidencialidade.docx',
    variables: ['nomePartes', 'dataAssinatura', 'prazoValidade', 'penalidades'],
    createdAt: '2024-01-08T15:20:00Z',
    updatedAt: '2024-01-18T09:35:00Z',
    usageCount: 6
  }
];

export const mockDashboardKPIs: DashboardKPIs = {
  totalClients: 25,
  activeProcesses: 8,
  completedTasks: 42,
  pendingTasks: 15,
  activeTemplates: 6,
  processCompletionRate: 85
};