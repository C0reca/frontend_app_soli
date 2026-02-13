import { Client, IndividualClient, CorporateClient } from '@/hooks/useClients';
import { Employee } from '@/hooks/useEmployees';
import { Process } from '@/hooks/useProcesses';
import { Task } from '@/hooks/useTasks';
import { Template } from '@/hooks/useTemplates';
import { DashboardKPIs } from '@/hooks/useDashboard';

export const mockClients: Client[] = [
  {
    id: '1',
    tipo: 'singular',
    internalNumber: 'CLI001',
    responsibleEmployee: 'Ana Costa',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    internalNotes: 'Cliente desde 2024',
    
    // Dados principais
    nome: 'João Silva',
    email: 'joao@email.com',
    telefone: '(11) 99999-9999',
    
    // Morada
    morada: 'Rua das Flores, 123',
    codigo_postal: '1000-001',
    localidade: 'Lisboa',
    distrito: 'Lisboa',
    pais: 'Portugal',
    
    // Pessoa Singular
    nif: '123456789',
    data_nascimento: '1985-03-15',
    estado_civil: 'Solteiro',
    profissao: 'Engenheiro',
    num_cc: '12345678 9 ZZ4',
    validade_cc: '2030-12-31',
    num_ss: '11111111111',
    num_sns: '123456789',
    num_ident_civil: '123456789',
    nacionalidade: 'Portuguesa',
    
    // Documentos e outros
    iban: 'PT50 0123 4567 8901 2345 6789 0',
    observacoes: 'Cliente desde 2024',
  } as IndividualClient,
  {
    id: '2',
    tipo: 'coletivo',
    internalNumber: 'CLI002',
    responsibleEmployee: 'Carlos Oliveira',
    status: 'active',
    createdAt: '2024-02-10T14:30:00Z',
    internalNotes: 'Cliente estratégico',
    
    // Dados principais
    nome_empresa: 'Empresa B',
    email: 'geral@empresab.pt',
    telefone: '(11) 88888-8888',
    
    // Morada
    morada: 'Av. da Liberdade, 456',
    codigo_postal: '1250-001',
    localidade: 'Lisboa',
    distrito: 'Lisboa',
    pais: 'Portugal',
    
    // Pessoa Coletiva
    nif_empresa: '501234567',
    forma_juridica: 'Sociedade Anónima',
    data_constituicao: '2020-05-15',
    registo_comercial: '501234567',
    cae: '62010',
    capital_social: '50000',
    
    // Representante Legal
    representante_nome: 'Maria Santos',
    representante_nif: '234567890',
    representante_email: 'maria@email.com',
    representante_telemovel: '(11) 88888-8888',
    representante_cargo: 'Administradora',
    
    // Documentos e outros
    iban: 'PT50 0123 4567 8901 2345 6789 0',
    certidao_permanente: 'RNPC501234567',
    observacoes: 'Cliente estratégico',
  } as CorporateClient
];

export const mockEmployees: Employee[] = [
  {
    id: 1,
    nome: 'Ana Costa',
    email: 'ana@empresa.com',
    telefone: '(11) 77777-7777',
    cargo: 'Analista',
    departamento: 'TI',
    criado_em: '2024-01-20T09:00:00Z'
  },
  {
    id: 2,
    nome: 'Carlos Oliveira',
    email: 'carlos@empresa.com',
    telefone: '(11) 66666-6666',
    cargo: 'Gerente',
    departamento: 'Vendas',
    criado_em: '2024-02-05T11:15:00Z'
  }
];

export const mockProcesses: Process[] = [
  {
    id: 1,
    titulo: 'Processo Cliente A',
    descricao: 'Processo importante para cliente A',
    tipo: 'Contrato',
    estado: 'em_curso',
    criado_em: '2024-03-01T08:00:00Z',
    cliente_id: 1,
    funcionario_id: 1,
    cliente: { id: 1, nome: 'João Silva' },
    funcionario: { id: 1, nome: 'Ana Costa' }
  },
  {
    id: 2,
    titulo: 'Processo Cliente B',
    descricao: 'Processo para empresa B',
    tipo: 'Consultoria',
    estado: 'pendente',
    criado_em: '2024-03-05T10:30:00Z',
    cliente_id: 2,
    funcionario_id: 2,
    cliente: { id: 2, nome: 'Empresa B' },
    funcionario: { id: 2, nome: 'Carlos Oliveira' }
  }
];

export const mockTasks: Task[] = [
  {
    id: '1',
    titulo: 'Revisar documentação',
    descricao: 'Revisar todos os documentos do processo',
    processo_id: 1,
    responsavel_id: 1,
    prioridade: 'alta',
    concluida: false,
    data_fim: '2024-03-10T17:00:00Z',
    criado_em: '2024-03-01T09:00:00Z'
  },
  {
    id: '2',
    titulo: 'Entrar em contato com cliente',
    descricao: 'Ligar para confirmar detalhes',
    processo_id: 2,
    responsavel_id: 2,
    prioridade: 'media',
    concluida: false,
    data_fim: '2024-03-12T16:00:00Z',
    criado_em: '2024-03-05T11:00:00Z'
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

export const mockDocuments: any[] = [];

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
  totalClients: 3752,
  activeProcesses: 0,
  completedTasks: 0,
  pendingTasks: 0,
  activeTemplates: 0,
  processCompletionRate: 0
};