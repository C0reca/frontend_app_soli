
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboard } from '@/hooks/useDashboard';
import { FolderOpen, CheckSquare, Clock, TrendingUp, Users } from 'lucide-react';

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

  const completionRate = kpis && kpis.total_processos > 0
    ? Math.round((kpis.concluidos / kpis.total_processos) * 100)
    : 0;

  const kpiCards = [
    {
      title: 'Total de Clientes',
      value: kpis?.total_clientes ?? 0,
      icon: Users,
      description: 'Clientes registados no sistema',
      trend: ''
    },
    {
      title: 'Total de Processos',
      value: kpis?.total_processos ?? 0,
      icon: FolderOpen,
      description: 'Processos registados no sistema',
      trend: ''
    },
    {
      title: 'Processos Ativos',
      value: kpis?.ativos ?? 0,
      icon: Clock,
      description: 'Pendente ou Em curso',
      trend: ''
    },
    {
      title: 'Processos Concluídos',
      value: kpis?.concluidos ?? 0,
      icon: CheckSquare,
      description: 'Estado concluído',
      trend: ''
    },
    {
      title: 'Tarefas Concluídas',
      value: kpis?.tarefas_concluidas ?? 0,
      icon: CheckSquare,
      description: 'Tarefas finalizadas',
      trend: ''
    },
    {
      title: 'Tarefas Pendentes',
      value: kpis?.tarefas_pendentes ?? 0,
      icon: Clock,
      description: 'Tarefas aguardando execução',
      trend: ''
    },
    {
      title: 'Taxa de Conclusão',
      value: `${completionRate}%`,
      icon: TrendingUp,
      description: 'Concluídos / Total',
      trend: ''
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
                {kpi.trend && (
                  <div className="flex items-center mt-2">
                    <span className={`text-xs font-medium ${
                      kpi.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {kpi.trend}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">vs mês anterior</span>
                  </div>
                )}
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
            <div className="space-y-2 text-sm text-gray-700">
              {kpis?.por_estado && Object.entries(kpis.por_estado).map(([estado, count]) => (
                <div key={estado} className="flex items-center justify-between">
                  <span className="capitalize">{estado.replace('_',' ')}</span>
                  <span className="font-semibold">{count}</span>
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
            <div className="space-y-2 text-sm text-gray-700">
              {kpis?.por_funcionario && Object.entries(kpis.por_funcionario).map(([nome, count]) => (
                <div key={nome} className="flex items-center justify-between">
                  <span>{nome}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
