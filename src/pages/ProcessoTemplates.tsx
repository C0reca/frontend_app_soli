import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Archive, CheckCircle, Copy, Edit, FileText, ListChecks, Plus, Trash2,
} from 'lucide-react';
import { useTemplatesList, useTemplateMutations, ProcessoTemplate } from '@/hooks/useProcessoTemplates';

const estadoBadge: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
  rascunho: { variant: 'secondary', label: 'Rascunho' },
  ativo: { variant: 'default', label: 'Ativo' },
  arquivado: { variant: 'outline', label: 'Arquivado' },
};

export function ProcessoTemplatesPage() {
  const navigate = useNavigate();
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<ProcessoTemplate | null>(null);

  const { data: templates, isLoading } = useTemplatesList(
    filtroTipo || filtroEstado ? { tipo_processo: filtroTipo || undefined, estado: filtroEstado || undefined } : undefined,
  );
  const { create, duplicar, ativar, arquivar, remove } = useTemplateMutations();

  const tipos = [...new Set((templates || []).map(t => t.tipo_processo))].sort();

  const grouped = (templates || []).reduce<Record<string, ProcessoTemplate[]>>((acc, t) => {
    (acc[t.tipo_processo] ??= []).push(t);
    return acc;
  }, {});

  const handleNovo = () => {
    create.mutate(
      { nome: 'Novo Template', tipo_processo: 'Geral', passos: [], tarefas_automaticas: [], documentos_automaticos: [] },
      { onSuccess: (data: any) => navigate(`/admin/processo-templates/${data.id}`) },
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-60" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Templates de Processos</h1>
        <Button onClick={handleNovo} disabled={create.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <Select value={filtroTipo} onValueChange={v => setFiltroTipo(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo de processo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos os tipos</SelectItem>
            {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filtroEstado} onValueChange={v => setFiltroEstado(v === '_all' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="arquivado">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista agrupada */}
      {Object.entries(grouped).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum template encontrado.</p>
            <p className="text-sm mt-1">Crie o primeiro template para começar.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([tipo, items]) => (
          <Card key={tipo}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{tipo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map(t => {
                const badge = estadoBadge[t.estado] || estadoBadge.rascunho;
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{t.nome}</span>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        <span className="text-xs text-muted-foreground">v{t.versao}</span>
                      </div>
                      {t.descricao && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.descricao}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navigate(`/admin/processo-templates/${t.id}`)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => duplicar.mutate(t.id)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      {t.estado === 'rascunho' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => ativar.mutate(t.id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {t.estado === 'ativo' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => arquivar.mutate(t.id)}>
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      {t.estado === 'rascunho' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(t)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar template</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que quer apagar "{deleteTarget?.nome}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => {
              if (deleteTarget) { remove.mutate(deleteTarget.id); setDeleteTarget(null); }
            }}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
