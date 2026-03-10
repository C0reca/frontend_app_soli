import React from 'react';
import { DollarSign, Car, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAutoFinanceiroDashboard, useAutoFinanceiroMutations } from '@/hooks/useAutoFinanceiro';
import { useToast } from '@/hooks/use-toast';

const formatMoney = (v: number) => `${v.toFixed(2)} €`;

export const AutoFinanceiro: React.FC = () => {
  const { data: dashboard, isLoading } = useAutoFinanceiroDashboard();
  const { gerarTransacoesSemana } = useAutoFinanceiroMutations();
  const { toast } = useToast();

  const handleGerarSemana = async (semanaId: number) => {
    try {
      const result = await gerarTransacoesSemana.mutateAsync(semanaId);
      toast({ title: `${result.transacoes_criadas} transações criadas (${formatMoney(result.total_valor)})` });
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.response?.data?.detail, variant: 'destructive' });
    }
  };

  if (isLoading || !dashboard) {
    return <div className="p-6 text-muted-foreground">A carregar...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Financeiro Automóvel
        </h1>
        <p className="text-sm text-muted-foreground">Cruzamento de registos automóveis com transações financeiras</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Car className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{dashboard.total_registos}</p>
              <p className="text-xs text-muted-foreground">Total Registos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{formatMoney(dashboard.valor_total_pago)}</p>
              <p className="text-xs text-muted-foreground">Total Pago</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{formatMoney(dashboard.valor_total_pendente)}</p>
              <p className="text-xs text-muted-foreground">Total Pendente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{dashboard.ultimas_semanas.length}</p>
              <p className="text-xs text-muted-foreground">Semanas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-stand table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo por Stand</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stand</TableHead>
                <TableHead>Registos</TableHead>
                <TableHead>Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.por_stand.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
              ) : (
                dashboard.por_stand.map(s => (
                  <TableRow key={s.entidade_id}>
                    <TableCell className="font-medium">{s.nome}</TableCell>
                    <TableCell>{s.total_registos}</TableCell>
                    <TableCell>{formatMoney(s.valor_total)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Weeks table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimas Semanas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stand</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Registos</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.ultimas_semanas.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem semanas</TableCell></TableRow>
              ) : (
                dashboard.ultimas_semanas.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.stand_nome || '-'}</TableCell>
                    <TableCell className="text-sm">{s.semana_inicio} — {s.semana_fim}</TableCell>
                    <TableCell>{s.registos_count}</TableCell>
                    <TableCell>{formatMoney(s.total)}</TableCell>
                    <TableCell>
                      <Badge variant={s.estado === 'fechada' ? 'default' : 'secondary'}>
                        {s.estado === 'fechada' ? 'Fechada' : 'Aberta'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.estado === 'fechada' && (
                        <Button size="sm" variant="outline" onClick={() => handleGerarSemana(s.id)} disabled={gerarTransacoesSemana.isPending}>
                          Gerar Transações
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
