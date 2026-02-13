import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Users, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClientesComSaldo, useResumoGeral, useContaCorrenteCliente } from '@/hooks/useContaCorrente';
import { CobrancaEmailModal } from '@/components/modals/CobrancaEmailModal';
import type { ContaCorrenteProcesso } from '@/types/financeiro';

const formatCurrency = (value: any) => {
  const n = typeof value === 'number' ? value : Number(value) || 0;
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n);
};

interface ClienteExpandidoProps {
  clienteId: number;
}

const ClienteExpandido: React.FC<ClienteExpandidoProps> = ({ clienteId }) => {
  const { data, isLoading } = useContaCorrenteCliente(clienteId);

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">A carregar...</div>;
  if (!data) return null;

  return (
    <div className="p-4 bg-muted/30">
      <div className="grid gap-3 md:grid-cols-4 mb-3">
        <div className="rounded-md border p-3 text-sm">
          <span className="text-muted-foreground">Total Custos</span>
          <p className="font-bold text-red-600">{formatCurrency(data.total_custos)}</p>
        </div>
        <div className="rounded-md border p-3 text-sm">
          <span className="text-muted-foreground">Total Pagamentos</span>
          <p className="font-bold text-green-600">{formatCurrency(data.total_pagamentos)}</p>
        </div>
        <div className="rounded-md border p-3 text-sm">
          <span className="text-muted-foreground">Total Reembolsos</span>
          <p className="font-bold text-blue-600">{formatCurrency(data.total_reembolsos)}</p>
        </div>
        <div className="rounded-md border p-3 text-sm">
          <span className="text-muted-foreground">Saldo</span>
          <p className="font-bold">{formatCurrency(data.saldo_total)}</p>
        </div>
      </div>
      {data.processos.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Processo</TableHead>
              <TableHead>Custos</TableHead>
              <TableHead>Pagamentos</TableHead>
              <TableHead>Reembolsos</TableHead>
              <TableHead>Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.processos.map((p: ContaCorrenteProcesso) => (
              <TableRow key={p.processo_id}>
                <TableCell className="font-medium">{p.processo_titulo}</TableCell>
                <TableCell className="text-red-600">{formatCurrency(p.total_custos)}</TableCell>
                <TableCell className="text-green-600">{formatCurrency(p.total_pagamentos)}</TableCell>
                <TableCell className="text-blue-600">{formatCurrency(p.total_reembolsos)}</TableCell>
                <TableCell className="font-bold">{formatCurrency(p.saldo)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export const ContaCorrente: React.FC = () => {
  const { data: resumo, isLoading: loadingResumo } = useResumoGeral();
  const { data: clientes = [], isLoading: loadingClientes } = useClientesComSaldo();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cobrancaClienteId, setCobrancaClienteId] = useState<number | null>(null);
  const [cobrancaClienteNome, setCobrancaClienteNome] = useState<string>('');

  const handleToggleExpand = (clienteId: number) => {
    setExpandedId(expandedId === clienteId ? null : clienteId);
  };

  const handleEnviarCobranca = (clienteId: number, clienteNome: string) => {
    setCobrancaClienteId(clienteId);
    setCobrancaClienteNome(clienteNome);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conta Corrente</h1>
        <p className="text-muted-foreground">
          Visao geral das contas correntes dos clientes
        </p>
      </div>

      {/* Resumo Geral */}
      {resumo && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Custos</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(resumo.total_custos)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagamentos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(resumo.total_pagamentos)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reembolsos</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(resumo.total_reembolsos)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(resumo.saldo_total)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes c/ Saldo</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resumo.total_clientes_com_saldo}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Clientes com saldo */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes com Saldo Pendente</CardTitle>
          <CardDescription>Lista de clientes com saldo em aberto nos seus processos</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingClientes ? (
            <div className="text-center py-8 text-muted-foreground">A carregar...</div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum cliente com saldo pendente.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Custos</TableHead>
                    <TableHead>Pagamentos</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientes.map((c: any) => (
                    <React.Fragment key={c.cliente_id}>
                      <TableRow className="cursor-pointer hover:bg-muted/60" onClick={() => handleToggleExpand(c.cliente_id)}>
                        <TableCell>
                          {expandedId === c.cliente_id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{c.cliente_nome}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(c.total_custos)}</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(c.total_pagamentos)}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(c.saldo)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={(e) => { e.stopPropagation(); handleEnviarCobranca(c.cliente_id, c.cliente_nome); }}
                          >
                            <Send className="h-3 w-3" />
                            Cobranca
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedId === c.cliente_id && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0">
                            <ClienteExpandido clienteId={c.cliente_id} />
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CobrancaEmailModal
        isOpen={!!cobrancaClienteId}
        onClose={() => { setCobrancaClienteId(null); setCobrancaClienteNome(''); }}
        clienteId={cobrancaClienteId}
        clienteNome={cobrancaClienteNome}
      />
    </div>
  );
};
