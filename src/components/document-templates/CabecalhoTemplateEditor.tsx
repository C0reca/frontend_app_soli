import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { HeaderEditor } from '@/components/editor/HeaderEditor';
import {
  useCabecalhoTemplates,
  useCabecalhoTemplate,
} from '@/hooks/useCabecalhoTemplates';

interface CabecalhoTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  cabecalhoId: number | null; // null = new
}

export const CabecalhoTemplateEditor: React.FC<CabecalhoTemplateEditorProps> = ({
  isOpen,
  onClose,
  cabecalhoId,
}) => {
  const { createCabecalho, updateCabecalho } = useCabecalhoTemplates();
  const { data: existing, isLoading: loadingExisting } = useCabecalhoTemplate(cabecalhoId);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [conteudoHtml, setConteudoHtml] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing && cabecalhoId) {
      setNome(existing.nome);
      setDescricao(existing.descricao || '');
      setConteudoHtml(existing.conteudo_html || '');
    } else if (!cabecalhoId) {
      setNome('');
      setDescricao('');
      setConteudoHtml('');
    }
  }, [existing, cabecalhoId]);

  // Reset when opening for a new cabecalho
  useEffect(() => {
    if (isOpen && !cabecalhoId) {
      setNome('');
      setDescricao('');
      setConteudoHtml('');
    }
  }, [isOpen, cabecalhoId]);

  const handleSave = async () => {
    if (!nome.trim()) return;
    setSaving(true);
    try {
      if (cabecalhoId) {
        await updateCabecalho.mutateAsync({
          id: cabecalhoId,
          nome,
          descricao: descricao || undefined,
          conteudo_html: conteudoHtml,
        });
      } else {
        await createCabecalho.mutateAsync({
          nome,
          descricao: descricao || undefined,
          conteudo_html: conteudoHtml,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cabecalhoId ? 'Editar Cabeçalho' : 'Novo Cabeçalho'}
          </DialogTitle>
          <DialogDescription>
            Crie um cabeçalho reutilizável para os seus templates de documentos.
          </DialogDescription>
        </DialogHeader>

        {cabecalhoId && loadingExisting ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="cab-nome">Nome</Label>
              <Input
                id="cab-nome"
                placeholder="Nome do cabeçalho..."
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cab-descricao">Descrição (opcional)</Label>
              <Input
                id="cab-descricao"
                placeholder="Breve descrição..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Conteúdo do Cabeçalho</Label>
              <div className="cabecalho-editor-standalone">
                <HeaderEditor
                  content={conteudoHtml}
                  onChange={setConteudoHtml}
                />
              </div>
              <p className="text-xs text-gray-500">
                Suporta texto, imagens e variáveis. Este cabeçalho aparecerá no topo de cada página dos documentos que o utilizem.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || !nome.trim()}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Guardar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
