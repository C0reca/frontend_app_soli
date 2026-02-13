import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileText,
  Image,
  File,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useDocumentPreview, DocumentoSistema, formatFileSize } from '@/hooks/useDocuments';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentoSistema | null;
  onDownload?: (id: number, filename: string) => void;
}

/** Constrói o URL completo para servir ficheiros inline (PDF/imagens) */
function buildPreviewFileUrl(documentId: number): string {
  const isLocal =
    window.location.host.startsWith('localhost') ||
    window.location.host.startsWith('127.0.0.1');
  const isDev = import.meta.env.DEV;
  const token = localStorage.getItem('token');

  let base: string;
  if (isDev && isLocal) {
    base = 'http://127.0.0.1:8000/api';
  } else if (isLocal) {
    base = `http://${window.location.host}/api`;
  } else {
    base = `${window.location.protocol}//${window.location.host}/api`;
  }

  // Adicionar token como query param para autenticação no iframe/img
  const url = `${base}/documentos/preview-file/${documentId}`;
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document,
  onDownload,
}) => {
  const { data: preview, isLoading, error } = useDocumentPreview(
    isOpen && document ? document.id : null,
  );

  if (!document) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon(document.extensao)}
            <span className="truncate">{document.nome_original}</span>
            {document.extensao && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono flex-shrink-0">
                .{document.extensao}
              </Badge>
            )}
            <span className="text-xs text-gray-400 font-normal flex-shrink-0">
              {formatFileSize(document.tamanho_bytes)}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Preview content */}
        <div className="flex-1 min-h-0 overflow-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">A carregar preview...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <AlertCircle className="h-8 w-8 mb-3 text-red-400" />
              <p className="text-sm text-red-500">Erro ao carregar preview</p>
            </div>
          )}

          {!isLoading && !error && preview && (
            <>
              {/* Imagem */}
              {preview.tipo === 'imagem' && (
                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                  <img
                    src={buildPreviewFileUrl(document.id)}
                    alt={document.nome_original}
                    className="max-w-full max-h-[60vh] object-contain rounded"
                  />
                </div>
              )}

              {/* PDF */}
              {preview.tipo === 'pdf' && (
                <div className="w-full h-[65vh] bg-gray-50 rounded-lg overflow-hidden">
                  <iframe
                    src={buildPreviewFileUrl(document.id)}
                    className="w-full h-full border-0"
                    title={document.nome_original}
                  />
                </div>
              )}

              {/* HTML (DOCX convertido) */}
              {preview.tipo === 'html' && preview.conteudo && (
                <div className="bg-white border rounded-lg p-6 max-h-[65vh] overflow-auto">
                  <div
                    className="prose prose-sm max-w-none
                      prose-headings:text-gray-900 prose-p:text-gray-700
                      prose-table:border-collapse prose-td:border prose-td:p-2 prose-th:border prose-th:p-2
                      prose-img:max-w-full"
                    dangerouslySetInnerHTML={{ __html: preview.conteudo }}
                  />
                </div>
              )}

              {/* Texto puro */}
              {preview.tipo === 'texto' && preview.conteudo && (
                <div className="bg-gray-50 border rounded-lg p-4 max-h-[65vh] overflow-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                    {preview.conteudo}
                  </pre>
                </div>
              )}

              {/* Sem suporte */}
              {preview.tipo === 'sem_suporte' && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <File className="h-12 w-12 mb-3" />
                  <p className="text-sm">{preview.conteudo || 'Preview não disponível para este tipo de ficheiro.'}</p>
                  <p className="text-xs mt-1">Faça download para visualizar o documento.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center pt-3 border-t flex-shrink-0">
          <div className="text-xs text-gray-500">
            {document.processo_titulo && (
              <span>Processo: <span className="text-blue-600">{document.processo_titulo}</span></span>
            )}
            {document.processo_titulo && document.cliente_nome && <span className="mx-2">·</span>}
            {document.cliente_nome && (
              <span>Cliente: {document.cliente_nome}</span>
            )}
          </div>
          <div className="flex gap-2">
            {onDownload && !document.apagado_em && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDownload(document.id, document.nome_original)}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
