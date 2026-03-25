/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Dialog,
  DialogContent,
  ResizableDialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Car, User, FileText, Calendar, CreditCard, CheckCircle, Download, Paperclip, Trash2 } from 'lucide-react';
import { RegistoAutomovel, useRegistosAutomoveis } from '@/hooks/useRegistosAutomoveis';
import { ClickableClientName } from '@/components/ClickableClientName';
import api from '@/services/api';
import { formatCurrency } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  registo: RegistoAutomovel | null;
}

export const RegistoAutomovelDetailsModal: React.FC<Props> = ({ isOpen, onClose, registo }) => {
  const { deleteAnexo } = useRegistosAutomoveis();

  if (!registo) return null;

  const formatDate = (d?: string) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('pt-PT');
    } catch {
      return d;
    }
  };

  const Field = ({ label, value }: { label: string; value: any }) => (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <p className="text-sm">{value || '-'}</p>
    </div>
  );

  const activeAtos = [
    registo.registo_inicial_propriedade && 'Registo Inicial de Propriedade',
    registo.procedimento_especial && 'Procedimento Especial',
    registo.transferencia_locacao && 'Transferência/Locação',
    registo.declaracao_compra_venda && 'Declaração Compra e Venda',
    registo.reserva_propriedade && 'Reserva de Propriedade',
    registo.rent_a_car && 'Rent-a-Car',
    registo.locacao_financeira && 'Locação Financeira',
    registo.hipoteca && 'Hipoteca',
    registo.penhora && 'Penhora',
    registo.arresto && 'Arresto',
    registo.usufruto && 'Usufruto',
    registo.extincao_registo && 'Extinção de Registo',
    registo.mudanca_residencia && 'Mudança de Residência',
    registo.alteracao_nome && 'Alteração de Nome',
    registo.pedido_2via && 'Pedido 2.ª Via',
    registo.conversao_arresto_penhora && 'Conversão Arresto/Penhora',
    registo.conversao_registo && 'Conversão de Registo',
    registo.apreensao && 'Apreensão',
    registo.acao && 'Ação',
  ].filter(Boolean) as string[];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <ResizableDialogContent storageKey="registo-automovel-details" defaultWidth={768} defaultHeight={Math.round(window.innerHeight * 0.8)} minWidth={400} minHeight={300} className="max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Car className="h-5 w-5" />
            <span>Detalhes do Registo Automóvel</span>
          </DialogTitle>
          <DialogDescription>
            {registo.matricula ? `Matrícula: ${registo.matricula}` : `Registo #${registo.id}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {registo.matricula || 'Sem matrícula'} {registo.marca && `- ${registo.marca}`}
              </h3>
              {registo.entidade && (
                <ClickableClientName
                  clientId={registo.entidade.id}
                  clientName={registo.entidade.nome}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                />
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">
                {registo.tipo === 'stand' ? 'Stand' : 'Particular'}
              </Badge>
              <Badge className={registo.estado_pagamento === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {registo.estado_pagamento === 'pago' ? 'Pago' : 'Pendente'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Veículo */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center"><Car className="h-4 w-4 mr-2" />Veículo</h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Matrícula" value={registo.matricula} />
              <Field label="Marca" value={registo.marca} />
              <Field label="Quota Parte" value={registo.quota_parte} />
              <Field label="N.º Quadro (VIN)" value={registo.quadro_numero} />
            </div>
          </div>

          {/* Pedido */}
          {(registo.numero_pedido || registo.data_pedido) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center"><FileText className="h-4 w-4 mr-2" />Pedido</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="N.º Pedido" value={registo.numero_pedido} />
                  <Field label="Data Pedido" value={formatDate(registo.data_pedido)} />
                  <Field label="Data Publicação" value={formatDate(registo.data_publicacao)} />
                  <Field label="Data Venda de Facto" value={formatDate(registo.data_venda_facto)} />
                  <Field label="Data Contrato" value={formatDate(registo.data_contrato)} />
                </div>
              </div>
            </>
          )}

          {/* Ato */}
          {(registo.numero_apresentacao || registo.valor) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center"><FileText className="h-4 w-4 mr-2" />Ato</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="N.º Apresentação" value={registo.numero_apresentacao} />
                  <Field label="Data Apresentação" value={formatDate(registo.data_apresentacao)} />
                  <Field label="N.º Conta" value={registo.numero_conta} />
                  <Field label="Valor" value={formatCurrency(registo.valor)} />
                  <Field label="Despacho" value={registo.despacho} />
                </div>
              </div>
            </>
          )}

          {/* Atos Requeridos */}
          {activeAtos.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center"><CheckCircle className="h-4 w-4 mr-2" />Atos Requeridos</h4>
                <div className="flex flex-wrap gap-2">
                  {activeAtos.map((ato) => (
                    <Badge key={ato} variant="outline" className="text-xs">{ato}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Sujeito Ativo */}
          {(registo.sa_nome || registo.comprador) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center"><User className="h-4 w-4 mr-2" />Sujeito Ativo (Comprador){registo.comprador ? ` — ${registo.comprador.nome}` : ''}</h4>
                <div className="bg-gray-50 p-3 rounded-lg grid grid-cols-2 gap-4">
                  <Field label="Nome" value={registo.sa_nome} />
                  <Field label="NIF" value={registo.sa_nif} />
                  <Field label="Morada" value={registo.sa_morada} />
                  <Field label="Código Postal" value={registo.sa_codigo_postal} />
                  <Field label="Localidade" value={registo.sa_localidade} />
                  <Field label="Doc. Identificação" value={registo.sa_doc_identificacao} />
                  <Field label="N.º Identificação" value={registo.sa_numero_identificacao} />
                  <Field label="Email" value={registo.sa_email} />
                  <Field label="Telemóvel" value={registo.sa_telemovel} />
                </div>
              </div>
            </>
          )}

          {/* Sujeito Passivo */}
          {(registo.sp_nome || registo.vendedor) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center"><User className="h-4 w-4 mr-2" />Sujeito Passivo (Vendedor){registo.vendedor ? ` — ${registo.vendedor.nome}` : ''}</h4>
                <div className="bg-gray-50 p-3 rounded-lg grid grid-cols-2 gap-4">
                  <Field label="Nome" value={registo.sp_nome} />
                  <Field label="NIF" value={registo.sp_nif} />
                  <Field label="Morada" value={registo.sp_morada} />
                  <Field label="Código Postal" value={registo.sp_codigo_postal} />
                  <Field label="Localidade" value={registo.sp_localidade} />
                  <Field label="Doc. Identificação" value={registo.sp_doc_identificacao} />
                  <Field label="N.º Identificação" value={registo.sp_numero_identificacao} />
                  <Field label="Email" value={registo.sp_email} />
                  <Field label="Telemóvel" value={registo.sp_telemovel} />
                </div>
              </div>
            </>
          )}

          {/* Pagamento IRN */}
          {(registo.entidade_pagamento || registo.referencia_pagamento) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center"><CreditCard className="h-4 w-4 mr-2" />Pagamento IRN</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Entidade" value={registo.entidade_pagamento} />
                  <Field label="Referência" value={registo.referencia_pagamento} />
                  <Field label="Montante" value={formatCurrency(registo.montante)} />
                  <Field label="Valor Pago" value={formatCurrency(registo.valor_pago)} />
                  <Field label="Data Limite" value={formatDate(registo.data_limite_pagamento)} />
                  <Field label="Data Pagamento" value={formatDate(registo.data_pagamento)} />
                </div>
              </div>
            </>
          )}

          {/* Emolumentos */}
          {(registo.emolumento_valor || registo.agravamento_valor || registo.reducao_valor) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Emolumentos</h4>
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Emolumento" value={formatCurrency(registo.emolumento_valor)} />
                  <Field label="Agravamento" value={formatCurrency(registo.agravamento_valor)} />
                  <Field label="Redução" value={formatCurrency(registo.reducao_valor)} />
                </div>
              </div>
            </>
          )}

          {/* Observações */}
          {registo.outras_observacoes && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Observações</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{registo.outras_observacoes}</p>
                </div>
              </div>
            </>
          )}

          {/* Anexos */}
          {registo.anexos && registo.anexos.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center"><Paperclip className="h-4 w-4 mr-2" />Anexos</h4>
                <div className="space-y-2">
                  {registo.anexos.map((anexo) => (
                    <div key={anexo.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{anexo.nome_original}</span>
                        {anexo.tipo && <Badge variant="outline" className="text-xs">{anexo.tipo}</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await api.get(
                                `/registos-automoveis/${registo.id}/anexo/${anexo.id}/download`,
                                { responseType: 'blob' }
                              );
                              const blob = new Blob([response.data]);
                              const a = document.createElement('a');
                              a.href = URL.createObjectURL(blob);
                              a.download = anexo.nome_original;
                              a.click();
                              URL.revokeObjectURL(a.href);
                            } catch {
                              // erro tratado pelo interceptor
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm('Eliminar este anexo?')) {
                              deleteAnexo.mutateAsync({ registoId: registo.id, anexoId: anexo.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Transação Financeira */}
          {registo.estado_pagamento === 'pago' && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-xs">
                <Badge className="bg-green-50 text-green-700">Transação financeira gerada automaticamente</Badge>
                <span className="text-muted-foreground">
                  Ref: [RA#{registo.id}] — Visível no Financeiro {'>'} Movimentos
                </span>
              </div>
            </>
          )}

          {/* Meta */}
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>Criado em: {formatDate(registo.data_criacao)}</div>
            {registo.criado_por && <div>Criado por: {registo.criado_por.nome}</div>}
            {registo.pago_por && <div>Pago por: {registo.pago_por}</div>}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </ResizableDialogContent>
    </Dialog>
  );
};
