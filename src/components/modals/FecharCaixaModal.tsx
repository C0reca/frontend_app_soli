import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FecharCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedCash: number;
  defaultSaldoMoedas?: number;
  onConfirm: (saldoMoedas: number) => Promise<void> | void;
  isSubmitting?: boolean;
}

export const FecharCaixaModal: React.FC<FecharCaixaModalProps> = ({
  isOpen,
  onClose,
  expectedCash,
  defaultSaldoMoedas = 0,
  onConfirm,
  isSubmitting = false,
}) => {
  const [confirmado, setConfirmado] = useState(false);
  const [saldoMoedas, setSaldoMoedas] = useState<string>(defaultSaldoMoedas.toFixed(2));
  const parsedSaldoMoedas = Number(saldoMoedas);
  const diferenca = Number.isNaN(parsedSaldoMoedas) ? null : parsedSaldoMoedas - expectedCash;

  useEffect(() => {
    if (isOpen) {
      setConfirmado(false);
      setSaldoMoedas(defaultSaldoMoedas.toFixed(2));
    }
  }, [isOpen, defaultSaldoMoedas]);

  const handleConfirm = async () => {
    const valor = Number(saldoMoedas);
    if (Number.isNaN(valor)) {
      return;
    }
    await onConfirm(valor);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
    }).format(value || 0);

  const confirmDisabled = isSubmitting || !confirmado || saldoMoedas.trim() === '' || Number.isNaN(Number(saldoMoedas));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Fechar Caixa</DialogTitle>
          <DialogDescription>
            Confirme o valor em dinheiro físico e indique o saldo de moedas que ficará em caixa para o dia seguinte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTitle>Dinheiro físico esperado</AlertTitle>
            <AlertDescription className="text-lg font-semibold">
              {formatCurrency(expectedCash)}
            </AlertDescription>
          </Alert>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="confirmado"
              checked={confirmado}
              onCheckedChange={(value) => setConfirmado(Boolean(value))}
            />
            <div className="space-y-1">
              <Label htmlFor="confirmado">Confirmei que o dinheiro físico está correto</Label>
              <p className="text-sm text-muted-foreground">
                Só é possível avançar depois de confirmar o dinheiro contado.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="saldo-moedas">Saldo de moedas que ficará no caixa *</Label>
            <Input
              id="saldo-moedas"
              type="number"
              step="0.01"
              value={saldoMoedas}
              onChange={(event) => setSaldoMoedas(event.target.value)}
              placeholder="0.00"
            />
            <p className="text-sm text-muted-foreground">
              Informe quanto em moedas ficará disponível para o arranque do próximo dia.
            </p>
            {diferenca !== null && (
              <p className="text-sm">
                Diferença para o valor esperado:{' '}
                <span className={diferenca === 0 ? 'text-emerald-600' : 'text-amber-600'}>
                  {formatCurrency(diferenca)}
                </span>
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled}
          >
            {isSubmitting ? 'A fechar...' : 'Confirmar fecho'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

