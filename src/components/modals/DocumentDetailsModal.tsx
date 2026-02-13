import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { DocumentoSistema, formatFileSize } from '@/hooks/useDocuments';
import { FileText, Image, File, Download, Calendar, HardDrive, FolderOpen, User } from 'lucide-react';

interface DocumentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentoSistema | null;
  onDownload?: (id: number, filename: string) => void;
}

export const DocumentDetailsModal: React.FC<DocumentDetailsModalProps> = ({
  isOpen,
  onClose,
  document,
  onDownload,
}) => {
  if (!document) return null;

  const getFileIcon = (ext: string) => {
    const e = ext.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(e)) {
      return <Image className="h-6 w-6 text-green-600" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'odt', 'rtf', 'xls', 'xlsx'].includes(e)) {
      return <FileText className="h-6 w-6 text-red-600" />;
    }
    return <File className="h-6 w-6 text-gray-600" />;
  };

  const isDeleted = !!document.apagado_em;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getFileIcon(document.extensao)}
            <span>Detalhes do Documento</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold break-all">{document.nome_original}</h2>
              {document.extensao && (
                <p className="text-muted-foreground mt-1 font-mono text-sm">.{document.extensao.toUpperCase()}</p>
              )}
            </div>
            <Badge variant={isDeleted ? 'destructive' : 'default'}>
              {isDeleted ? 'Na Lixeira' : 'Ativo'}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <HardDrive className="h-4 w-4" />
                  Tamanho
                </label>
                <p className="text-lg font-semibold">{formatFileSize(document.tamanho_bytes)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Data de Criação
                </label>
                <p className="text-sm">
                  {document.criado_em
                    ? new Date(document.criado_em).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {document.processo_titulo && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <FolderOpen className="h-4 w-4" />
                    Processo
                  </label>
                  <p className="text-sm text-blue-600 font-medium">{document.processo_titulo}</p>
                </div>
              )}

              {document.cliente_nome && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Cliente
                  </label>
                  <p className="text-sm">{document.cliente_nome}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-2">Informações do Sistema</h3>
            <div className="bg-muted p-3 rounded-lg space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-xs">{document.id}</span>
              </div>
              {document.processo_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processo ID:</span>
                  <span className="font-mono text-xs">{document.processo_id}</span>
                </div>
              )}
              {document.tarefa_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarefa ID:</span>
                  <span className="font-mono text-xs">{document.tarefa_id}</span>
                </div>
              )}
            </div>
          </div>

          {!isDeleted && onDownload && (
            <div className="flex justify-end">
              <Button onClick={() => onDownload(document.id, document.nome_original)}>
                <Download className="mr-2 h-4 w-4" />
                Fazer Download
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
