import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRightLeft } from 'lucide-react';
import { EntidadeExterna, useEntidadesExternas } from '@/hooks/useEntidadesExternas';

interface ConvertExternalEntityModalProps {
  entidade: EntidadeExterna;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConvertExternalEntityModal: React.FC<ConvertExternalEntityModalProps> = ({
  entidade,
  open,
  onOpenChange,
}) => {
  const { converter } = useEntidadesExternas();
  const [tipo, setTipo] = useState<'singular' | 'coletivo'>('singular');

  // Singular fields
  const [nome, setNome] = useState(entidade.nome || '');
  const [nif, setNif] = useState(entidade.nif || '');
  const [email, setEmail] = useState(entidade.email || '');
  const [telefone, setTelefone] = useState(entidade.contacto || '');

  // Coletivo fields
  const [nomeEmpresa, setNomeEmpresa] = useState(entidade.nome || '');
  const [nifEmpresa, setNifEmpresa] = useState(entidade.nif || '');

  const handleConvert = async () => {
    const dados: Record<string, unknown> = { tipo };

    if (tipo === 'singular') {
      dados.nome = nome;
      dados.nif = nif;
      dados.email = email || undefined;
      dados.telefone = telefone || undefined;
    } else {
      dados.nome_empresa = nomeEmpresa;
      dados.nif_empresa = nifEmpresa;
      dados.email = email || undefined;
      dados.telefone = telefone || undefined;
    }

    await converter.mutateAsync({ id: entidade.id, dados });
    onOpenChange(false);
  };

  const isValid = tipo === 'singular'
    ? nome.trim().length > 0 && nif.trim().length > 0
    : nomeEmpresa.trim().length > 0 && nifEmpresa.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Converter para Entidade Normal
          </DialogTitle>
          <DialogDescription>
            A entidade externa &quot;{entidade.nome}&quot; será convertida numa entidade normal.
            Todas as associações como entidade secundária serão migradas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Entidade</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as 'singular' | 'coletivo')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="singular">Pessoa Singular</SelectItem>
                <SelectItem value="coletivo">Pessoa Coletiva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipo === 'singular' ? (
            <>
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label>NIF *</Label>
                <Input value={nif} onChange={(e) => setNif(e.target.value)} placeholder="Número de identificação fiscal" />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Nome da Empresa *</Label>
                <Input value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} placeholder="Denominação social" />
              </div>
              <div className="space-y-2">
                <Label>NIF Empresa *</Label>
                <Input value={nifEmpresa} onChange={(e) => setNifEmpresa(e.target.value)} placeholder="NIF da empresa" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div className="space-y-2">
            <Label>Contacto</Label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Telefone / telemóvel" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleConvert} disabled={!isValid || converter.isPending}>
            {converter.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Converter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
