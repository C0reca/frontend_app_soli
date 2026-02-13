import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Eye, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTransacoes } from '@/hooks/useFinanceiro';
import { useResumoFinanceiroProcesso } from '@/hooks/useContaCorrente';
import { TransacaoModal } from '@/components/modals/TransacaoModal';
import { TransacaoDetailsModal } from '@/components/modals/TransacaoDetailsModal';
import type { TransacaoFinanceira } from '@/types/financeiro';

interface ProcessFinanceiroTabProps {
  processoId: number;
  clienteId: number;
}

const formatCurrency = (value: any) => {
  const n = typeof value === 'number' ? value : Number(value) || 0;
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n);
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-PT');
};

const getTipoBadge = (tipo: string) => {
  switch (tipo) {
    case 'custo':
      return <Badge className="bg-red-100 text-red-800">Custo</Badge>;
    case 'pagamento':
      return <Badge className="bg-green-100 text-green-800">Pagamento</Badge>;
    case 'reembolso':
      return <Badge className="bg-blue-100 text-blue-800">Reembolso</Badge>;
    default:
      return <Badge variant="outline">{tipo}</Badge>;
  }
};

const getMetodoLabel = (metodo?: string) => {
  switch (metodo) {
    case 'dinheiro': return 'Dinheiro';
    case 'mb': return 'MB';
    case 'transferencia': return 'Transferencia';
    case 'cheque': return 'Cheque';
    default: return metodo || '-';
  }
};

export const ProcessFinanceiroTab: React.FC<ProcessFinanceiroTabProps> = ({ processoId, clienteId }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTransacao, setEditTransacao] = useState<TransacaoFinanceira | null>(null);
  const [viewTransacaoId, setViewTransacaoId] = useState<number | null>(null);

  const { transacoes, isLoading, deleteTransacao } = useTransacoes({ processo_id: processoId });
  const { data: resumo } = useResumoFinanceiroProcesso(processoId);

  const handleDelete = (id: number) => {
    if (window.confirm('Tem a certeza que pretende eliminar esta transacao?')) {
      deleteTransacao.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Resumo */}
      {resumo && (
        <div className="grid gap-3 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custos</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">{formatCurrency(resumo.total_custos)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600">{formatCurrency(resumo.total_pagamentos)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reembolsos</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-blue-600">{formatCurrency(resumo.total_reembolsos)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatCurrency(resumo.saldo)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <Button size="sm" className="gap-2" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Transacao
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Descricao</TableHead>
              <TableHead>Metodo</TableHead>
              <TableHead>Reconciliacao</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  A carregar...
                </TableCell>
              </TableRow>
            ) : transacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhuma transacao registada
                </TableCell>
              </TableRow>
            ) : (
              transacoes.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{formatDate(t.data)}</TableCell>
                  <TableCell>{getTipoBadge(t.tipo)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(t.valor)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{t.descricao || '-'}</TableCell>
                  <TableCell>{getMetodoLabel(t.metodo_pagamento)}</TableCell>
                  <TableCell>
                    <Badge variant={t.estado_reconciliacao === 'reconciliado' ? 'default' : 'outline'}>
                      {t.estado_reconciliacao === 'reconciliado' ? 'Reconciliado' : t.estado_reconciliacao === 'parcial' ? 'Parcial' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setViewTransacaoId(t.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditTransacao(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <TransacaoModal
        isOpen={isCreateOpen || !!editTransacao}
        onClose={() => { setIsCreateOpen(false); setEditTransacao(null); }}
        processoId={processoId}
        clienteId={clienteId}
        transacao={editTransacao}
      />
      <TransacaoDetailsModal
        isOpen={!!viewTransacaoId}
        onClose={() => setViewTransacaoId(null)}
        transacaoId={viewTransacaoId}
      />
    </div>
  );
};
