import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Upload } from 'lucide-react';
import { useTransacaoDetalhe, useTransacoes } from '@/hooks/useFinanceiro';
import api from '@/services/api';

interface TransacaoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transacaoId: number | null;
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

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-PT');
};

export const TransacaoDetailsModal: React.FC<TransacaoDetailsModalProps> = ({
  isOpen,
  onClose,
  transacaoId,
}) => {
  const { data: transacao, isLoading } = useTransacaoDetalhe(transacaoId);
  const { uploadAnexo, deleteAnexo } = useTransacoes();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadAnexo = async (anexoId: number, nomeOriginal: string) => {
    try {
      const response = await api.get(`/financeiro/transacao/${transacaoId}/anexo/${anexoId}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nomeOriginal);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Error handled by interceptor
    }
  };

  const handleUploadAnexo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && transacaoId) {
      uploadAnexo.mutate({ transacaoId, file });
    }
    e.target.value = '';
  };

  const handleDeleteAnexo = (anexoId: number) => {
    if (transacaoId && window.confirm('Remover este anexo?')) {
      deleteAnexo.mutate({ transacaoId, anexoId });
    }
  };

  const getTipoLabel = (tipo?: string) => {
    switch (tipo) {
      case 'custo': return 'Custo';
      case 'honorario': return 'Honorário';
      case 'despesa': return 'Despesa';
      case 'pagamento': return 'Pagamento';
      case 'reembolso': return 'Reembolso';
      default: return tipo || '-';
    }
  };

  const getTipoBadgeColor = (tipo?: string) => {
    switch (tipo) {
      case 'custo':
      case 'despesa': return 'bg-red-100 text-red-800';
      case 'pagamento':
      case 'honorario': return 'bg-green-100 text-green-800';
      case 'reembolso': return 'bg-blue-100 text-blue-800';
      default: return '';
    }
  };

  const getMetodoLabel = (metodo?: string) => {
    switch (metodo) {
      case 'dinheiro': return 'Dinheiro';
      case 'mb': return 'Multibanco';
      case 'transferencia': return 'Transferencia';
      case 'cheque': return 'Cheque';
      default: return metodo || '-';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Transacao</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">A carregar...</div>
        ) : transacao ? (
          <div className="space-y-4">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Tipo</span>
                <div><Badge className={getTipoBadgeColor(transacao.tipo)}>{getTipoLabel(transacao.tipo)}</Badge></div>
              </div>
              <div>
                <span className="text-muted-foreground">Valor</span>
                <div className="text-lg font-bold">{formatCurrency(transacao.valor)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Data</span>
                <div>{formatDate(transacao.data)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Metodo</span>
                <div>{getMetodoLabel(transacao.metodo_pagamento)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Reconciliacao</span>
                <div>
                  <Badge variant={transacao.estado_reconciliacao === 'reconciliado' ? 'default' : 'outline'}>
                    {transacao.estado_reconciliacao === 'reconciliado' ? 'Reconciliado' : transacao.estado_reconciliacao === 'parcial' ? 'Parcial' : 'Pendente'}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Referencia</span>
                <div>{transacao.referencia || '-'}</div>
              </div>
            </div>

            {transacao.descricao && (
              <div className="text-sm">
                <span className="text-muted-foreground">Descricao</span>
                <p className="mt-1">{transacao.descricao}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div>Criado em: {formatDateTime(transacao.criado_em)}</div>
              {transacao.atualizado_em && <div>Atualizado: {formatDateTime(transacao.atualizado_em)}</div>}
              {transacao.transacao_original_id && <div>Transacao original: #{transacao.transacao_original_id}</div>}
              {transacao.tarefa_id && <div>Tarefa: #{transacao.tarefa_id}</div>}
            </div>

            {/* Anexos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Anexos ({transacao.anexos.length})</span>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3 w-3" />
                  Adicionar
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleUploadAnexo} />
              </div>
              {transacao.anexos.length > 0 && (
                <div className="rounded-md border divide-y">
                  {transacao.anexos.map((a) => (
                    <div key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="truncate flex-1">{a.nome_original}</span>
                      <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadAnexo(a.id, a.nome_original)}>
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAnexo(a.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Transacao nao encontrada.</div>
        )}
      </DialogContent>
    </Dialog>
  );
};
