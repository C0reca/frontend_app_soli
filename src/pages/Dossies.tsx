import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Folder, Building, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDossies, Dossie, getDossieDisplayLabel, getEntidadeNomeFromDossie } from '@/hooks/useDossies';
import { DossieModal } from '@/components/modals/DossieModal';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const PAGE_SIZE = 25;

export const Dossies: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const { dossies, dossiesTotal, isLoading } = useDossies(undefined, {
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    search: searchTerm.trim() || undefined,
  });
  const [selectedDossie, setSelectedDossie] = useState<Dossie | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');

  const totalPages = Math.max(1, Math.ceil(dossiesTotal / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Garantir array real (evita "t.filter is not a function" com cache/resposta inesperada)
  const dossiesList: Dossie[] = Array.isArray(dossies) ? [...dossies] : [];
  const filteredDossies = dossiesList; // Pesquisa feita no servidor (toda a lista)

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
              <Button onClick={(e) => handleEdit(selectedDossie, e)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
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
                    <Card key={processo.id} className="hover:shadow-md transition-shadow">
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
                Gerir arquivos e processos associados. Página {page} de {totalPages} (total: {dossiesTotal}).
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
            <div className="grid gap-4">
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
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>
                              <span className="font-medium">Entidade:</span>{' '}
                              {getEntidadeNomeFromDossie(dossie)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>
                              <span className="font-medium">Processos:</span>{' '}
                              {getProcessosCount(dossie)}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-xs text-muted-foreground">
                              Criado em: {format(new Date(dossie.criado_em), "dd 'de' MMMM 'de' yyyy", { locale: pt })}
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

          {!isLoading && dossiesTotal > 0 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground">
                {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, dossiesTotal)} de {dossiesTotal}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!canPrev}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!canNext}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
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

