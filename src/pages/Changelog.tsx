import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChangelog, useChangelogMutations, ChangelogEntry } from '@/hooks/useChangelog';
import { ChangelogEntryModal } from '@/components/modals/ChangelogEntryModal';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Megaphone, Plus, Pencil, Trash2, Sparkles, Bug, Shield, Wrench } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const tipoConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  melhoria: { label: 'Melhoria', color: 'bg-blue-100 text-blue-800', icon: Sparkles },
  correcao: { label: 'Correção', color: 'bg-green-100 text-green-800', icon: Bug },
  nova_funcionalidade: { label: 'Nova Funcionalidade', color: 'bg-purple-100 text-purple-800', icon: Wrench },
  seguranca: { label: 'Segurança', color: 'bg-orange-100 text-orange-800', icon: Shield },
};

export const Changelog: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: entries = [], isLoading } = useChangelog();
  const { marcarLidas, deleteEntry } = useChangelogMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ChangelogEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Mark all as read when page opens
  useEffect(() => {
    marcarLidas.mutate();
  }, []);

  // Group entries by version
  const groupedByVersion = useMemo(() => {
    const groups: Record<string, ChangelogEntry[]> = {};
    for (const entry of entries) {
      if (!groups[entry.versao]) groups[entry.versao] = [];
      groups[entry.versao].push(entry);
    }
    return groups;
  }, [entries]);

  const versions = Object.keys(groupedByVersion);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleEdit = (entry: ChangelogEntry) => {
    setEditingEntry(entry);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingEntry(null);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteEntry.mutate(deletingId);
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Novidades / Atualizações
          </h1>
          <p className="text-gray-500 mt-1">
            Acompanhe as melhorias e correções da plataforma
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Entrada
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">Ainda não existem atualizações registadas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {versions.map((version) => {
            const versionEntries = groupedByVersion[version];
            const firstEntryDate = versionEntries[0]?.data_lancamento;

            return (
              <div key={version}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    Versão {version}
                  </h2>
                  <span className="text-sm text-gray-400">
                    {firstEntryDate ? formatDate(firstEntryDate) : ''}
                  </span>
                </div>

                <div className="space-y-3">
                  {versionEntries.map((entry) => {
                    const config = tipoConfig[entry.tipo] || tipoConfig.melhoria;
                    const Icon = config.icon;

                    return (
                      <Card key={entry.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="py-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={config.color}>{config.label}</Badge>
                                <h3 className="font-semibold text-gray-900">
                                  {entry.titulo}
                                </h3>
                                {!entry.publicado && (
                                  <Badge variant="outline" className="text-xs">
                                    Rascunho
                                  </Badge>
                                )}
                              </div>
                              {entry.descricao && (
                                <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                                  {entry.descricao}
                                </p>
                              )}
                              <p className="mt-2 text-xs text-gray-400">
                                {formatDate(entry.data_lancamento)}
                                {entry.criado_por_nome && ` por ${entry.criado_por_nome}`}
                              </p>
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(entry)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => handleDelete(entry.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAdmin && (
        <ChangelogEntryModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          entry={editingEntry}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar Entrada</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja apagar esta entrada do changelog? Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
