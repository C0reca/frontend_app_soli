import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DynamicSelect } from '@/components/ui/DynamicSelect';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useTransacoes } from '@/hooks/useFinanceiro';
import { useAuth } from '@/contexts/AuthContext';
import type { TransacaoFinanceira } from '@/types/financeiro';

const transacaoSchema = z.object({
  tipo: z.string().min(1, 'Selecione um tipo'),
  valor: z.coerce.number().positive('Valor deve ser positivo'),
  descricao: z.string().optional(),
  data: z.string().optional(),
  metodo_pagamento: z.string().optional(),
  referencia: z.string().optional(),
  gerar_movimento_caixa: z.boolean().optional(),
  transacao_original_id: z.coerce.number().optional().nullable(),
  dias_lembrete: z.coerce.number().optional().nullable(),
});

type TransacaoFormData = z.infer<typeof transacaoSchema>;

interface TransacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  processoId?: number | null;
  clienteId: number;
  transacao?: TransacaoFinanceira | null;
  /** Pre-fill as reembolso linked to this transaction */
  reembolsoDe?: TransacaoFinanceira | null;
}

export const TransacaoModal: React.FC<TransacaoModalProps> = ({
  isOpen,
  onClose,
  processoId,
  clienteId,
  transacao,
  reembolsoDe,
}) => {
  const { user } = useAuth();
  const { createTransacao, updateTransacao } = useTransacoes();
  // Fetch transactions for this process (used in reembolso dropdown)
  const { transacoes: transacoesProcesso } = useTransacoes(
    processoId ? { processo_id: processoId } : { cliente_id: clienteId }
  );
  const isEdit = !!transacao;

  const form = useForm<TransacaoFormData>({
    resolver: zodResolver(transacaoSchema),
    defaultValues: {
      tipo: 'honorario',
      valor: 0,
      descricao: '',
      data: new Date().toISOString().slice(0, 10),
      metodo_pagamento: 'dinheiro',
      referencia: '',
      gerar_movimento_caixa: true,
      transacao_original_id: null,
      dias_lembrete: null,
    },
  });

  const tipoValue = form.watch('tipo');

  useEffect(() => {
    if (isOpen) {
      if (transacao) {
        form.reset({
          tipo: transacao.tipo as any,
          valor: Number(transacao.valor),
          descricao: transacao.descricao || '',
          data: transacao.data ? transacao.data.slice(0, 10) : new Date().toISOString().slice(0, 10),
          metodo_pagamento: (transacao.metodo_pagamento as any) || 'dinheiro',
          referencia: transacao.referencia || '',
          gerar_movimento_caixa: true,
          transacao_original_id: transacao.transacao_original_id || null,
          dias_lembrete: null,
        });
      } else if (reembolsoDe) {
        form.reset({
          tipo: 'reembolso',
          valor: Number(reembolsoDe.valor),
          descricao: `Reembolso de: ${reembolsoDe.descricao || `Transação #${reembolsoDe.id}`}`,
          data: new Date().toISOString().slice(0, 10),
          metodo_pagamento: (reembolsoDe.metodo_pagamento as any) || 'dinheiro',
          referencia: '',
          gerar_movimento_caixa: true,
          transacao_original_id: reembolsoDe.id,
          dias_lembrete: 7,
        });
      } else {
        form.reset({
          tipo: 'honorario',
          valor: 0,
          descricao: '',
          data: new Date().toISOString().slice(0, 10),
          metodo_pagamento: 'dinheiro',
          referencia: '',
          gerar_movimento_caixa: true,
          transacao_original_id: null,
          dias_lembrete: null,
        });
      }
    }
  }, [isOpen, transacao, reembolsoDe, form]);

  const onSubmit = async (data: TransacaoFormData) => {
    if (isEdit && transacao) {
      await updateTransacao.mutateAsync({
        id: transacao.id,
        tipo: data.tipo,
        valor: data.valor,
        descricao: data.descricao,
        data: data.data ? new Date(data.data).toISOString() : undefined,
        metodo_pagamento: data.metodo_pagamento,
        referencia: data.referencia,
      });
    } else {
      await createTransacao.mutateAsync({
        processo_id: processoId || undefined,
        cliente_id: clienteId,
        tipo: data.tipo,
        valor: data.valor,
        descricao: data.descricao,
        data: data.data ? new Date(data.data).toISOString() : undefined,
        metodo_pagamento: data.metodo_pagamento,
        referencia: data.referencia,
        criado_por_id: user?.id,
        gerar_movimento_caixa: data.gerar_movimento_caixa,
        transacao_original_id: data.transacao_original_id || undefined,
        dias_lembrete: data.dias_lembrete || undefined,
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[600px] overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Transacao' : 'Nova Transacao Financeira'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Row 1: Tipo + Valor */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <DynamicSelect
                      categoria="tipo_transacao"
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Tipo"
                      fallbackOptions={[
                        { value: "honorario", label: "Honorário" },
                        { value: "despesa", label: "Despesa" },
                        { value: "pagamento", label: "Pagamento" },
                        { value: "reembolso", label: "Reembolso" },
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (EUR) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Data + Metodo */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="metodo_pagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metodo de Pagamento</FormLabel>
                    <DynamicSelect
                      categoria="metodo_pagamento"
                      value={field.value || 'dinheiro'}
                      onValueChange={field.onChange}
                      placeholder="Metodo"
                      fallbackOptions={[
                        { value: "dinheiro", label: "Dinheiro" },
                        { value: "transferencia", label: "Transferência Bancária" },
                        { value: "mb", label: "Multibanco" },
                        { value: "cheque", label: "Cheque" },
                        { value: "outro", label: "Outro" },
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descricao */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descricao</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Referencia */}
            <FormField
              control={form.control}
              name="referencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} placeholder="N.o fatura, recibo, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reembolso: transacao original + dias lembrete */}
            {tipoValue === 'reembolso' && !isEdit && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="transacao_original_id"
                  render={({ field }) => {
                    // Transações elegíveis para reembolso (excluir reembolsos)
                    const elegíveis = transacoesProcesso.filter(
                      (t) => t.tipo !== 'reembolso'
                    );
                    const formatCurr = (v: number) =>
                      new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(v);
                    return (
                      <FormItem>
                        <FormLabel>Transação Original</FormLabel>
                        <Select
                          value={field.value ? String(field.value) : ''}
                          onValueChange={(v) => {
                            const id = Number(v);
                            field.onChange(id || null);
                            // Pre-fill valor from selected transaction
                            const sel = elegíveis.find((t) => t.id === id);
                            if (sel) {
                              form.setValue('valor', Number(sel.valor));
                            }
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar transação..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {elegíveis.map((t) => (
                              <SelectItem key={t.id} value={String(t.id)}>
                                #{t.id} — {t.tipo} — {formatCurr(Number(t.valor))}
                                {t.descricao ? ` — ${t.descricao.slice(0, 30)}` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="dias_lembrete"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dias para Lembrete</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)} placeholder="Ex: 30" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Gerar movimento caixa */}
            {!isEdit && (
              <FormField
                control={form.control}
                name="gerar_movimento_caixa"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Gerar movimento de caixa automaticamente</FormLabel>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={createTransacao.isPending || updateTransacao.isPending}>
                {createTransacao.isPending || updateTransacao.isPending ? 'A guardar...' : isEdit ? 'Guardar' : 'Criar Transacao'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
