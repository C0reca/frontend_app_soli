
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboard } from '@/hooks/useDashboard';
import { Users, FolderOpen, CheckSquare, Clock, DollarSign, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { kpis, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total de Clientes',
      value: kpis?.totalClients || 45,
      icon: Users,
      description: 'Clientes ativos no sistema',
      trend: '+12%'
    },
    {
      title: 'Processos Ativos',
      value: kpis?.activeProcesses || 23,
      icon: FolderOpen,
      description: 'Processos em andamento',
      trend: '+8%'
    },
    {
      title: 'Tarefas Concluídas',
      value: kpis?.completedTasks || 156,
      icon: CheckSquare,
      description: 'Tarefas finalizadas este mês',
      trend: '+15%'
    },
    {
      title: 'Tarefas Pendentes',
      value: kpis?.pendingTasks || 34,
      icon: Clock,
      description: 'Tarefas aguardando execução',
      trend: '-5%'
    },
    {
      title: 'Receita Mensal',
      value: `€${kpis?.monthlyRevenue || 25000}`,
      icon: DollarSign,
      description: 'Receita do mês atual',
      trend: '+22%'
    },
    {
      title: 'Taxa de Conclusão',
      value: `${kpis?.processCompletionRate || 87}%`,
      icon: TrendingUp,
      description: 'Processos concluídos com sucesso',
      trend: '+3%'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do sistema de gestão de processos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {kpi.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                <p className="text-xs text-gray-600 mt-1">{kpi.description}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-xs font-medium ${
                    kpi.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {kpi.trend}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs mês anterior</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Processos Recentes</CardTitle>
            <CardDescription>Últimos processos criados no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Processo de Onboarding - João Silva', status: 'Em andamento', date: '2 dias' },
                { name: 'Análise Financeira - Empresa ABC', status: 'Pendente', date: '1 dia' },
                { name: 'Auditoria Interna - Q4 2024', status: 'Concluído', date: '3 dias' }
              ].map((process, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-sm">{process.name}</p>
                    <p className="text-xs text-gray-500">há {process.date}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    process.status === 'Concluído' 
                      ? 'bg-green-100 text-green-800'
                      : process.status === 'Em andamento'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {process.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tarefas Urgentes</CardTitle>
            <CardDescription>Tarefas que precisam de atenção imediata</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Revisar contrato Cliente XYZ', priority: 'Alta', due: 'Hoje' },
                { name: 'Aprovar proposta comercial', priority: 'Média', due: 'Amanhã' },
                { name: 'Enviar relatório mensal', priority: 'Alta', due: '2 dias' }
              ].map((task, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-sm">{task.name}</p>
                    <p className="text-xs text-gray-500">Vence em {task.due}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'Alta' 
                      ? 'bg-red-100 text-red-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
