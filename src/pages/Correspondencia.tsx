import React, { useState } from 'react';
import { Plus, Mail, MailOpen, Trash2, Pencil, Send, PackageCheck, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCorrespondencias, type Correspondencia } from '@/hooks/useCorrespondencia';
import { CorrespondenciaModal } from '@/components/modals/CorrespondenciaModal';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-PT');
};

const estadoBadge = (estado: string) => {
  switch (estado) {
    case 'pendente': return <Badge variant="outline">Pendente</Badge>;
    case 'enviada': return <Badge className="bg-blue-100 text-blue-800">Enviada</Badge>;
    case 'recebida': return <Badge className="bg-green-100 text-green-800">Recebida</Badge>;
    case 'devolvida': return <Badge className="bg-red-100 text-red-800">Devolvida</Badge>;
    default: return <Badge variant="outline">{estado}</Badge>;
  }
};

const tipoBadge = (tipo: string) => {
  return tipo === 'enviada'
    ? <Badge className="bg-orange-100 text-orange-800"><Send className="h-3 w-3 mr-1" />Enviada</Badge>
    : <Badge className="bg-purple-100 text-purple-800"><PackageCheck className="h-3 w-3 mr-1" />Recebida</Badge>;
};

export const CorrespondenciaPage: React.FC = () => {
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Correspondencia | null>(null);

  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const { correspondencias, isLoading, createCorrespondencia, updateCorrespondencia, deleteCorrespondencia } =
    useCorrespondencias({
      tipo: filtroTipo && filtroTipo !== 'all' ? filtroTipo : undefined,
      estado: filtroEstado && filtroEstado !== 'all' ? filtroEstado : undefined,
    });

  const handleSubmit = (data: any) => {
    if (editItem) {
      updateCorrespondencia.mutate({ id: editItem.id, ...data }, { onSuccess: () => { setModalOpen(false); setEditItem(null); } });
    } else {
      createCorrespondencia.mutate(data, { onSuccess: () => setModalOpen(false) });
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Eliminar correspondência?',
      description: 'Esta ação não pode ser revertida.',
      confirmLabel: 'Eliminar',
      variant: 'destructive',
    });
    if (ok) deleteCorrespondencia.mutate(id);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Correspondência</h1>
          <p className="text-sm text-muted-foreground">Controlo de envio e receção de cartas</p>
        </div>
        <Button onClick={() => { setEditItem(null); setModalOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Correspondência
        </Button>
      </div>

      <div className="flex gap-2">
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="enviada">Enviada</SelectItem>
            <SelectItem value="recebida">Recebida</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="enviada">Enviada</SelectItem>
            <SelectItem value="recebida">Recebida</SelectItem>
            <SelectItem value="devolvida">Devolvida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead>Dest./Rem.</TableHead>
              <TableHead>Tracking</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Processo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">A carregar...</TableCell>
              </TableRow>
            ) : correspondencias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">Nenhuma correspondência registada</TableCell>
              </TableRow>
            ) : (
              correspondencias.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(c.tipo === 'enviada' ? c.data_envio : c.data_rececao) || formatDate(c.criado_em)}
                  </TableCell>
                  <TableCell>{tipoBadge(c.tipo)}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{c.assunto}</TableCell>
                  <TableCell className="text-sm">{c.tipo === 'enviada' ? c.destinatario : c.remetente || '-'}</TableCell>
                  <TableCell className="text-sm font-mono text-xs">{c.tracking_code || '-'}</TableCell>
                  <TableCell>{estadoBadge(c.estado)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.processo_titulo || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(c); setModalOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(c.id)}>
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

      <CorrespondenciaModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        onSubmit={handleSubmit}
        correspondencia={editItem}
        isLoading={createCorrespondencia.isPending || updateCorrespondencia.isPending}
      />
      {ConfirmDialogComponent}
    </div>
  );
};
