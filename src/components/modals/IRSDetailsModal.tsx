import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, User, Calendar, CheckCircle, Clock, XCircle, Edit, Printer, Download, AlertCircle, History, Plus, ExternalLink } from 'lucide-react';
import { IRS } from '@/hooks/useIRS';
import { ClickableClientName } from '@/components/ClickableClientName';
import { AgregadoFamiliarTab } from '@/components/AgregadoFamiliarTab';
import { useAgregadoFamiliar } from '@/hooks/useAgregadoFamiliar';
import { useIRSTimeline } from '@/hooks/useIRSTimeline';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';

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
  const { data: timeline, isLoading: isLoadingTimeline } = useIRSTimeline(irs?.id);
  const [activeTab, setActiveTab] = useState('details');
  const { updateClient } = useClients();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para modais de edição rápida
  const [isEditingIncapacidade, setIsEditingIncapacidade] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingIBAN, setIsEditingIBAN] = useState(false);
  const [isEditingMemberIncapacidade, setIsEditingMemberIncapacidade] = useState<number | null>(null);
  const [isEditingMemberPassword, setIsEditingMemberPassword] = useState<number | null>(null);
  const [selectedMember, setSelectedMember] = useState<{ id: number; tipoRelacao: string; nome: string } | null>(null);
  
  // Valores temporários para edição
  const [tempIncapacidade, setTempIncapacidade] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [tempIBAN, setTempIBAN] = useState('');

  // Função para registrar histórico
  const registrarHistorico = async (
    acao: string,
    campoAlterado?: string,
    valorAnterior?: string,
    valorNovo?: string,
    detalhes?: string
  ) => {
    if (!irs?.id) return;
    try {
      await api.post(`/irs/${irs.id}/historico`, {
        acao,
        campo_alterado: campoAlterado,
        valor_anterior: valorAnterior,
        valor_novo: valorNovo,
        detalhes,
      });
      queryClient.invalidateQueries({ queryKey: ['irs-timeline', irs.id] });
    } catch (error: any) {
      console.error('Erro ao registrar histórico:', error);
    }
  };

  // Função para atualizar campo do titular
  const handleUpdateTitularField = async (campo: string, valor: string, valorAnterior: string) => {
    if (!clienteData || !irs) return;

    try {
      await updateClient.mutateAsync({
        id: clienteData.id.toString(),
        [campo]: valor,
      });

      await registrarHistorico(
        'alteracao',
        campo,
        valorAnterior || 'Não definido',
        valor || 'Não definido',
        `${campo} do titular atualizado`
      );

      queryClient.invalidateQueries({ queryKey: ['cliente', irs.cliente_id] });
      toast({
        title: 'Sucesso',
        description: `${campo} atualizado com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || `Erro ao atualizar ${campo}.`,
        variant: 'destructive',
      });
    }
  };

  // Função para atualizar campo de membro
  const handleUpdateMemberField = async (membroId: number, campo: string, valor: string, valorAnterior: string, nomeMembro: string) => {
    if (!irs) return;

    try {
      await updateClient.mutateAsync({
        id: membroId.toString(),
        [campo]: valor,
      });

      await registrarHistorico(
        'alteracao',
        campo,
        valorAnterior || 'Não definido',
        valor || 'Não definido',
        `${campo} de ${nomeMembro} atualizado`
      );

      queryClient.invalidateQueries({ queryKey: ['agregado-familiar', irs.cliente_id] });
      toast({
        title: 'Sucesso',
        description: `${campo} atualizado com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || `Erro ao atualizar ${campo}.`,
        variant: 'destructive',
      });
    }
  };

  if (!irs) return null;

  const getAcaoLabel = (acao: string) => {
    const labels: Record<string, string> = {
      'criacao': 'Criação',
      'alteracao': 'Alteração',
      'recibo_gerado': 'Recibo Gerado',
    };
    return labels[acao] || acao;
  };

  const getAcaoIcon = (acao: string) => {
    switch (acao) {
      case 'criacao':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'alteracao':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'recibo_gerado':
        return <FileText className="h-4 w-4 text-purple-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCampoLabel = (campo?: string) => {
    const labels: Record<string, string> = {
      'estado': 'Estado de Pagamento',
      'estado_entrega': 'Estado de Entrega',
      'fase': 'Fase',
      'observacoes': 'Observações',
      'levantar_irs_apos_dia': 'Levantar IRS após',
      'numero_recibo': 'Número do Recibo',
    };
    return labels[campo || ''] || campo || 'Campo';
  };

  const getEstadoBadge = (estado: string) => {
    if (estado === 'Pago') {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
    } else if (estado === 'Isento') {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Isento</Badge>;
    } else {
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Por Pagar</Badge>;
    }
  };

  const getEstadoEntregaBadge = (estadoEntrega?: string) => {
    if (!estadoEntrega) return null;
    
    if (estadoEntrega === 'Enviado') {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Enviado</Badge>;
    } else if (estadoEntrega === 'Levantado Pelo Cliente') {
      return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Levantado Pelo Cliente</Badge>;
    } else if (estadoEntrega === 'Concluído') {
      return <Badge className="bg-purple-500"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
    } else if (estadoEntrega === 'Verificado') {
      return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verificado</Badge>;
    } else if (estadoEntrega === 'Em Análise') {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Em Análise</Badge>;
    } else if (estadoEntrega === 'Contencioso Administrativo') {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800"><XCircle className="w-3 h-3 mr-1" />Contencioso Administrativo</Badge>;
    } else if (estadoEntrega === 'Aguarda Documentos') {
      return <Badge variant="outline" className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" />Aguarda Documentos</Badge>;
    }
    return <Badge variant="outline">{estadoEntrega}</Badge>;
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
            <div class="info-item" style="grid-column: 1 / -1;">
              <div class="info-label">Observações:</div>
              <div class="info-value" style="white-space: pre-wrap;">${irs.observacoes || '-'}</div>
            </div>
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
                const tipoRel = membro.tipo_relacao === 'conjuge' ? 'Cônjuge' :
                               membro.tipo_relacao === 'filho' ? 'Filho' :
                               membro.tipo_relacao === 'filha' ? 'Filha' :
                               membro.tipo_relacao === 'pai' ? 'Pai' :
                               membro.tipo_relacao === 'mae' ? 'Mãe' :
                               membro.tipo_relacao === 'irmao' ? 'Irmão' :
                               membro.tipo_relacao === 'irma' ? 'Irmã' : membro.tipo_relacao;
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="dados-irs">Dados do IRS</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
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
                  <div className="text-sm">
                    {getEstadoEntregaBadge(irs.estado_entrega) || <span className="text-gray-400">-</span>}
                  </div>
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
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Observações</label>
                <p className="text-sm whitespace-pre-wrap">{irs.observacoes || <span className="text-gray-400">-</span>}</p>
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
          </TabsContent>

          <TabsContent value="dados-irs" className="space-y-6 mt-6">
            {clienteData ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Dados do IRS</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Botão de acesso ao site das finanças */}
                  <div className="mb-4 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://www.portaldasfinancas.gov.pt', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Acesso ao Site das Finanças
                    </Button>
                  </div>

                  {/* Tabela com todos os membros */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Relação</TableHead>
                        <TableHead className="text-xs">Incapacidade</TableHead>
                        <TableHead className="text-xs">Nome</TableHead>
                        <TableHead className="text-xs">NIF</TableHead>
                        <TableHead className="text-xs">Password Finanças</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Linha do Titular */}
                      <TableRow>
                        <TableCell className="text-xs font-medium">Titular</TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2">
                            <span>
                              {clienteData.incapacidade !== undefined && clienteData.incapacidade !== null
                                ? `${clienteData.incapacidade}%`
                                : '0,00%'}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => {
                                setTempIncapacidade(clienteData.incapacidade?.toString() || '0');
                                setIsEditingIncapacidade(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {clienteData?.nome || clienteData?.nome_empresa || '-'}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {clienteData?.nif || clienteData?.nif_empresa || '-'}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span>{clienteData?.senha_financas || '-'}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => {
                                setTempPassword(clienteData?.senha_financas || '');
                                setIsEditingPassword(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Linhas dos membros do agregado familiar */}
                      {agregado && agregado.length > 0 && agregado.map((membro) => {
                        const clienteRelacionado = membro.cliente_relacionado;
                        if (!clienteRelacionado) return null;

                        const getTipoRelacaoLabel = (tipo: string) => {
                          const labels: Record<string, string> = {
                            'conjuge': 'Cônjuge',
                            'filho': 'Filho',
                            'filha': 'Filha',
                            'pai': 'Pai',
                            'mae': 'Mãe',
                            'irmao': 'Irmão',
                            'irma': 'Irmã',
                          };
                          return labels[tipo] || tipo;
                        };

                        const getClienteNome = () => {
                          const tipo = clienteRelacionado.tipo || 'singular';
                          return tipo === 'singular'
                            ? clienteRelacionado.nome
                            : clienteRelacionado.nome_empresa;
                        };

                        const getClienteNIF = () => {
                          const tipo = clienteRelacionado.tipo || 'singular';
                          return tipo === 'singular'
                            ? clienteRelacionado.nif
                            : clienteRelacionado.nif_empresa;
                        };

                        return (
                          <TableRow key={membro.id}>
                            <TableCell className="text-xs">{getTipoRelacaoLabel(membro.tipo_relacao)}</TableCell>
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-2">
                                <span>
                                  {clienteRelacionado.incapacidade !== undefined && clienteRelacionado.incapacidade !== null
                                    ? `${clienteRelacionado.incapacidade}%`
                                    : '0,00%'}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={() => {
                                    const tipo = clienteRelacionado.tipo || 'singular';
                                    const nome = tipo === 'singular' ? clienteRelacionado.nome : clienteRelacionado.nome_empresa;
                                    setTempIncapacidade(clienteRelacionado.incapacidade?.toString() || '0');
                                    setSelectedMember({
                                      id: clienteRelacionado.id,
                                      tipoRelacao: membro.tipo_relacao,
                                      nome: nome || 'Membro'
                                    });
                                    setIsEditingMemberIncapacidade(clienteRelacionado.id);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              {getClienteNome() || '-'}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {getClienteNIF() || '-'}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              <div className="flex items-center gap-2">
                                <span>{clienteRelacionado.senha_financas || '-'}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={() => {
                                    const tipo = clienteRelacionado.tipo || 'singular';
                                    const nome = tipo === 'singular' ? clienteRelacionado.nome : clienteRelacionado.nome_empresa;
                                    setTempPassword(clienteRelacionado.senha_financas || '');
                                    setSelectedMember({
                                      id: clienteRelacionado.id,
                                      tipoRelacao: membro.tipo_relacao,
                                      nome: nome || 'Membro'
                                    });
                                    setIsEditingMemberPassword(clienteRelacionado.id);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* IBAN do titular - aparece na parte de baixo */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">IBAN do Titular</label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => {
                            setTempIBAN(clienteData?.iban || '');
                            setIsEditingIBAN(true);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      </div>
                      <p className="text-sm font-mono">{clienteData?.iban || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>A carregar dados do cliente...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                  <History className="h-4 w-4" />
                  <span>Histórico de Alterações</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTimeline ? (
                  <div className="flex justify-center py-8">
                    <div className="text-muted-foreground">A carregar histórico...</div>
                  </div>
                ) : !timeline || timeline.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma alteração registada ainda.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timeline.map((entry, index) => (
                      <div
                        key={entry.id}
                        className="relative pl-8 pb-4 border-l-2 border-gray-200 last:border-l-0 last:pb-0"
                      >
                        {index < timeline.length - 1 && (
                          <div className="absolute left-[-5px] top-6 w-3 h-3 bg-gray-200 rounded-full" />
                        )}
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getAcaoIcon(entry.acao)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900">
                                {getAcaoLabel(entry.acao)}
                                {entry.campo_alterado && (
                                  <span className="text-gray-600"> - {getCampoLabel(entry.campo_alterado)}</span>
                                )}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {new Date(entry.data_hora).toLocaleString('pt-PT', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {entry.campo_alterado && entry.valor_anterior !== null && entry.valor_novo !== null && (
                              <div className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">De:</span> {entry.valor_anterior || '-'} → <span className="font-medium">Para:</span> {entry.valor_novo || '-'}
                              </div>
                            )}
                            {entry.detalhes && (
                              <p className="mt-1 text-sm text-gray-600">
                                {entry.detalhes}
                              </p>
                            )}
                            {entry.funcionario && (
                              <p className="mt-1 text-xs text-gray-500">
                                Por: {entry.funcionario.nome || entry.funcionario.email || 'Utilizador desconhecido'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Modal de Edição de Incapacidade do Titular */}
      <Dialog open={isEditingIncapacidade} onOpenChange={setIsEditingIncapacidade}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar Incapacidade do Titular</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="incapacidade">Incapacidade (%)</Label>
              <Input
                id="incapacidade"
                type="number"
                min="0"
                max="100"
                value={tempIncapacidade}
                onChange={(e) => setTempIncapacidade(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingIncapacidade(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                const valorAnterior = clienteData?.incapacidade?.toString() || '0';
                await handleUpdateTitularField('incapacidade', tempIncapacidade, valorAnterior);
                setIsEditingIncapacidade(false);
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Password do Titular */}
      <Dialog open={isEditingPassword} onOpenChange={setIsEditingPassword}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar Password Finanças do Titular</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password Finanças</Label>
              <Input
                id="password"
                type="text"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Digite a password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingPassword(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                const valorAnterior = clienteData?.senha_financas || '';
                await handleUpdateTitularField('senha_financas', tempPassword, valorAnterior);
                setIsEditingPassword(false);
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de IBAN do Titular */}
      <Dialog open={isEditingIBAN} onOpenChange={setIsEditingIBAN}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar IBAN do Titular</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                type="text"
                value={tempIBAN}
                onChange={(e) => setTempIBAN(e.target.value)}
                placeholder="PT50 0000 0000 0000 0000 0000 0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingIBAN(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                const valorAnterior = clienteData?.iban || '';
                await handleUpdateTitularField('iban', tempIBAN, valorAnterior);
                setIsEditingIBAN(false);
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Incapacidade de Membro */}
      {isEditingMemberIncapacidade && selectedMember && (() => {
        const getTipoRelacaoLabel = (tipo: string) => {
          const labels: Record<string, string> = {
            'conjuge': 'Cônjuge',
            'filho': 'Filho',
            'filha': 'Filha',
            'pai': 'Pai',
            'mae': 'Mãe',
            'irmao': 'Irmão',
            'irma': 'Irmã',
          };
          return labels[tipo] || tipo;
        };

        const membro = agregado?.find(m => m.cliente_relacionado?.id === isEditingMemberIncapacidade);
        const clienteRelacionado = membro?.cliente_relacionado;

        return (
          <Dialog open={!!isEditingMemberIncapacidade} onOpenChange={() => {
            setIsEditingMemberIncapacidade(null);
            setSelectedMember(null);
          }}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Editar Incapacidade - {getTipoRelacaoLabel(selectedMember.tipoRelacao)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="member-incapacidade">Incapacidade (%)</Label>
                  <Input
                    id="member-incapacidade"
                    type="number"
                    min="0"
                    max="100"
                    value={tempIncapacidade}
                    onChange={(e) => setTempIncapacidade(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsEditingMemberIncapacidade(null);
                  setSelectedMember(null);
                }}>
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    const valorAnterior = clienteRelacionado?.incapacidade?.toString() || '0';
                    await handleUpdateMemberField(
                      selectedMember.id,
                      'incapacidade',
                      tempIncapacidade,
                      valorAnterior,
                      selectedMember.nome
                    );
                    setIsEditingMemberIncapacidade(null);
                    setSelectedMember(null);
                  }}
                >
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Modal de Edição de Password de Membro */}
      {isEditingMemberPassword && selectedMember && (() => {
        const getTipoRelacaoLabel = (tipo: string) => {
          const labels: Record<string, string> = {
            'conjuge': 'Cônjuge',
            'filho': 'Filho',
            'filha': 'Filha',
            'pai': 'Pai',
            'mae': 'Mãe',
            'irmao': 'Irmão',
            'irma': 'Irmã',
          };
          return labels[tipo] || tipo;
        };

        const membro = agregado?.find(m => m.cliente_relacionado?.id === isEditingMemberPassword);
        const clienteRelacionado = membro?.cliente_relacionado;

        return (
          <Dialog open={!!isEditingMemberPassword} onOpenChange={() => {
            setIsEditingMemberPassword(null);
            setSelectedMember(null);
          }}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Editar Password Finanças - {getTipoRelacaoLabel(selectedMember.tipoRelacao)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="member-password">Password Finanças</Label>
                  <Input
                    id="member-password"
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Digite a password"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsEditingMemberPassword(null);
                  setSelectedMember(null);
                }}>
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    const valorAnterior = clienteRelacionado?.senha_financas || '';
                    await handleUpdateMemberField(
                      selectedMember.id,
                      'senha_financas',
                      tempPassword,
                      valorAnterior,
                      selectedMember.nome
                    );
                    setIsEditingMemberPassword(null);
                    setSelectedMember(null);
                  }}
                >
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
    </Dialog>
  );
};
