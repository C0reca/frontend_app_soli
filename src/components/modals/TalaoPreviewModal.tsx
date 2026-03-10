import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Printer } from 'lucide-react';
import type { MovimentoCaixa } from '@/hooks/useCaixa';
import { printTalao } from '@/utils/printTalao';

interface TalaoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  movimento: MovimentoCaixa | null;
  clienteNome?: string | null;
  processoTitulo?: string | null;
}

export const TalaoPreviewModal: React.FC<TalaoPreviewModalProps> = ({
  isOpen,
  onClose,
  movimento,
  clienteNome,
  processoTitulo,
}) => {
  const [descricaoExtra, setDescricaoExtra] = useState('');
  const [notasExtra, setNotasExtra] = useState('');
  const [clienteNomeEdit, setClienteNomeEdit] = useState('');
  const [processoTituloEdit, setProcessoTituloEdit] = useState('');

  useEffect(() => {
    if (isOpen && movimento) {
      setDescricaoExtra('');
      setNotasExtra('');
      setClienteNomeEdit(clienteNome || '');
      setProcessoTituloEdit(processoTitulo || '');
    }
  }, [isOpen, movimento, clienteNome, processoTitulo]);

  if (!movimento) return null;

  const valor = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(movimento.valor);

  const dataMovimento = movimento.data
    ? new Date(movimento.data).toLocaleDateString('pt-PT')
    : new Date().toLocaleDateString('pt-PT');

  const tipoLabel = movimento.tipo === 'entrada' ? 'Entrada' : 'Saída';
  const tipoCor = movimento.tipo === 'entrada' ? 'text-green-600' : 'text-red-600';

  const tipoTransferencia = (() => {
    switch (movimento.tipo_transferencia) {
      case 'mb': return 'Multibanco';
      case 'transferencia': return 'Transferência';
      default: return 'Dinheiro';
    }
  })();

  const handlePrint = () => {
    const descricaoFinal = descricaoExtra
      ? `${movimento.descricao}\n${descricaoExtra}`
      : movimento.descricao;

    printTalao(
      { ...movimento, descricao: descricaoFinal },
      {
        clienteNome: clienteNomeEdit || null,
        processoTitulo: processoTituloEdit || null,
        notasExtra: notasExtra || undefined,
      },
    );
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Preview do Talão</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview resumido */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 font-mono text-sm border">
            <div className="text-center border-b pb-2 mb-2">
              <div className="font-bold text-base">TALÃO DE CAIXA</div>
              <div className="text-xs text-gray-500">Comprovativo de Movimento</div>
            </div>

            <div className="text-center py-2">
              <span className={`font-bold text-lg ${tipoCor}`}>{tipoLabel}</span>
              <div className="font-bold text-2xl">{valor}</div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="font-bold">Data:</span>
                <span>{dataMovimento}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Pagamento:</span>
                <span>{tipoTransferencia}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Mov.:</span>
                <span>#{movimento.id}</span>
              </div>
            </div>

            <div className="border-t pt-2 text-xs">
              <div className="font-bold">Descrição:</div>
              <div>{movimento.descricao}</div>
            </div>
          </div>

          {/* Campos editáveis */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Entidade (editável)</Label>
              <Input
                value={clienteNomeEdit}
                onChange={(e) => setClienteNomeEdit(e.target.value)}
                placeholder="Nome da entidade"
              />
            </div>

            <div>
              <Label className="text-sm">Processo (editável)</Label>
              <Input
                value={processoTituloEdit}
                onChange={(e) => setProcessoTituloEdit(e.target.value)}
                placeholder="Título do processo"
              />
            </div>

            <div>
              <Label className="text-sm">Descrição adicional</Label>
              <Textarea
                value={descricaoExtra}
                onChange={(e) => setDescricaoExtra(e.target.value)}
                placeholder="Texto adicional para a descrição..."
                rows={2}
              />
            </div>

            <div>
              <Label className="text-sm">Notas (aparece no rodapé)</Label>
              <Textarea
                value={notasExtra}
                onChange={(e) => setNotasExtra(e.target.value)}
                placeholder="Notas adicionais para o talão..."
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Imprimir Talão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
