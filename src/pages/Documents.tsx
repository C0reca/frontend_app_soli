import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Download,
  Trash2,
  RotateCcw,
  FileText,
  Image,
  File,
  Eye,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  User,
  Loader2,
  FileSearch,
} from 'lucide-react';
import { useDocuments, formatFileSize, DocumentoSistema } from '@/hooks/useDocuments';
import { DocumentPreviewModal } from '@/components/modals/DocumentPreviewModal';

export const Documents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchContent, setSearchContent] = useState(false);
  const [filter, setFilter] = useState<'active' | 'deleted' | 'all'>('active');
  const [page, setPage] = useState(1);
  const perPage = 50;

  // Preview modal
  const [previewDoc, setPreviewDoc] = useState<DocumentoSistema | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Debounce search
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, searchContent ? 800 : 400); // Mais tempo se pesquisa por conteúdo
  };

  const {
    documents,
    total,
    totalPages,
    isLoading,
    isFetching,
    deleteDocument,
    restoreDocument,
    downloadDocument,
  } = useDocuments(page, perPage, debouncedSearch, filter, searchContent);

  const getFileIcon = (ext: string) => {
    const e = ext.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(e)) {
      return <Image className="h-5 w-5 text-green-600" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'odt', 'rtf', 'xls', 'xlsx'].includes(e)) {
      return <FileText className="h-5 w-5 text-red-600" />;
    }
    return <File className="h-5 w-5 text-gray-600" />;
  };

  const canPreview = (ext: string) => {
    const e = ext.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'pdf', 'doc', 'docx', 'txt', 'csv', 'log', 'md', 'json', 'xml', 'html', 'htm', 'odt', 'rtf'].includes(e);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem a certeza que pretende mover este documento para a lixeira?')) {
      await deleteDocument.mutateAsync(id);
    }
  };

  const handleRestore = async (id: number) => {
    await restoreDocument.mutateAsync(id);
  };

  const handleDownload = (id: number, filename: string) => {
    downloadDocument(id, filename);
  };

  const handlePreview = (doc: DocumentoSistema) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewDoc(null);
  };

  // Stats
  const stats = useMemo(() => {
    const totalSize = documents.reduce((acc, d) => acc + (d.tamanho_bytes || 0), 0);
    return {
      totalSize: formatFileSize(totalSize),
    };
  }, [documents]);

  if (isLoading && documents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documentos</h1>
        <p className="text-gray-600">Todos os documentos do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total de Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Nesta Página</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tamanho (página)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalSize}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={searchContent
                    ? 'Pesquisar no conteúdo dos documentos...'
                    : 'Pesquisar por nome, processo ou cliente...'
                  }
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
                {isFetching && debouncedSearch && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>

              {/* Content search toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors select-none ${
                        searchContent
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSearchContent(!searchContent);
                        setPage(1);
                      }}
                    >
                      <Checkbox
                        checked={searchContent}
                        onCheckedChange={(checked) => {
                          setSearchContent(!!checked);
                          setPage(1);
                        }}
                        className="h-4 w-4"
                      />
                      <FileSearch className="h-4 w-4" />
                      <span className="text-sm font-medium whitespace-nowrap">Pesquisar no conteúdo</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pesquisa dentro dos ficheiros (PDF, Word, TXT).<br/>Pode ser mais lento.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex space-x-1">
                {(['active', 'deleted', 'all'] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setFilter(f);
                      setPage(1);
                    }}
                  >
                    {f === 'active' ? 'Ativos' : f === 'deleted' ? 'Lixeira' : 'Todos'}
                  </Button>
                ))}
              </div>
            </div>

            {searchContent && debouncedSearch && (
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <FileSearch className="h-3 w-3" />
                A pesquisar dentro do conteúdo dos documentos — esta operação pode demorar mais.
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {!isLoading && documents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">Nenhum documento encontrado</p>
              <p className="text-sm">
                {debouncedSearch
                  ? searchContent
                    ? 'Nenhum documento contém este texto. Tente outros termos.'
                    : 'Tente alterar os termos de pesquisa.'
                  : filter === 'deleted'
                    ? 'A lixeira está vazia.'
                    : 'Ainda não existem documentos no sistema.'}
              </p>
            </div>
          )}

          {!isLoading && documents.length > 0 && (
            <div className="space-y-2">
              {documents.map((doc) => {
                const isDeleted = !!doc.apagado_em;
                const showPreview = canPreview(doc.extensao);
                return (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-gray-50 ${
                      isDeleted ? 'opacity-60 bg-gray-50' : ''
                    } ${showPreview ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (showPreview) handlePreview(doc);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(doc.extensao)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate max-w-[300px]">
                            {doc.nome_original}
                          </span>
                          {isDeleted && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Lixeira
                            </Badge>
                          )}
                          {doc.extensao && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                              .{doc.extensao}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                          {doc.tamanho_bytes > 0 && (
                            <span>{formatFileSize(doc.tamanho_bytes)}</span>
                          )}
                          {doc.criado_em && (
                            <span>
                              {new Date(doc.criado_em).toLocaleDateString('pt-PT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                          {doc.processo_titulo && (
                            <span className="text-blue-600 truncate max-w-[200px]">
                              <FolderOpen className="inline h-3 w-3 mr-0.5 -mt-0.5" />
                              {doc.processo_titulo}
                            </span>
                          )}
                          {doc.cliente_nome && (
                            <span className="text-gray-600 truncate max-w-[150px]">
                              <User className="inline h-3 w-3 mr-0.5 -mt-0.5" />
                              {doc.cliente_nome}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 ml-2 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {showPreview && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                          title="Preview"
                          onClick={() => handlePreview(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {!isDeleted ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Download"
                            onClick={() => handleDownload(doc.id, doc.nome_original)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Eliminar"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                          title="Restaurar"
                          onClick={() => handleRestore(doc.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Página {page} de {totalPages} ({total} documentos)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        document={previewDoc}
        onDownload={handleDownload}
      />
    </div>
  );
};
