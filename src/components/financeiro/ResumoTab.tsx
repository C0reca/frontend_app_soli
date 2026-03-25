import React from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Users, Car } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinanceiroDashboard } from '@/hooks/useFinanceiroDashboard';


interface ResumoTabProps {
  onNavigateTab: (tab: string) => void;
}

export const ResumoTab: React.FC<ResumoTabProps> = ({ onNavigateTab }) => {
  const { data, isLoading } = useFinanceiroDashboard();

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">A carregar...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigateTab('caixa')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Caixa</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.saldo_caixa)}</div>
            <p className="text-xs text-muted-foreground">Ultimo fecho de caixa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagamentos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(data.total_pagamentos)}</div>
            <p className="text-xs text-muted-foreground">Recebidos de clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Custos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(data.total_custos)}</div>
            <p className="text-xs text-muted-foreground">Despesas e custos</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigateTab('contas')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Devedores</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.total_clientes_com_saldo}</div>
            <p className="text-xs text-muted-foreground">Com saldo pendente</p>
          </CardContent>
        </Card>
      </div>

      {/* Linha 2: Saldo + Reembolsos + Auto-Financeiro */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Global</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.saldo_total)}</div>
            <p className="text-xs text-muted-foreground">Pagamentos - Custos - Reembolsos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reembolsos</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.total_reembolsos)}</div>
            <p className="text-xs text-muted-foreground">Devolvidos a clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registos Automovel</CardTitle>
            <Car className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{data.auto_financeiro.total_registos}</div>
            <div className="flex gap-3 mt-1">
              <span className="text-xs text-green-600">Pago: {formatCurrency(data.auto_financeiro.valor_pago)}</span>
              <span className="text-xs text-orange-600">Pendente: {formatCurrency(data.auto_financeiro.valor_pendente)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
