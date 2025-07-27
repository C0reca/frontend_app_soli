import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Document } from '@/hooks/useDocuments';
import { FileText, Image, File, Download, User, Calendar, HardDrive } from 'lucide-react';

interface DocumentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onDownload?: (id: string, filename: string) => void;
}

export const DocumentDetailsModal: React.FC<DocumentDetailsModalProps> = ({
  isOpen,
  onClose,
  document,
  onDownload,
}) => {
  if (!document) return null;

  const getFileIcon = (type: string) => {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type.toLowerCase())) {
      return <Image className="h-6 w-6 text-green-600" />;
    } else if (['pdf', 'doc', 'docx', 'txt'].includes(type.toLowerCase())) {
      return <FileText className="h-6 w-6 text-red-600" />;
    } else {
      return <File className="h-6 w-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getFileTypeDescription = (type: string) => {
    const descriptions: { [key: string]: string } = {
      'pdf': 'Documento PDF',
      'doc': 'Documento Word',
      'docx': 'Documento Word',
      'txt': 'Arquivo de Texto',
      'jpg': 'Imagem JPEG',
      'jpeg': 'Imagem JPEG',
      'png': 'Imagem PNG',
      'gif': 'Imagem GIF',
      'webp': 'Imagem WebP',
    };
    return descriptions[type.toLowerCase()] || `Arquivo ${type.toUpperCase()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getFileIcon(document.type)}
            <span>Detalhes do Documento</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold break-all">{document.name}</h2>
              <p className="text-muted-foreground mt-1">{getFileTypeDescription(document.type)}</p>
            </div>
            <div className="flex space-x-2">
              <Badge className={getStatusColor(document.status)}>
                {document.status === 'active' ? 'Ativo' : 'Excluído'}
              </Badge>
              {document.version > 1 && (
                <Badge variant="outline">
                  Versão {document.version}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                  <HardDrive className="h-4 w-4" />
                  <span>Tamanho do Arquivo</span>
                </label>
                <p className="text-lg font-semibold">{document.size}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>Enviado por</span>
                </label>
                <p className="text-sm">{document.uploadedBy}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Data de Upload</span>
                </label>
                <p className="text-sm">{new Date(document.uploadedAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo de Arquivo</label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  .{document.type.toUpperCase()}
                </p>
              </div>

              {document.process && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Processo Associado</label>
                  <p className="text-sm text-blue-600 font-medium">{document.process}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(document.status)}>
                    {document.status === 'active' ? 'Ativo' : 'Excluído'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-3">Informações do Sistema</h3>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">ID do Documento:</span>
                <span className="font-mono text-xs">{document.id}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Versão:</span>
                <span>{document.version}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Data de Upload:</span>
                <span>{new Date(document.uploadedAt).toLocaleDateString('pt-BR')} às {new Date(document.uploadedAt).toLocaleTimeString('pt-BR')}</span>
              </div>
              {document.url && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">URL:</span>
                  <span className="font-mono text-xs break-all">{document.url}</span>
                </div>
              )}
            </div>
          </div>

          {document.status === 'active' && onDownload && (
            <div className="flex justify-end">
              <Button onClick={() => onDownload(document.id, document.name)}>
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