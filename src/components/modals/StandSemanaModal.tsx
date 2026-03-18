/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Car, Lock } from 'lucide-react';
import { useStandSemanaDetails, StandSemana } from '@/hooks/useStandSemanas';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  semana: StandSemana | null;
  onFechar?: (id: number) => void;
}

export const StandSemanaModal: React.FC<Props> = ({ isOpen, onClose, semana, onFechar }) => {
  const { data: detalhes, isLoading } = useStandSemanaDetails(semana?.id);

  if (!semana) return null;

  const data = detalhes || semana;
  const registos = data.registos || [];

  const formatDate = (d?: string) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('pt-PT');
    } catch {
      return d;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Semana {formatDate(data.semana_inicio)} - {formatDate(data.semana_fim)}</span>
          </DialogTitle>
          <DialogDescription>
            Stand: {data.stand_entidade?.nome || `ID ${data.stand_entidade_id}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                {registos.length} registo{registos.length !== 1 ? 's' : ''}
              </p>
              {data.total != null && (
                <p className="text-lg font-bold">{Number(data.total).toFixed(2)} €</p>
              )}
            </div>
            <Badge className={data.estado === 'fechada' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
              {data.estado === 'fechada' ? 'Fechada' : 'Aberta'}
            </Badge>
          </div>

          <Separator />

          {/* Registos */}
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">A carregar registos...</div>
          ) : registos.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Nenhum registo nesta semana</div>
          ) : (
            <div className="space-y-3">
              <h4 className="font-medium">Registos</h4>
              {registos.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Car className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm">{r.matricula || 'Sem matrícula'} {r.marca && `- ${r.marca}`}</p>
                      {r.entidade && <p className="text-xs text-gray-500">{r.entidade.nome}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.valor && <span className="text-sm font-medium">{Number(r.valor).toFixed(2)} €</span>}
                    <Badge className={r.estado_pagamento === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {r.estado_pagamento === 'pago' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.observacoes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium">Observações</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.observacoes}</p>
              </div>
            </>
          )}

          <Separator />

          <div className="flex justify-between">
            {data.estado === 'aberta' && onFechar && (
              <Button
                variant="default"
                onClick={() => {
                  if (confirm('Tem certeza que deseja fechar esta semana? Todos os registos serão marcados como pagos.')) {
                    onFechar(data.id);
                    onClose();
                  }
                }}
              >
                <Lock className="h-4 w-4 mr-2" />
                Fechar Semana
              </Button>
            )}
            <div className="ml-auto">
              <Button variant="outline" onClick={onClose}>Fechar</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
