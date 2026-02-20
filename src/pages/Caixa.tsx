import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Pencil, Trash2, Download, Upload, Link2, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MovimentoCaixaModal } from '@/components/modals/MovimentoCaixaModal';
import { FecharCaixaModal } from '@/components/modals/FecharCaixaModal';
import { useCaixa, MovimentoCaixa } from '@/hooks/useCaixa';
import { useMovimentosBancarios } from '@/hooks/useReconciliacao';
import { ReconciliacaoModal } from '@/components/modals/ReconciliacaoModal';
import type { MovimentoBancario } from '@/types/financeiro';
import api from '@/services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useClients, getEffectiveTipo } from '@/hooks/useClients';

export const Caixa: React.FC = () => {
  const { canCreate, canEdit } = usePermissions();
  const [isMovimentoModalOpen, setIsMovimentoModalOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');
  const [selectedFechoId, setSelectedFechoId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [movimentoSelecionado, setMovimentoSelecionado] = useState<MovimentoCaixa | null>(null);
  const [isFecharModalOpen, setIsFecharModalOpen] = useState(false);
  const [isFecharLoading, setIsFecharLoading] = useState(false);
  const [isExportingExtrato, setIsExportingExtrato] = useState(false);
  const [reconciliacaoMovimento, setReconciliacaoMovimento] = useState<MovimentoBancario | null>(null);
  const [filtroReconciliado, setFiltroReconciliado] = useState<string>('');
  const extratoFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const {
    movimentos,
    fechos,
    resumoDia,
    isLoading,
    createMovimento,
    updateMovimento,
    deleteMovimento,
    fecharCaixa,
    refetch
  } = useCaixa();
  const { clients } = useClients();

  const getClientName = (clienteId: number | null | undefined): string | null => {
    if (!clienteId || !clients) return null;
    const client = clients.find((c: any) => c.id === clienteId);
    if (!client) return `Entidade #${clienteId}`;
    const tipo = getEffectiveTipo(client);
    return tipo === 'singular'
      ? ((client as any).nome || `Entidade #${clienteId}`)
      : ((client as any).nome_empresa || `Entidade #${clienteId}`);
  };

  const reconciliadoParam = filtroReconciliado === '' ? undefined : filtroReconciliado === 'true';
  const { movimentos: movimentosBancarios, isLoading: isLoadingBancarios, importarExtrato, reconciliar, desreconciliar } = useMovimentosBancarios({
    reconciliado: reconciliadoParam,
  });

  const handleImportarExtrato = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importarExtrato.mutateAsync({ file });
    }
    e.target.value = '';
  };

  const handleReconciliar = (movimentoBancarioId: number, transacaoId: number) => {
    reconciliar.mutate({ movimentoBancarioId, transacaoId });
  };

  const handleDesreconciliar = (movimentoBancarioId: number) => {
    if (window.confirm('Remover reconciliacao deste movimento?')) {
      desreconciliar.mutate(movimentoBancarioId);
    }
  };

  const selectedFecho = useMemo(() => {
    if (!selectedFechoId) return null;
    return fechos.find((fecho) => fecho.id === selectedFechoId) ?? null;
  }, [fechos, selectedFechoId]);

  useEffect(() => {
    if (!fechos.length) {
      setSelectedFechoId(null);
      return;
    }

    const exists = selectedFechoId ? fechos.some((fecho) => fecho.id === selectedFechoId) : false;
    if (!exists) {
      setSelectedFechoId(fechos[0].id);
    }
  }, [fechos, selectedFechoId]);

  const handleFecharCaixaClick = () => {
    setIsFecharModalOpen(true);
  };

  const handleConfirmFecharCaixa = async (saldoMoedas: number) => {
    setIsFecharLoading(true);
    try {
      const extrato = await fecharCaixa(saldoMoedas);
      setSelectedFechoId(extrato.id);
      toast({
        title: "Caixa fechada com sucesso",
        description: "O fecho do dia foi registado.",
      });
      setIsFecharModalOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao fechar caixa",
        description: "Ocorreu um erro ao fechar a caixa do dia.",
        variant: "destructive",
      });
    } finally {
      setIsFecharLoading(false);
    }
  };

  const handleExportFecho = async () => {
    if (!selectedFechoId) {
      toast({
        title: 'Nenhum fecho selecionado',
        description: 'Selecione um fecho para exportar o extrato.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsExportingExtrato(true);
      const response = await api.get(`/caixa/fechos/${selectedFechoId}/export`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dataLabel = selectedFecho?.data ?? 'fecho';
      link.href = url;
      link.setAttribute('download', `fecho_${dataLabel}.txt`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Exportação concluída',
        description: 'O extrato foi exportado com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar o extrato.',
        variant: 'destructive',
      });
    } finally {
      setIsExportingExtrato(false);
    }
  };

  const handleGuardarMovimento = async (data: Parameters<typeof createMovimento>[0]) => {
    const clienteId = data.cliente_id ? Number(data.cliente_id) : null;
    const processoId =
      data.associado_a_processo && data.processo_id
        ? Number(data.processo_id)
        : null;

    const basePayload = {
      tipo: data.tipo,
      valor: data.valor,
      descricao: data.descricao,
      data: data.data,
      hora: data.hora ? data.hora : undefined,
      cliente_id: clienteId,
      processo_id: processoId,
      tipo_transferencia: data.tipo_transferencia,
    };

    try {
      if (modalMode === 'edit' && movimentoSelecionado) {
        await updateMovimento(movimentoSelecionado.id, basePayload);
        toast({
          title: "Movimento atualizado",
          description: "O movimento foi atualizado com sucesso.",
        });
      } else {
        await createMovimento({
          ...basePayload,
          associado_a_processo: data.associado_a_processo,
          cliente_id: clienteId,
          processo_id: processoId,
        });
        toast({
          title: "Movimento registado",
          description: "O movimento foi registado com sucesso.",
        });
      }
    } catch (error) {
      toast({
        title: modalMode === 'edit' ? "Erro ao atualizar movimento" : "Erro ao registar movimento",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleEditarMovimento = (movimento: MovimentoCaixa) => {
    setMovimentoSelecionado(movimento);
    setModalMode('edit');
    setIsMovimentoModalOpen(true);
  };

  const handleApagarMovimento = async (movimento: MovimentoCaixa) => {
    const confirmar = window.confirm("Tem a certeza que pretende apagar este movimento?");
    if (!confirmar) return;

    try {
      await deleteMovimento(movimento.id);
      toast({
        title: "Movimento removido",
        description: "O movimento de caixa foi eliminado.",
      });
      if (movimentoSelecionado?.id === movimento.id) {
        setMovimentoSelecionado(null);
      }
    } catch (error) {
      toast({
        title: "Erro ao apagar movimento",
        description: "Não foi possível eliminar o movimento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const movimentosFiltrados = movimentos.filter(movimento => {
    const dataMovimento = movimento.data ? new Date(movimento.data) : null;
    if (!dataMovimento || Number.isNaN(dataMovimento.getTime())) {
      return false;
    }
    const dataInicio = filtroDataInicio ? new Date(filtroDataInicio) : null;
    const dataFim = filtroDataFim ? new Date(filtroDataFim) : null;
    
    const matchTipo = !filtroTipo || movimento.tipo === filtroTipo;
    const matchDataInicio = !dataInicio || dataMovimento >= dataInicio;
    const matchDataFim = !dataFim || dataMovimento <= dataFim;
    
    return matchTipo && matchDataInicio && matchDataFim;
  });

  const formatCurrency = (value: any) => {
    const n = typeof value === 'number' ? value : Number(value) || 0;
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(n);
  };

  const formatDate = (value?: string, pattern = "dd/MM/yyyy") => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return format(parsed, pattern, { locale: ptBR });
  };

const formatTransferType = (value?: string | null) => {
  switch (value) {
    case 'mb':
      return 'Mb';
    case 'transferencia':
      return 'Transferência';
    default:
      return 'Dinheiro';
  }
};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Caixa</h1>
          <p className="text-muted-foreground">
            Controle de movimentos e fechos de caixa
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate("caixa") && (
            <Button
              onClick={() => {
                setModalMode('create');
                setMovimentoSelecionado(null);
                setIsMovimentoModalOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Movimento
            </Button>
          )}
          <Button
            onClick={handleFecharCaixaClick}
            variant="outline"
            className="gap-2"
            disabled={
              isLoading ||
              isFecharLoading ||
              !resumoDia ||
              (resumoDia.total_entradas === 0 && resumoDia.total_saidas === 0)
            }
          >
            <DollarSign className="h-4 w-4" />
            Fechar Caixa do Dia
          </Button>
        </div>
      </div>

      {/* Resumo do Dia */}
      {resumoDia && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Inicial</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(resumoDia.saldo_inicial)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entradas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(resumoDia.total_entradas)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saídas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(resumoDia.total_saidas)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Final</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(resumoDia.saldo_final)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dinheiro Físico Estimado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(resumoDia.saldo_dinheiro_estimado)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="movimentos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="movimentos">Movimentos</TabsTrigger>
          <TabsTrigger value="fechos">Fechos</TabsTrigger>
          <TabsTrigger value="reconciliacao">Reconciliacao</TabsTrigger>
        </TabsList>

        <TabsContent value="movimentos" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data-inicio">Data Início</Label>
                  <Input
                    id="data-inicio"
                    type="date"
                    value={filtroDataInicio}
                    onChange={(e) => setFiltroDataInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data-fim">Data Fim</Label>
                  <Input
                    id="data-fim"
                    type="date"
                    value={filtroDataFim}
                    onChange={(e) => setFiltroDataFim(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFiltroTipo('');
                      setFiltroDataInicio('');
                      setFiltroDataFim('');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Movimentos */}
          <Card>
            <CardHeader>
              <CardTitle>Movimentos de Caixa</CardTitle>
              <CardDescription>
                Lista de todos os movimentos registados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Entidade / Processo</TableHead>
                      <TableHead>Tipo de Transferência</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          Nenhum movimento encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimentosFiltrados.map((movimento) => (
                        <TableRow key={movimento.id}>
                          <TableCell>
                            {formatDate(movimento.data, "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            {movimento.hora ?? formatDate(movimento.data, "HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={movimento.tipo === 'entrada' ? 'default' : 'destructive'}
                              className={movimento.tipo === 'entrada' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {movimento.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(movimento.valor)}
                          </TableCell>
                          <TableCell>{movimento.descricao}</TableCell>
                          <TableCell>
                            {movimento.cliente_id ? (
                              <div className="text-sm">
                                <span>{getClientName(movimento.cliente_id)}</span>
                                {movimento.processo_id && (
                                  <span className="text-muted-foreground block text-xs">
                                    Processo #{movimento.processo_id}
                                  </span>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{formatTransferType(movimento.tipo_transferencia)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditarMovimento(movimento)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Editar movimento</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApagarMovimento(movimento)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Apagar movimento</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fechos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Fechos</CardTitle>
              <CardDescription>
                Histórico de fechos diários de caixa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Saldo Inicial</TableHead>
                      <TableHead>Total Entradas</TableHead>
                      <TableHead>Total Saídas</TableHead>
                      <TableHead>Saldo Final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fechos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhum fecho registado
                        </TableCell>
                      </TableRow>
                    ) : (
                      fechos.map((fecho) => (
                        <TableRow
                          key={fecho.id}
                          onClick={() => setSelectedFechoId(fecho.id)}
                          className={cn(
                            "cursor-pointer",
                            selectedFechoId === fecho.id ? "bg-muted" : "hover:bg-muted/60"
                          )}
                        >
                          <TableCell>
                            {formatDate(fecho.data, "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(fecho.saldo_inicial)}
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {formatCurrency(fecho.total_entradas)}
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            {formatCurrency(fecho.total_saidas)}
                          </TableCell>
                          <TableCell className="font-bold">
                            {formatCurrency(fecho.saldo_final)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {selectedFecho && (
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Movimentos do Fecho</CardTitle>
                    <CardDescription>
                      Detalhes do fecho de {formatDate(selectedFecho.data, "dd 'de' MMMM 'de' yyyy")}
                    </CardDescription>
                  </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-sm">
                        Saldo final: {formatCurrency(selectedFecho.saldo_final)}
                      </Badge>
                      <Badge variant="outline" className="text-sm">
                        Saldo moedas: {formatCurrency(selectedFecho.saldo_moedas)}
                      </Badge>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleExportFecho}
                        disabled={isExportingExtrato}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Exportar extrato
                      </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3 mb-4">
                  {[
                    {
                      label: 'Dinheiro',
                      entradas: selectedFecho.total_entradas_dinheiro,
                      saidas: selectedFecho.total_saidas_dinheiro,
                    },
                    {
                      label: 'MB',
                      entradas: selectedFecho.total_entradas_mb,
                      saidas: selectedFecho.total_saidas_mb,
                    },
                    {
                      label: 'Transferência',
                      entradas: selectedFecho.total_entradas_transferencia,
                      saidas: selectedFecho.total_saidas_transferencia,
                    },
                  ].map((item) => {
                    const saldo = item.entradas - item.saidas;
                    return (
                      <div key={item.label} className="rounded-md border p-3 text-sm space-y-1">
                        <p className="font-medium">{item.label}</p>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Entradas</span>
                          <span className="font-semibold">{formatCurrency(item.entradas)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Saídas</span>
                          <span className="font-semibold">{formatCurrency(item.saidas)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Saldo</span>
                          <span className="font-semibold">{formatCurrency(saldo)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Saldo Antes</TableHead>
                      <TableHead>Saldo Depois</TableHead>
                      <TableHead>Tipo de Transferência</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFecho.movimentos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            Nenhum movimento registado neste fecho.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedFecho.movimentos.map((mov) => (
                          <TableRow key={mov.id}>
                            <TableCell>{formatDate(mov.data, "dd/MM/yyyy")}</TableCell>
                            <TableCell>{mov.hora ?? formatDate(mov.data, "HH:mm")}</TableCell>
                            <TableCell>{mov.descricao}</TableCell>
                            <TableCell>
                              <Badge
                                variant={mov.tipo === 'entrada' ? 'default' : 'destructive'}
                                className={mov.tipo === 'entrada' ? 'bg-green-100 text-green-800' : ''}
                              >
                                {mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(mov.valor)}</TableCell>
                            <TableCell>{formatCurrency(mov.saldo_antes)}</TableCell>
                            <TableCell>{formatCurrency(mov.saldo_apos)}</TableCell>
                            <TableCell>{formatTransferType(mov.tipo_transferencia)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reconciliacao" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reconciliacao Bancaria</CardTitle>
                  <CardDescription>Importe extratos bancarios e reconcilie com transacoes financeiras</CardDescription>
                </div>
                <Button className="gap-2" onClick={() => extratoFileRef.current?.click()} disabled={importarExtrato.isPending}>
                  <Upload className="h-4 w-4" />
                  {importarExtrato.isPending ? 'A importar...' : 'Importar Extrato CSV'}
                </Button>
                <input ref={extratoFileRef} type="file" accept=".csv" className="hidden" onChange={handleImportarExtrato} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="space-y-1">
                  <Label>Estado</Label>
                  <Select value={filtroReconciliado} onValueChange={setFiltroReconciliado}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="false">Pendentes</SelectItem>
                      <SelectItem value="true">Reconciliados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {filtroReconciliado && (
                  <div className="flex items-end">
                    <Button variant="outline" size="sm" onClick={() => setFiltroReconciliado('')}>Limpar</Button>
                  </div>
                )}
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descricao</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingBancarios ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">A carregar...</TableCell>
                      </TableRow>
                    ) : movimentosBancarios.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          Nenhum movimento bancario importado. Importe um extrato CSV para comecar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimentosBancarios.map((mb) => (
                        <TableRow key={mb.id}>
                          <TableCell>{formatDate(mb.data)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{mb.descricao || '-'}</TableCell>
                          <TableCell className={cn("font-medium", Number(mb.valor) >= 0 ? "text-green-600" : "text-red-600")}>
                            {formatCurrency(mb.valor)}
                          </TableCell>
                          <TableCell>{mb.saldo != null ? formatCurrency(mb.saldo) : '-'}</TableCell>
                          <TableCell className="text-sm">{mb.referencia || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={mb.reconciliado ? 'default' : 'outline'}>
                              {mb.reconciliado ? 'Reconciliado' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {mb.reconciliado ? (
                              <Button variant="ghost" size="sm" onClick={() => handleDesreconciliar(mb.id)} title="Desreconciliar">
                                <Unlink className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" onClick={() => setReconciliacaoMovimento(mb)} title="Reconciliar">
                                <Link2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ReconciliacaoModal
        isOpen={!!reconciliacaoMovimento}
        onClose={() => setReconciliacaoMovimento(null)}
        movimento={reconciliacaoMovimento}
        onReconciliar={handleReconciliar}
      />

      <MovimentoCaixaModal
        isOpen={isMovimentoModalOpen}
        onClose={() => {
          setIsMovimentoModalOpen(false);
          setMovimentoSelecionado(null);
          setModalMode('create');
        }}
        onSave={handleGuardarMovimento}
        onSuccess={() => {
          setIsMovimentoModalOpen(false);
          setMovimentoSelecionado(null);
          setModalMode('create');
          refetch();
        }}
        initialData={movimentoSelecionado}
        mode={modalMode}
      />
      <FecharCaixaModal
        isOpen={isFecharModalOpen}
        onClose={() => {
          if (isFecharLoading) return;
          setIsFecharModalOpen(false);
        }}
        expectedCash={resumoDia?.saldo_dinheiro_estimado ?? 0}
        defaultSaldoMoedas={resumoDia?.saldo_dinheiro_estimado ?? 0}
        onConfirm={handleConfirmFecharCaixa}
        isSubmitting={isFecharLoading}
      />
    </div>
  );
};