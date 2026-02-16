import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Folder, Building, FileText, Trash2, ArrowRightLeft } from 'lucide-react';
import { useDossies, Dossie, getDossieDisplayLabel, getEntidadeNomeFromDossie } from '@/hooks/useDossies';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';
import { DossieModal } from '@/components/modals/DossieModal';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { normalizeString } from '@/lib/utils';

export const Dossies: React.FC = () => {
  const navigate = useNavigate();
  const { dossies, isLoading, changeEntidade, deleteDossie } = useDossies();
  const { clients } = useClients();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDossie, setSelectedDossie] = useState<Dossie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [searchParams, setSearchParams] = useSearchParams();

  // Admin: change entity dialog
  const [isChangeEntidadeOpen, setIsChangeEntidadeOpen] = useState(false);
  const [newEntidadeId, setNewEntidadeId] = useState<number | ''>('');
  const [entidadeSearchTerm, setEntidadeSearchTerm] = useState('');

  // Admin: delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  React.useEffect(() => {
    const abrir = searchParams.get('abrir');
    if (abrir && dossies.length > 0) {
      const d = dossies.find((x: Dossie) => String(x.id) === abrir);
      if (d) {
        setSelectedDossie(d);
        setViewMode('details');
      }
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('abrir');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, dossies]);

  const filteredDossies = dossies.filter((dossie) => {
    const termNormalized = normalizeString(searchTerm);
    const displayLabel = getDossieDisplayLabel(dossie);
    const idMatch = String(dossie.id).includes(searchTerm.trim());
    const labelMatch = normalizeString(displayLabel).includes(termNormalized);
    const numeroMatch = normalizeString(dossie.numero || '').includes(termNormalized);
    return idMatch || labelMatch || numeroMatch;
  });

  const handleView = (dossie: Dossie) => {
    setSelectedDossie(dossie);
    setViewMode('details');
  };

  const handleEdit = (dossie: Dossie, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDossie(dossie);
    setIsModalOpen(true);
  };

  const getProcessosCount = (dossie: Dossie) => {
    const processos = dossie.processos || [];
    return processos.length;
  };

  const handleChangeEntidade = () => {
    if (!selectedDossie || !newEntidadeId) return;
    changeEntidade.mutate(
      { dossieId: selectedDossie.id, entidadeId: Number(newEntidadeId) },
      {
        onSuccess: (data) => {
          setSelectedDossie(data);
          setIsChangeEntidadeOpen(false);
          setNewEntidadeId('');
          setEntidadeSearchTerm('');
        },
      }
    );
  };

  const handleDeleteDossie = () => {
    if (!selectedDossie) return;
    deleteDossie.mutate(selectedDossie.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedDossie(null);
        setViewMode('list');
      },
    });
  };

  // Entidades disponíveis para mudança (excluir a atual)
  const availableEntidades = clients
    .filter((c: any) => {
      if (selectedDossie && Number(c.id) === selectedDossie.entidade_id) return false;
      const nome = c.nome || c.nome_empresa || '';
      if (entidadeSearchTerm) {
        return normalizeString(nome).includes(normalizeString(entidadeSearchTerm))
          || String(c.id).includes(entidadeSearchTerm.trim());
      }
      return true;
    })
    .slice(0, 50);

  if (viewMode === 'details' && selectedDossie) {
    const processos = (selectedDossie as any).processos || [];
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setViewMode('list')}>
            ← Voltar à lista
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Folder className="h-6 w-6" />
                  <span>{getDossieDisplayLabel(selectedDossie)}</span>
                </CardTitle>
                <CardDescription>
                  Arquivo associado à entidade
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewEntidadeId('');
                        setEntidadeSearchTerm('');
                        setIsChangeEntidadeOpen(true);
                      }}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Alterar Entidade
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={(selectedDossie.processos?.length ?? 0) > 0}
                      title={(selectedDossie.processos?.length ?? 0) > 0 ? 'Remova os processos primeiro para apagar o arquivo' : undefined}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Apagar
                    </Button>
                  </>
                )}
                <Button onClick={(e) => handleEdit(selectedDossie, e)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Entidade</label>
                <p className="text-lg font-semibold">{getEntidadeNomeFromDossie(selectedDossie)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                <p>{format(new Date(selectedDossie.criado_em), "dd 'de' MMMM 'de' yyyy", { locale: pt })}</p>
              </div>
              {selectedDossie.descricao && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p>{selectedDossie.descricao}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Processos ({processos.length})</span>
              </h3>
              {processos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum processo associado a este arquivo.
                </p>
              ) : (
                <div className="space-y-3">
                  {processos.map((processo: any) => (
                    <Card
                      key={processo.id}
                      role="button"
                      tabIndex={0}
                      className="hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      onClick={() => navigate(`/processos?abrir=${processo.id}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/processos?abrir=${processo.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{processo.titulo}</h4>
                            {processo.descricao && (
                              <p className="text-sm text-muted-foreground mt-1">{processo.descricao}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2">
                              {processo.tipo && (
                                <Badge variant="outline">{processo.tipo}</Badge>
                              )}
                              <Badge variant={processo.estado === 'concluido' ? 'default' : processo.estado === 'em_curso' ? 'secondary' : 'outline'}>
                                {processo.estado}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(processo.criado_em), "dd/MM/yyyy", { locale: pt })}
                              </span>
                            </div>
                          </div>
                          <Eye className="h-4 w-4 text-muted-foreground shrink-0 ml-2" aria-hidden />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Admin: Dialog para alterar entidade */}
        <Dialog open={isChangeEntidadeOpen} onOpenChange={setIsChangeEntidadeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Entidade do Arquivo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                A entidade dos processos dentro do arquivo também será alterada.
              </p>
              <Input
                placeholder="Pesquisar entidade por nome ou ID..."
                value={entidadeSearchTerm}
                onChange={(e) => setEntidadeSearchTerm(e.target.value)}
              />
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {availableEntidades.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">Nenhuma entidade encontrada.</p>
                ) : (
                  availableEntidades.map((c: any) => (
                    <div
                      key={c.id}
                      className={`p-3 cursor-pointer hover:bg-accent border-b last:border-b-0 ${Number(c.id) === newEntidadeId ? 'bg-accent' : ''}`}
                      onClick={() => setNewEntidadeId(Number(c.id))}
                    >
                      <span className="font-medium">{c.nome || c.nome_empresa}</span>
                      <span className="text-xs text-muted-foreground ml-2">#{c.id}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChangeEntidadeOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleChangeEntidade}
                disabled={!newEntidadeId || changeEntidade.isPending}
              >
                {changeEntidade.isPending ? 'A alterar...' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Admin: Dialog de confirmação para apagar */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar Arquivo</AlertDialogTitle>
              <AlertDialogDescription>
                Tem a certeza que deseja apagar o arquivo <strong>{getDossieDisplayLabel(selectedDossie)}</strong>?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteDossie}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteDossie.isPending ? 'A apagar...' : 'Apagar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Folder className="h-6 w-6" />
                <span>Arquivos</span>
              </CardTitle>
              <CardDescription>
                Gerir arquivos e processos associados
              </CardDescription>
            </div>
            <Button onClick={() => {
              setSelectedDossie(null);
              setIsModalOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Arquivo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Pesquisar por id ou entidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando arquivos...
            </div>
          ) : filteredDossies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum arquivo encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDossies.map((dossie) => (
                <Card
                  key={dossie.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleView(dossie)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">{getDossieDisplayLabel(dossie)}</h3>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span><span className="font-medium">Entidade:</span> {getEntidadeNomeFromDossie(dossie)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span><span className="font-medium">Processos:</span> {getProcessosCount(dossie)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              <span className="font-medium text-gray-600">Criado em:</span> {format(new Date(dossie.criado_em), "dd 'de' MMMM 'de' yyyy", { locale: pt })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEdit(dossie, e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(dossie);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isModalOpen && (
        <DossieModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDossie(null);
          }}
          dossie={selectedDossie}
          entidadeId={selectedDossie?.entidade_id}
        />
      )}
    </div>
  );
};

