import React, { useState } from 'react';
import { Plus, Landmark, Pencil, Trash2, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useConservatorias, useDistritos, useConservatoriaMutations, type Conservatoria } from '@/hooks/useConservatorias';
import { useToast } from '@/hooks/use-toast';

const TIPO_LABELS: Record<string, string> = {
  predial: 'Predial',
  civil: 'Civil',
  comercial: 'Comercial',
};

export const Conservatorias: React.FC = () => {
  const [filtroTipo, setFiltroTipo] = useState('all');
  const [filtroDistrito, setFiltroDistrito] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Conservatoria | null>(null);
  const { toast } = useToast();

  const tipo = filtroTipo !== 'all' ? filtroTipo : undefined;
  const distrito = filtroDistrito !== 'all' ? filtroDistrito : undefined;
  const { data: conservatorias = [], isLoading } = useConservatorias(tipo, distrito, search || undefined);
  const { data: distritos = [] } = useDistritos();
  const { criar, atualizar, apagar, recalcular } = useConservatoriaMutations();

  // Modal form state
  const [form, setForm] = useState({ nome: '', tipo: 'predial', distrito: '', concelho: '', contacto: '', email: '', morada: '' });

  const openNew = () => {
    setEditItem(null);
    setForm({ nome: '', tipo: 'predial', distrito: '', concelho: '', contacto: '', email: '', morada: '' });
    setModalOpen(true);
  };

  const openEdit = (c: Conservatoria) => {
    setEditItem(c);
    setForm({
      nome: c.nome, tipo: c.tipo, distrito: c.distrito || '', concelho: c.concelho || '',
      contacto: c.contacto || '', email: c.email || '', morada: c.morada || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    try {
      if (editItem) {
        await atualizar.mutateAsync({ id: editItem.id, ...form });
        toast({ title: 'Conservatória atualizada' });
      } else {
        await criar.mutateAsync(form);
        toast({ title: 'Conservatória criada' });
      }
      setModalOpen(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.response?.data?.detail, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminar esta conservatória?')) return;
    try {
      await apagar.mutateAsync(id);
      toast({ title: 'Eliminada' });
    } catch {
      toast({ title: 'Erro', variant: 'destructive' });
    }
  };

  const handleRecalcular = async () => {
    try {
      const result = await recalcular.mutateAsync();
      toast({ title: `${result.atualizadas} conservatórias atualizadas` });
    } catch {
      toast({ title: 'Erro', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Landmark className="h-6 w-6" />
            Conservatórias
          </h1>
          <p className="text-sm text-muted-foreground">Base de dados de conservatórias com estimativas de tempo</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRecalcular} disabled={recalcular.isPending}>
            <RefreshCw className={`h-4 w-4 mr-2 ${recalcular.isPending ? 'animate-spin' : ''}`} />
            Recalcular Médias
          </Button>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Conservatória
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="predial">Predial</SelectItem>
            <SelectItem value="civil">Civil</SelectItem>
            <SelectItem value="comercial">Comercial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroDistrito} onValueChange={setFiltroDistrito}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Distrito" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os distritos</SelectItem>
            {distritos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Distrito</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Tempo Médio</TableHead>
              <TableHead>Registos</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">A carregar...</TableCell></TableRow>
            ) : conservatorias.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhuma conservatória</TableCell></TableRow>
            ) : (
              conservatorias.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell><Badge variant="outline">{TIPO_LABELS[c.tipo] || c.tipo}</Badge></TableCell>
                  <TableCell className="text-sm">{c.distrito || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.contacto || c.email || '-'}</TableCell>
                  <TableCell>
                    {c.tempo_medio_dias ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {c.tempo_medio_dias} dias
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-sm">{c.total_registos || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-red-600" onClick={() => handleDelete(c.id)}>
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Editar Conservatória' : 'Nova Conservatória'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="predial">Predial</SelectItem>
                  <SelectItem value="civil">Civil</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Distrito</Label><Input value={form.distrito} onChange={e => setForm(f => ({ ...f, distrito: e.target.value }))} /></div>
              <div><Label>Concelho</Label><Input value={form.concelho} onChange={e => setForm(f => ({ ...f, concelho: e.target.value }))} /></div>
            </div>
            <div><Label>Contacto</Label><Input value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))} /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div><Label>Morada</Label><Textarea value={form.morada} onChange={e => setForm(f => ({ ...f, morada: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.nome.trim()}>{editItem ? 'Guardar' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
