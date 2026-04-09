import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
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
  ChevronRight,
  Download,
  File,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  Image,
  Loader2,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AzureFicheiro,
  downloadFicheiroAzure,
  useApagarFicheiro,
  useConfigurarPasta,
  useListarFicheiros,
  useUploadFicheiro,
} from '@/hooks/useAzureFicheiros';
import { AzureEntityType } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'docx', 'doc', 'xlsx', 'xls',
  'jpg', 'jpeg', 'png',
  'msg', 'eml', 'txt', 'zip',
]);
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function getFileIcon(nome: string) {
  const ext = nome.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return <FileText className="h-5 w-5 text-red-500" />;
  if (['docx', 'doc'].includes(ext)) return <FileText className="h-5 w-5 text-blue-500" />;
  if (['xlsx', 'xls'].includes(ext)) return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  if (['jpg', 'jpeg', 'png'].includes(ext)) return <Image className="h-5 w-5 text-purple-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-PT', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

interface FicheirosBrowserProps {
  tipo: AzureEntityType;
  entityId: number;
  azureFolderPath: string | null | undefined;
  canEdit?: boolean;
  canConfigurePasta?: boolean;
  onPastaConfigured?: () => void;
}

export function FicheirosBrowser({
  tipo,
  entityId,
  azureFolderPath,
  canEdit = false,
  canConfigurePasta = false,
  onPastaConfigured,
}: FicheirosBrowserProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subpasta, setSubpasta] = useState<string | undefined>(undefined);
  const [breadcrumb, setBreadcrumb] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [configInput, setConfigInput] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const isConfigured = !!azureFolderPath;
  const { data: ficheiros, isLoading, error } = useListarFicheiros(
    tipo, isConfigured ? entityId : null, subpasta,
  );
  const uploadMutation = useUploadFicheiro(tipo, entityId);
  const apagarMutation = useApagarFicheiro(tipo, entityId);
  const configurarMutation = useConfigurarPasta(tipo, entityId);

  const navigateTo = (pasta: string) => {
    const relPath = azureFolderPath
      ? pasta.replace(azureFolderPath + '/', '').replace(azureFolderPath, '')
      : pasta;
    const parts = relPath ? relPath.split('/').filter(Boolean) : [];
    setBreadcrumb(parts);
    setSubpasta(relPath || undefined);
  };

  const navigateToBreadcrumb = (index: number) => {
    if (index < 0) {
      setBreadcrumb([]);
      setSubpasta(undefined);
    } else {
      const parts = breadcrumb.slice(0, index + 1);
      setBreadcrumb(parts);
      setSubpasta(parts.join('/'));
    }
  };

  const validateAndUpload = useCallback(async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        toast({ title: 'Extensão não permitida', description: `${file.name}: .${ext}`, variant: 'destructive' });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'Ficheiro demasiado grande', description: `${file.name}: ${formatSize(file.size)} (max 50MB)`, variant: 'destructive' });
        continue;
      }
      uploadMutation.mutate({ ficheiro: file, subpasta });
    }
  }, [subpasta, uploadMutation, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      validateAndUpload(e.dataTransfer.files);
    }
  }, [validateAndUpload]);

  const handleDownload = async (item: AzureFicheiro) => {
    try {
      const relativePath = azureFolderPath
        ? item.caminho_completo.replace(azureFolderPath + '/', '')
        : item.caminho_completo;
      await downloadFicheiroAzure(tipo, entityId, relativePath);
    } catch {
      toast({ title: 'Erro ao descarregar', variant: 'destructive' });
    }
  };

  // ── Estado: pasta não configurada ────────────────────────────
  if (!isConfigured) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Pasta Azure não configurada.</p>
          {canConfigurePasta && (
            showConfig ? (
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  placeholder="Ex: Clientes/12345-NomeCliente"
                  value={configInput}
                  onChange={(e) => setConfigInput(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={!configInput.trim() || configurarMutation.isPending}
                  onClick={() => {
                    configurarMutation.mutate(configInput.trim(), {
                      onSuccess: () => { setShowConfig(false); onPastaConfigured?.(); },
                    });
                  }}
                >
                  {configurarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowConfig(false)}>Cancelar</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowConfig(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar pasta Azure
              </Button>
            )
          )}
        </CardContent>
      </Card>
    );
  }

  // ── Estado: a carregar ───────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  // ── Estado: erro (Azure indisponível) ────────────────────────
  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Não foi possível carregar os ficheiros. Azure Files pode estar indisponível.
        </CardContent>
      </Card>
    );
  }

  const pastas = (ficheiros || []).filter((f) => f.tipo === 'pasta');
  const files = (ficheiros || []).filter((f) => f.tipo === 'ficheiro');

  return (
    <div
      className={`space-y-3 ${dragOver ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground overflow-x-auto">
          <button
            className="hover:text-foreground font-medium"
            onClick={() => navigateToBreadcrumb(-1)}
          >
            Raiz
          </button>
          {breadcrumb.map((part, i) => (
            <React.Fragment key={i}>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <button
                className="hover:text-foreground whitespace-nowrap"
                onClick={() => navigateToBreadcrumb(i)}
              >
                {part}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Upload */}
        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={Array.from(ALLOWED_EXTENSIONS).map((e) => `.${e}`).join(',')}
              onChange={(e) => {
                if (e.target.files?.length) validateAndUpload(e.target.files);
                e.target.value = '';
              }}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload
            </Button>
          </div>
        )}
      </div>

      {/* Drag indicator */}
      {dragOver && (
        <div className="border-2 border-dashed border-primary rounded-lg p-8 text-center text-primary">
          <Upload className="h-8 w-8 mx-auto mb-2" />
          Largar ficheiros aqui para fazer upload
        </div>
      )}

      {/* Pastas */}
      {pastas.map((pasta) => (
        <div
          key={pasta.caminho_completo}
          className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50 cursor-pointer"
          onClick={() => navigateTo(pasta.caminho_completo)}
        >
          <Folder className="h-5 w-5 text-yellow-500 shrink-0" />
          <span className="font-medium text-sm truncate">{pasta.nome}</span>
          <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
        </div>
      ))}

      {/* Ficheiros */}
      {files.map((item) => {
        const relativePath = azureFolderPath
          ? item.caminho_completo.replace(azureFolderPath + '/', '')
          : item.caminho_completo;
        return (
          <div
            key={item.caminho_completo}
            className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/50"
          >
            {getFileIcon(item.nome)}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{item.nome}</p>
              <p className="text-xs text-muted-foreground">
                {formatSize(item.tamanho_bytes)} &middot; {formatDate(item.ultima_modificacao)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDownload(item)}>
                <Download className="h-4 w-4" />
              </Button>
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(relativePath)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {/* Vazio */}
      {!pastas.length && !files.length && !dragOver && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
            Nenhum ficheiro nesta pasta.
            {canEdit && <p className="text-xs mt-1">Arraste ficheiros para aqui ou use o botão Upload.</p>}
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmação de apagar */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar ficheiro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que quer apagar "{deleteTarget?.split('/').pop()}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  apagarMutation.mutate(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
