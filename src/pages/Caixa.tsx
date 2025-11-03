import React, { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MovimentoCaixaModal } from '@/components/modals/MovimentoCaixaModal';
import { useCaixa } from '@/hooks/useCaixa';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export const Caixa: React.FC = () => {
  const [isMovimentoModalOpen, setIsMovimentoModalOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');
  
  const { toast } = useToast();
  const {
    movimentos,
    fechos,
    resumoDia,
    isLoading,
    createMovimento,
    fecharCaixa,
    refetch
  } = useCaixa();

  const handleFecharCaixa = async () => {
    try {
      await fecharCaixa();
      toast({
        title: "Caixa fechada com sucesso",
        description: "O fecho do dia foi registado.",
      });
    } catch (error) {
      toast({
        title: "Erro ao fechar caixa",
        description: "Ocorreu um erro ao fechar a caixa do dia.",
        variant: "destructive",
      });
    }
  };

  const movimentosFiltrados = movimentos.filter(movimento => {
    const dataMovimento = new Date(movimento.data);
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
          <Button
            onClick={() => setIsMovimentoModalOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Movimento
          </Button>
          <Button
            onClick={handleFecharCaixa}
            variant="outline"
            className="gap-2"
            disabled={!resumoDia || resumoDia.total_entradas === 0 && resumoDia.total_saidas === 0}
          >
            <DollarSign className="h-4 w-4" />
            Fechar Caixa do Dia
          </Button>
        </div>
      </div>

      {/* Resumo do Dia */}
      {resumoDia && (
        <div className="grid gap-4 md:grid-cols-4">
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
        </div>
      )}

      <Tabs defaultValue="movimentos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="movimentos">Movimentos</TabsTrigger>
          <TabsTrigger value="fechos">Fechos</TabsTrigger>
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
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Processo Associado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhum movimento encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimentosFiltrados.map((movimento) => (
                        <TableRow key={movimento.id}>
                          <TableCell>
                            {format(new Date(movimento.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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
                            {movimento.processo_id ? (
                              <span className="text-sm text-muted-foreground">
                                Processo #{movimento.processo_id}
                              </span>
                            ) : (
                              '-'
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
                        <TableRow key={fecho.id}>
                          <TableCell>
                            {format(new Date(fecho.data), "dd/MM/yyyy", { locale: ptBR })}
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
        </TabsContent>
      </Tabs>

      <MovimentoCaixaModal
        isOpen={isMovimentoModalOpen}
        onClose={() => setIsMovimentoModalOpen(false)}
        onSave={createMovimento}
        onSuccess={() => {
          setIsMovimentoModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
};