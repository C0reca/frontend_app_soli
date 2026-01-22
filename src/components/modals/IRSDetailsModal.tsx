import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, User, Calendar, CheckCircle, Clock, XCircle, Edit, Printer, Download } from 'lucide-react';
import { IRS } from '@/hooks/useIRS';
import { ClickableClientName } from '@/components/ClickableClientName';
import { AgregadoFamiliarTab } from '@/components/AgregadoFamiliarTab';
import { useAgregadoFamiliar } from '@/hooks/useAgregadoFamiliar';

interface IRSDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  irs: IRS | null;
  onEdit?: () => void;
  onGenerateRecibo?: () => void;
}

export const IRSDetailsModal: React.FC<IRSDetailsModalProps> = ({
  isOpen,
  onClose,
  irs,
  onEdit,
  onGenerateRecibo,
}) => {
  const { data: clienteData, isLoading: isLoadingCliente } = useQuery({
    queryKey: ['cliente', irs?.cliente_id],
    queryFn: async () => {
      const response = await api.get(`/clientes/${irs?.cliente_id}`);
      return response.data;
    },
    enabled: !!irs?.cliente_id,
  });

  const { agregado } = useAgregadoFamiliar(irs?.cliente_id || 0);

  if (!irs) return null;

  const getEstadoBadge = (estado: string) => {
    if (estado === 'Pago') {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
    } else if (estado === 'Isento') {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Isento</Badge>;
    } else {
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Por Pagar</Badge>;
    }
  };

  const getFaseLabel = (fase: number) => {
    return fase === 1 ? 'Fase 1 - 20€' : 'Fase 2 - 30€';
  };

  const clienteNome = clienteData?.nome || clienteData?.nome_empresa || irs.cliente?.nome || `Cliente #${irs.cliente_id}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Detalhes do IRS - ${irs.ano}</title>
          <style>
            @media print {
              @page {
                margin: 2cm;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.6;
                color: #000;
              }
              .no-print {
                display: none;
              }
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #000;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              font-size: 18pt;
              margin-bottom: 10px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            h2 {
              font-size: 14pt;
              margin-top: 20px;
              margin-bottom: 10px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin: 15px 0;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
              margin-bottom: 3px;
            }
            .info-value {
              margin-left: 10px;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 3px;
              font-size: 10pt;
              font-weight: bold;
            }
            .badge-pago {
              background-color: #22c55e;
              color: white;
            }
            .badge-isento {
              background-color: #3b82f6;
              color: white;
            }
            .badge-por-pagar {
              border: 1px solid #000;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            table th, table td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: left;
            }
            table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .separator {
              border-top: 1px solid #ccc;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 10px;
              border-top: 1px solid #ccc;
              font-size: 10pt;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>Detalhes do IRS - ${irs.ano}</h1>
          
          <h2>Informações do IRS</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Ano:</div>
              <div class="info-value">${irs.ano}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Fase:</div>
              <div class="info-value">${getFaseLabel(irs.fase)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Estado de Pagamento:</div>
              <div class="info-value">
                <span class="badge ${
                  irs.estado === 'Pago' ? 'badge-pago' : 
                  irs.estado === 'Isento' ? 'badge-isento' : 
                  'badge-por-pagar'
                }">${irs.estado}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Estado de Entrega:</div>
              <div class="info-value">${irs.estado_entrega || '-'}</div>
            </div>
            ${irs.numero_recibo ? `
            <div class="info-item">
              <div class="info-label">Número do Recibo:</div>
              <div class="info-value">${irs.numero_recibo}</div>
            </div>
            ` : ''}
            ${irs.levantar_irs_apos_dia ? `
            <div class="info-item">
              <div class="info-label">Levantar IRS após:</div>
              <div class="info-value">${irs.levantar_irs_apos_dia}</div>
            </div>
            ` : ''}
            <div class="info-item">
              <div class="info-label">Data de Criação:</div>
              <div class="info-value">${new Date(irs.criado_em).toLocaleString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Última Atualização:</div>
              <div class="info-value">${new Date(irs.atualizado_em).toLocaleString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
          </div>

          <h2>Informações do Cliente</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Nome:</div>
              <div class="info-value">${clienteNome}</div>
            </div>
            ${clienteData?.telefone ? `
            <div class="info-item">
              <div class="info-label">Telefone:</div>
              <div class="info-value">${clienteData.telefone}</div>
            </div>
            ` : ''}
            ${clienteData?.nif ? `
            <div class="info-item">
              <div class="info-label">NIF:</div>
              <div class="info-value">${clienteData.nif || (clienteData.nif_empresa || '-')}</div>
            </div>
            ` : ''}
            ${clienteData?.morada ? `
            <div class="info-item" style="grid-column: 1 / -1;">
              <div class="info-label">Morada:</div>
              <div class="info-value">${clienteData.morada}${clienteData.codigo_postal ? ', ' + clienteData.codigo_postal : ''}${clienteData.localidade ? ' ' + clienteData.localidade : ''}</div>
            </div>
            ` : ''}
          </div>

          ${clienteData ? `
          <h2>Agregado Familiar</h2>
          <div class="info-item">
            <div class="info-label">Titular:</div>
            <div class="info-value">${clienteNome}</div>
          </div>
          ${clienteData.nif || clienteData.nif_empresa ? `
          <div class="info-item">
            <div class="info-label">NIF:</div>
            <div class="info-value">${clienteData.nif || clienteData.nif_empresa || '-'}</div>
          </div>
          ` : ''}
          ${clienteData.senha_financas ? `
          <div class="info-item">
            <div class="info-label">Password Finanças:</div>
            <div class="info-value">${clienteData.senha_financas}</div>
          </div>
          ` : ''}
          ${agregado && agregado.length > 0 ? `
          <div class="separator"></div>
          <h3 style="font-size: 12pt; margin-top: 15px; margin-bottom: 10px;">Membros do Agregado Familiar:</h3>
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>NIF</th>
                <th>Relação</th>
              </tr>
            </thead>
            <tbody>
              ${agregado.map((membro: any) => {
                const clienteRel = membro.cliente_relacionado;
                const nomeRel = clienteRel?.tipo === 'singular' 
                  ? (clienteRel.nome || `Cliente #${membro.cliente_relacionado_id}`)
                  : (clienteRel?.nome_empresa || `Cliente #${membro.cliente_relacionado_id}`);
                const nifRel = clienteRel?.tipo === 'singular' 
                  ? (clienteRel.nif || '-')
                  : (clienteRel?.nif_empresa || '-');
                const tipoRel = membro.tipo_relacao === 'esposo' ? 'Esposo' :
                               membro.tipo_relacao === 'esposa' ? 'Esposa' :
                               membro.tipo_relacao === 'filho' ? 'Filho' :
                               membro.tipo_relacao === 'filha' ? 'Filha' :
                               membro.tipo_relacao === 'pai' ? 'Pai' :
                               membro.tipo_relacao === 'mae' ? 'Mãe' : membro.tipo_relacao;
                return `
                  <tr>
                    <td>${nomeRel}</td>
                    <td>${nifRel}</td>
                    <td>${tipoRel}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          ` : '<p style="margin-top: 10px; color: #666;">Sem membros adicionais no agregado familiar.</p>'}
          ` : ''}

          <div class="footer">
            <p>Documento gerado em ${new Date().toLocaleString('pt-PT')}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Aguardar o carregamento e então imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  const handleExportPDF = () => {
    // Por enquanto, usar a mesma função de impressão
    // No futuro, pode ser implementado um endpoint no backend para gerar PDF
    handlePrint();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Detalhes do IRS</span>
              </DialogTitle>
              <DialogDescription>
                IRS {irs.ano} - Fase {irs.fase}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
              {irs.estado === 'Pago' && onGenerateRecibo && (
                <Button variant="outline" size="sm" onClick={onGenerateRecibo}>
                  <FileText className="w-4 h-4 mr-2" />
                  Gerar Recibo
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Principais */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Informações do IRS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Ano</label>
                  <p className="text-sm">{irs.ano}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Fase</label>
                  <p className="text-sm">{getFaseLabel(irs.fase)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Estado de Pagamento</label>
                  <div>{getEstadoBadge(irs.estado)}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Estado de Entrega</label>
                  <p className="text-sm">{irs.estado_entrega || '-'}</p>
                </div>
                {irs.numero_recibo && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Número do Recibo</label>
                    <p className="text-sm font-mono">{irs.numero_recibo}</p>
                  </div>
                )}
                {irs.levantar_irs_apos_dia && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Levantar IRS após</label>
                    <p className="text-sm">{irs.levantar_irs_apos_dia}</p>
                  </div>
                )}
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Data de Criação</label>
                  <p className="text-sm">
                    {new Date(irs.criado_em).toLocaleString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Última Atualização</label>
                  <p className="text-sm">
                    {new Date(irs.atualizado_em).toLocaleString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Cliente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCliente ? (
                <p className="text-sm text-muted-foreground">A carregar...</p>
              ) : (
                <div className="space-y-1">
                  <ClickableClientName 
                    clientId={irs.cliente_id} 
                    client={clienteData}
                    clientName={clienteNome}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  />
                  {clienteData && (
                    <div className="mt-2 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      {clienteData.telefone && (
                        <div>
                          <span className="font-medium">Telefone:</span> {clienteData.telefone}
                        </div>
                      )}
                      {clienteData.morada && (
                        <div>
                          <span className="font-medium">Morada:</span> {clienteData.morada}
                          {clienteData.codigo_postal && `, ${clienteData.codigo_postal}`}
                          {clienteData.localidade && ` ${clienteData.localidade}`}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agregado Familiar */}
          {clienteData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Agregado Familiar</CardTitle>
              </CardHeader>
              <CardContent>
                <AgregadoFamiliarTab 
                  clienteId={irs.cliente_id} 
                  cliente={clienteData}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
