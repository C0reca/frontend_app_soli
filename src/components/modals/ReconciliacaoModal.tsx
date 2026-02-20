import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Link2 } from 'lucide-react';
import { useSugestoesReconciliacao } from '@/hooks/useReconciliacao';
import type { MovimentoBancario, TransacaoFinanceira } from '@/types/financeiro';

interface ReconciliacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  movimento: MovimentoBancario | null;
  onReconciliar: (movimentoBancarioId: number, transacaoId: number) => void;
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

export const ReconciliacaoModal: React.FC<ReconciliacaoModalProps> = ({
  isOpen,
  onClose,
  movimento,
  onReconciliar,
}) => {
  const { data: sugestoes = [], isLoading } = useSugestoesReconciliacao(movimento?.id ?? null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleConfirm = () => {
    if (movimento && selectedId) {
      onReconciliar(movimento.id, selectedId);
      setSelectedId(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setSelectedId(null); onClose(); } }}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Reconciliar Movimento Bancario</DialogTitle>
        </DialogHeader>

        {movimento && (
          <div className="rounded-md border p-3 text-sm space-y-1 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="font-medium">Movimento bancario</span>
              <Badge variant={Number(movimento.valor) >= 0 ? 'default' : 'destructive'}>
                {formatCurrency(movimento.valor)}
              </Badge>
            </div>
            <div className="text-muted-foreground">
              {formatDate(movimento.data)} - {movimento.descricao || 'Sem descricao'}
            </div>
            {movimento.referencia && (
              <div className="text-muted-foreground">Ref: {movimento.referencia}</div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Sugestoes de transacoes correspondentes:</p>
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-4">A procurar sugestoes...</div>
          ) : sugestoes.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">Nenhuma transacao correspondente encontrada.</div>
          ) : (
            <div className="rounded-md border max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Descricao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sugestoes.map((t: TransacaoFinanceira) => (
                    <TableRow
                      key={t.id}
                      className={`cursor-pointer ${selectedId === t.id ? 'bg-blue-50' : 'hover:bg-muted/60'}`}
                      onClick={() => setSelectedId(t.id)}
                    >
                      <TableCell>
                        {selectedId === t.id ? (
                          <Check className="h-4 w-4 text-blue-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border" />
                        )}
                      </TableCell>
                      <TableCell>{formatDate(t.data)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {t.tipo === 'custo' ? 'Custo' : t.tipo === 'honorario' ? 'Honorário' : t.tipo === 'despesa' ? 'Despesa' : t.tipo === 'pagamento' ? 'Pagamento' : t.tipo === 'reembolso' ? 'Reembolso' : t.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(t.valor)}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{t.descricao || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setSelectedId(null); onClose(); }}>Cancelar</Button>
          <Button disabled={!selectedId} onClick={handleConfirm} className="gap-2">
            <Link2 className="h-4 w-4" />
            Reconciliar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
