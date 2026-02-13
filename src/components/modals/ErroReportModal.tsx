import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useErroReportMutations } from '@/hooks/useErroReports';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';

interface ErroReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillError?: {
    mensagem_erro?: string;
    stack_trace?: string;
  };
}

const APP_VERSION = '1.0.0';

export const ErroReportModal: React.FC<ErroReportModalProps> = ({
  open,
  onOpenChange,
  prefillError,
}) => {
  const [descricao, setDescricao] = useState('');
  const [passosReproduzir, setPassosReproduzir] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createReport, uploadAnexo } = useErroReportMutations();

  const handleClose = () => {
    if (!submitting) {
      setDescricao('');
      setPassosReproduzir('');
      setFiles([]);
      onOpenChange(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase();
        return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
      });
      setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
    });
    setFiles((prev) => [...prev, ...droppedFiles].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!descricao.trim()) return;
    setSubmitting(true);

    try {
      const reportData = {
        descricao: descricao.trim(),
        passos_reproduzir: passosReproduzir.trim() || undefined,
        mensagem_erro: prefillError?.mensagem_erro || undefined,
        stack_trace: prefillError?.stack_trace || undefined,
        pagina: window.location.pathname,
        browser_info: navigator.userAgent,
        app_versao: APP_VERSION,
      };

      const report = await createReport.mutateAsync(reportData);

      // Upload attachments
      for (const file of files) {
        try {
          await uploadAnexo.mutateAsync({ reportId: report.id, file });
        } catch {
          // Continue with remaining files even if one fails
        }
      }

      handleClose();
    } catch {
      // Error toast is handled by the mutation
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reportar um Erro</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="descricao">Descreva o problema *</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="O que aconteceu? O que esperava que acontecesse?"
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="passos">Passos para reproduzir (opcional)</Label>
            <Textarea
              id="passos"
              value={passosReproduzir}
              onChange={(e) => setPassosReproduzir(e.target.value)}
              placeholder="1. Abri a página X&#10;2. Cliquei no botão Y&#10;3. O erro apareceu"
              rows={3}
              className="mt-1"
            />
          </div>

          {prefillError?.mensagem_erro && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-xs font-medium text-red-800">Erro capturado automaticamente:</p>
              <p className="text-xs text-red-600 mt-1 font-mono break-all">
                {prefillError.mensagem_erro}
              </p>
            </div>
          )}

          {/* File upload area */}
          <div>
            <Label>Anexar imagens (opcional, máx. 5)</Label>
            <div
              className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-6 w-6 text-gray-400" />
              <p className="text-sm text-gray-500 mt-1">
                Clique ou arraste imagens aqui
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, GIF, WebP (máx. 5MB)</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1">
                    <ImageIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate flex-1">{file.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !descricao.trim()}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A enviar...
              </>
            ) : (
              'Enviar Reporte'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
