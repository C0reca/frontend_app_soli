import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTransacoes } from '@/hooks/useFinanceiro';
import { useClients, getEffectiveTipo } from '@/hooks/useClients';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PAGE_SIZE = 50;


const formatDateVal = (value?: string) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return format(parsed, 'dd/MM/yyyy', { locale: ptBR });
};

const tipoLabels: Record<string, { label: string; color: string }> = {
  custo: { label: 'Custo', color: 'bg-red-100 text-red-800' },
  despesa: { label: 'Despesa', color: 'bg-red-100 text-red-800' },
  pagamento: { label: 'Pagamento', color: 'bg-green-100 text-green-800' },
  honorario: { label: 'Honorário', color: 'bg-green-100 text-green-800' },
  reembolso: { label: 'Reembolso', color: 'bg-blue-100 text-blue-800' },
};

const metodoLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  mb: 'Multibanco',
  transferencia: 'Transferência',
  cheque: 'Cheque',
  outro: 'Outro',
};

const fmtISO = (d: Date) => format(d, 'yyyy-MM-dd');

export const MovimentosTab: React.FC = () => {
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroClienteId, setFiltroClienteId] = useState('');
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<string>('data');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const { clients } = useClients();

  const { transacoes, isLoading } = useTransacoes({
    tipo: filtroTipo || undefined,
    cliente_id: filtroClienteId ? Number(filtroClienteId) : undefined,
    data_inicio: filtroDataInicio || undefined,
    data_fim: filtroDataFim || undefined,
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE + 1, // fetch 1 extra to know if there's a next page
  });

  const hasNextPage = transacoes.length > PAGE_SIZE;
  const rawPage = hasNextPage ? transacoes.slice(0, PAGE_SIZE) : transacoes;

  // Client-side sort
  const pageData = useMemo(() => {
    const sorted = [...rawPage];
    sorted.sort((a, b) => {
      let va: any, vb: any;
      switch (sortField) {
        case 'data': va = a.data || ''; vb = b.data || ''; break;
        case 'tipo': va = a.tipo; vb = b.tipo; break;
        case 'valor': va = Number(a.valor); vb = Number(b.valor); break;
        case 'descricao': va = (a.descricao || '').toLowerCase(); vb = (b.descricao || '').toLowerCase(); break;
        default: va = a.data || ''; vb = b.data || '';
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [rawPage, sortField, sortDir]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const getClientName = (clienteId: number | null | undefined): string => {
    if (!clienteId || !clients) return '-';
    const client = clients.find((c: any) => c.id === clienteId);
    if (!client) return `#${clienteId}`;
    const tipo = getEffectiveTipo(client);
    return tipo === 'singular'
      ? ((client as any).nome || `#${clienteId}`)
      : ((client as any).nome_empresa || `#${clienteId}`);
  };

  // Date presets
  const applyPreset = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case 'hoje':
        setFiltroDataInicio(fmtISO(today));
        setFiltroDataFim(fmtISO(today));
        break;
      case 'semana':
        setFiltroDataInicio(fmtISO(startOfWeek(today, { weekStartsOn: 1 })));
        setFiltroDataFim(fmtISO(endOfWeek(today, { weekStartsOn: 1 })));
        break;
      case 'mes':
        setFiltroDataInicio(fmtISO(startOfMonth(today)));
        setFiltroDataFim(fmtISO(endOfMonth(today)));
        break;
    }
    setPage(0);
  };

  const clearFilters = () => {
    setFiltroTipo('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroClienteId('');
    setPage(0);
  };

  // Totals
  const totals = useMemo(() => {
    const entradas = pageData.filter(t => ['pagamento', 'honorario'].includes(t.tipo)).reduce((s, t) => s + Number(t.valor), 0);
    const saidas = pageData.filter(t => ['custo', 'despesa', 'reembolso'].includes(t.tipo)).reduce((s, t) => s + Number(t.valor), 0);
    return { entradas, saidas, total: pageData.reduce((s, t) => s + Number(t.valor), 0) };
  }, [pageData]);

  // Export CSV
  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Valor', 'Descrição', 'Entidade', 'Processo', 'Método'];
    const rows = pageData.map(t => [
      formatDateVal(t.data),
      tipoLabels[t.tipo]?.label || t.tipo,
      Number(t.valor).toFixed(2),
      (t.descricao || '').replace(/"/g, '""'),
      getClientName(t.cliente_id),
      t.processo_id ? `#${t.processo_id}` : '',
      metodoLabels[t.metodo_pagamento || ''] || t.metodo_pagamento || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes_${filtroDataInicio || 'todas'}_${filtroDataFim || 'todas'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Filtros</CardTitle>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => applyPreset('hoje')}>Hoje</Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset('semana')}>Semana</Button>
              <Button variant="outline" size="sm" onClick={() => applyPreset('mes')}>Mês</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filtroTipo} onValueChange={(v) => { setFiltroTipo(v); setPage(0); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custo">Custo</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="pagamento">Pagamento</SelectItem>
                  <SelectItem value="honorario">Honorário</SelectItem>
                  <SelectItem value="reembolso">Reembolso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Entidade</Label>
              <Select value={filtroClienteId} onValueChange={(v) => { setFiltroClienteId(v); setPage(0); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {(clients || []).slice(0, 100).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nome || c.nome_empresa || `#${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input type="date" value={filtroDataInicio} onChange={(e) => { setFiltroDataInicio(e.target.value); setPage(0); }} />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input type="date" value={filtroDataFim} onChange={(e) => { setFiltroDataFim(e.target.value); setPage(0); }} />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={clearFilters}>Limpar</Button>
              <Button variant="outline" size="icon" onClick={exportCSV} title="Exportar CSV">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Todas as Transações</CardTitle>
              <CardDescription>Vista global de todas as transações financeiras</CardDescription>
            </div>
            {/* Paginação */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Página {page + 1}</span>
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" disabled={!hasNextPage} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('data')}>
                    <span className="flex items-center">Data<SortIcon field="data" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('tipo')}>
                    <span className="flex items-center">Tipo<SortIcon field="tipo" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('valor')}>
                    <span className="flex items-center">Valor<SortIcon field="valor" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('descricao')}>
                    <span className="flex items-center">Descrição<SortIcon field="descricao" /></span>
                  </TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Processo</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Caixa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">A carregar...</TableCell>
                  </TableRow>
                ) : pageData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}><EmptyState icon={FileText} title="Nenhuma transação encontrada" description="Ajuste os filtros ou crie uma nova transação." /></TableCell>
                  </TableRow>
                ) : (
                  pageData.map((t) => {
                    const tipoInfo = tipoLabels[t.tipo] || { label: t.tipo, color: '' };
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="whitespace-nowrap">{formatDateVal(t.data)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={tipoInfo.color}>{tipoInfo.label}</Badge>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{formatCurrency(t.valor)}</TableCell>
                        <TableCell className="max-w-[250px] truncate">{t.descricao || '-'}</TableCell>
                        <TableCell className="text-sm">{getClientName(t.cliente_id)}</TableCell>
                        <TableCell className="text-sm">{t.processo_id ? `#${t.processo_id}` : '-'}</TableCell>
                        <TableCell className="text-sm">{metodoLabels[t.metodo_pagamento || ''] || t.metodo_pagamento || '-'}</TableCell>
                        <TableCell>
                          {t.caixa_movimento_id ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">Registado</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground text-xs">Sem caixa</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
              {pageData.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-medium">Totais da página</TableCell>
                    <TableCell className="font-bold whitespace-nowrap">{formatCurrency(totals.total)}</TableCell>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      Entradas: <span className="text-green-600 font-medium">{formatCurrency(totals.entradas)}</span>
                      {' · '}
                      Saídas: <span className="text-red-600 font-medium">{formatCurrency(totals.saidas)}</span>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
