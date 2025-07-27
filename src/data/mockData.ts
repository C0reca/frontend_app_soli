import { Client } from '@/hooks/useClients';
import { Employee } from '@/hooks/useEmployees';
import { Process } from '@/hooks/useProcesses';
import { Task } from '@/hooks/useTasks';
import { Template } from '@/hooks/useTemplates';
import { Document } from '@/hooks/useDocuments';
import { DashboardKPIs } from '@/hooks/useDashboard';

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    company: 'Empresa A',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@email.com',
    phone: '(11) 88888-8888',
    company: 'Empresa B',
    status: 'active',
    createdAt: '2024-02-10T14:30:00Z'
  }
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

export const mockDashboardKPIs: DashboardKPIs = {
  totalClients: 25,
  activeProcesses: 8,
  completedTasks: 42,
  pendingTasks: 15,
  activeTemplates: 6,
  processCompletionRate: 85
};