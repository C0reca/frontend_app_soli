import React, { useState } from 'react';
import { Plus, FileText, Copy, Eye, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFormularios, useFormularioMutations, type FormularioPublico } from '@/hooks/useFormulariosPublicos';
import { FormularioModal } from '@/components/modals/FormularioModal';
import { useToast } from '@/hooks/use-toast';

const ESTADO_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  preenchido: 'Preenchido',
  expirado: 'Expirado',
  cancelado: 'Cancelado',
};

const TIPO_LABELS: Record<string, string> = {
  herdeiros: 'Herdeiros',
  dados_cliente: 'Dados Pessoais',
  generico: 'Genérico',
};

const ESTADO_COLORS: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800',
  preenchido: 'bg-blue-100 text-blue-800',
  expirado: 'bg-gray-100 text-gray-600',
  cancelado: 'bg-red-100 text-red-600',
};

export const FormulariosPublicos: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('all');
  const [detailForm, setDetailForm] = useState<FormularioPublico | null>(null);
  const { data: formularios = [], isLoading } = useFormularios(undefined, filtroEstado);
  const { apagar, atualizar } = useFormularioMutations();
  const { toast } = useToast();

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/formulario/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: 'Link copiado!' });
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminar este formulário?')) return;
    try {
      await apagar.mutateAsync(id);
      toast({ title: 'Formulário eliminado' });
    } catch {
      toast({ title: 'Erro', variant: 'destructive' });
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await atualizar.mutateAsync({ id, estado: 'cancelado' });
      toast({ title: 'Formulário cancelado' });
    } catch {
      toast({ title: 'Erro', variant: 'destructive' });
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Formulários Públicos
          </h1>
          <p className="text-sm text-muted-foreground">Links partilháveis para clientes preencherem dados</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Formulário
        </Button>
      </div>

      <div className="flex gap-2">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="preenchido">Preenchidos</SelectItem>
            <SelectItem value="expirado">Expirados</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Processo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Criado</TableHead>
              <TableHead>Preenchido</TableHead>
              <TableHead className="w-32"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">A carregar...</TableCell></TableRow>
            ) : formularios.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum formulário</TableCell></TableRow>
            ) : (
              formularios.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.titulo}</TableCell>
                  <TableCell><Badge variant="outline">{TIPO_LABELS[f.tipo] || f.tipo}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.processo_titulo || '-'}</TableCell>
                  <TableCell>
                    <Badge className={ESTADO_COLORS[f.estado] || ''}>{ESTADO_LABELS[f.estado] || f.estado}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(f.criado_em)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(f.preenchido_em)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" title="Copiar link" onClick={() => copyLink(f.token)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      {f.estado === 'preenchido' && (
                        <Button size="icon" variant="ghost" title="Ver dados" onClick={() => setDetailForm(f)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {f.estado === 'ativo' && (
                        <Button size="icon" variant="ghost" title="Cancelar" className="text-orange-600" onClick={() => handleCancel(f.id)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" title="Eliminar" className="text-red-600" onClick={() => handleDelete(f.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <FormularioModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Detail dialog for filled forms */}
      <Dialog open={!!detailForm} onOpenChange={() => setDetailForm(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dados Preenchidos — {detailForm?.titulo}</DialogTitle>
          </DialogHeader>
          {detailForm?.dados_preenchidos && (
            <div className="space-y-3">
              {detailForm.campos_config?.map(campo => {
                const valor = detailForm.dados_preenchidos?.[campo.nome];
                if (!valor) return null;
                return (
                  <div key={campo.nome}>
                    <p className="text-sm font-medium text-muted-foreground">{campo.label}</p>
                    <p className="text-sm">{String(valor)}</p>
                  </div>
                );
              })}
              {/* Show any extra fields not in config */}
              {Object.entries(detailForm.dados_preenchidos)
                .filter(([k]) => !detailForm.campos_config?.some(c => c.nome === k))
                .map(([k, v]) => (
                  <div key={k}>
                    <p className="text-sm font-medium text-muted-foreground">{k}</p>
                    <p className="text-sm">{String(v)}</p>
                  </div>
                ))
              }
              <p className="text-xs text-muted-foreground mt-4">
                Preenchido em: {detailForm.preenchido_em ? new Date(detailForm.preenchido_em).toLocaleString('pt-PT') : '-'}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
