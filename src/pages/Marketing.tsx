import React, { useState } from 'react';
import { Plus, Trash2, Pencil, ShieldCheck, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketingInteracoes, type MarketingInteracao } from '@/hooks/useMarketing';
import { MarketingModal } from '@/components/modals/MarketingModal';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-PT');
};

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'nao_abordado': return <Badge variant="outline">Não Abordado</Badge>;
    case 'abordado': return <Badge className="bg-yellow-100 text-yellow-800">Abordado</Badge>;
    case 'interessado': return <Badge className="bg-green-100 text-green-800">Interessado</Badge>;
    case 'nao_interessado': return <Badge className="bg-gray-100 text-gray-800">Não Interessado</Badge>;
    case 'enviado': return <Badge className="bg-blue-100 text-blue-800">Enviado</Badge>;
    default: return <Badge variant="outline">{estado}</Badge>;
  }
};

const tipoLabel = (tipo: string) => {
  switch (tipo) {
    case 'seguros': return <Badge className="bg-indigo-100 text-indigo-800"><ShieldCheck className="h-3 w-3 mr-1" />Seguros</Badge>;
    case 'creditos': return <Badge className="bg-emerald-100 text-emerald-800"><TrendingUp className="h-3 w-3 mr-1" />Créditos</Badge>;
    default: return <Badge variant="outline">{tipo}</Badge>;
  }
};

const urgenciaBadge = (urg?: string) => {
  switch (urg) {
    case 'alta': return <span className="text-red-600 font-medium text-xs">Alta</span>;
    case 'media': return <span className="text-yellow-600 text-xs">Média</span>;
    case 'baixa': return <span className="text-gray-500 text-xs">Baixa</span>;
    default: return <span className="text-xs">-</span>;
  }
};

export const MarketingPage: React.FC = () => {
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<MarketingInteracao | null>(null);

  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const { interacoes, isLoading, createInteracao, updateInteracao, deleteInteracao } =
    useMarketingInteracoes({
      tipo_servico: filtroTipo && filtroTipo !== 'all' ? filtroTipo : undefined,
      estado: filtroEstado && filtroEstado !== 'all' ? filtroEstado : undefined,
    });

  const handleSubmit = (data: any) => {
    if (editItem) {
      updateInteracao.mutate({ id: editItem.id, ...data }, { onSuccess: () => { setModalOpen(false); setEditItem(null); } });
    } else {
      createInteracao.mutate(data, { onSuccess: () => setModalOpen(false) });
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Eliminar interação?',
      confirmLabel: 'Eliminar',
      variant: 'destructive',
    });
    if (ok) deleteInteracao.mutate(id);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing</h1>
          <p className="text-sm text-muted-foreground">Cross-selling de seguros e créditos</p>
        </div>
        <Button onClick={() => { setEditItem(null); setModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Interação
        </Button>
      </div>

      <div className="flex gap-2">
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Serviço" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="seguros">Seguros</SelectItem>
            <SelectItem value="creditos">Créditos</SelectItem>
            <SelectItem value="outro">Outro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="nao_abordado">Não Abordado</SelectItem>
            <SelectItem value="abordado">Abordado</SelectItem>
            <SelectItem value="interessado">Interessado</SelectItem>
            <SelectItem value="nao_interessado">Não Interessado</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Urgência</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">A carregar...</TableCell>
              </TableRow>
            ) : interacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">Nenhuma interação registada</TableCell>
              </TableRow>
            ) : (
              interacoes.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="text-sm whitespace-nowrap">{formatDate(i.data_interacao || i.criado_em)}</TableCell>
                  <TableCell className="text-sm">{i.cliente_nome || '-'}</TableCell>
                  <TableCell>{tipoLabel(i.tipo_servico)}</TableCell>
                  <TableCell className="text-sm">{i.empresa_parceira || '-'}</TableCell>
                  <TableCell>{estadoBadge(i.estado)}</TableCell>
                  <TableCell>{urgenciaBadge(i.urgencia)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(i); setModalOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(i.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <MarketingModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSubmit={handleSubmit}
        interacao={editItem}
        isLoading={createInteracao.isPending || updateInteracao.isPending}
      />
      {ConfirmDialogComponent}
    </div>
  );
};
