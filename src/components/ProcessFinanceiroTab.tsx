import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Eye, Trash2, Pencil, Undo2 } from 'lucide-react';
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
    case 'despesa':
      return <Badge className="bg-red-100 text-red-800">Despesa</Badge>;
    case 'pagamento':
      return <Badge className="bg-green-100 text-green-800">Pagamento</Badge>;
    case 'honorario':
      return <Badge className="bg-green-100 text-green-800">Honorário</Badge>;
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
  const [reembolsoDe, setReembolsoDe] = useState<TransacaoFinanceira | null>(null);

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
        <div className="grid grid-cols-4 gap-2">
          <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
            <span className="text-xs sm:text-sm font-medium text-red-600 flex items-center gap-1">
              <TrendingDown className="h-4 w-4 shrink-0" />
              Custos
            </span>
            <span className="text-lg font-bold text-red-600">{formatCurrency(resumo.total_custos)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
            <span className="text-xs sm:text-sm font-medium text-green-600 flex items-center gap-1">
              <TrendingUp className="h-4 w-4 shrink-0" />
              Pagamentos
            </span>
            <span className="text-lg font-bold text-green-600">{formatCurrency(resumo.total_pagamentos)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
            <span className="text-xs sm:text-sm font-medium text-blue-600 flex items-center gap-1">
              <TrendingUp className="h-4 w-4 shrink-0" />
              Reembolsos
            </span>
            <span className="text-lg font-bold text-blue-600">{formatCurrency(resumo.total_reembolsos)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-4 w-4 shrink-0" />
              Saldo
            </span>
            <span className="text-lg font-bold">{formatCurrency(resumo.saldo)}</span>
          </div>
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
              <TableHead className="text-sm">Data</TableHead>
              <TableHead className="text-sm">Tipo</TableHead>
              <TableHead className="text-sm">Valor</TableHead>
              <TableHead className="text-sm">Descrição</TableHead>
              <TableHead className="text-sm text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  A carregar...
                </TableCell>
              </TableRow>
            ) : transacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Nenhuma transação registada
                </TableCell>
              </TableRow>
            ) : (
              transacoes.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm whitespace-nowrap">{formatDate(t.data)}</TableCell>
                  <TableCell className="text-sm">{getTipoBadge(t.tipo)}</TableCell>
                  <TableCell className="text-sm font-medium whitespace-nowrap">{formatCurrency(t.valor)}</TableCell>
                  <TableCell className="text-sm max-w-[260px] truncate">
                    {t.tarefa_id && <Badge variant="outline" className="text-xs mr-1">Tarefa</Badge>}
                    {t.descricao || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewTransacaoId(t.id)} title="Ver detalhes">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTransacao(t)} title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {t.tipo !== 'reembolso' && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => setReembolsoDe(t)} title="Reembolsar">
                          <Undo2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(t.id)} title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
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
        isOpen={isCreateOpen || !!editTransacao || !!reembolsoDe}
        onClose={() => { setIsCreateOpen(false); setEditTransacao(null); setReembolsoDe(null); }}
        processoId={processoId}
        clienteId={clienteId}
        transacao={editTransacao}
        reembolsoDe={reembolsoDe}
      />
      <TransacaoDetailsModal
        isOpen={!!viewTransacaoId}
        onClose={() => setViewTransacaoId(null)}
        transacaoId={viewTransacaoId}
      />
    </div>
  );
};
