import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MarketingInteracao } from '@/hooks/useMarketing';

interface MarketingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  interacao?: MarketingInteracao | null;
  clienteId?: number;
  isLoading?: boolean;
}

export const MarketingModal: React.FC<MarketingModalProps> = ({
  isOpen, onClose, onSubmit, interacao, clienteId, isLoading,
}) => {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      tipo_servico: interacao?.tipo_servico || 'seguros',
      empresa_parceira: interacao?.empresa_parceira || '',
      estado: interacao?.estado || 'nao_abordado',
      urgencia: interacao?.urgencia || 'media',
      notas: interacao?.notas || '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        tipo_servico: interacao?.tipo_servico || 'seguros',
        empresa_parceira: interacao?.empresa_parceira || '',
        estado: interacao?.estado || 'nao_abordado',
        urgencia: interacao?.urgencia || 'media',
        notas: interacao?.notas || '',
      });
    }
  }, [isOpen, interacao, reset]);

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      cliente_id: clienteId || interacao?.cliente_id,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle>{interacao ? 'Editar Interação' : 'Nova Interação de Marketing'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de Serviço *</Label>
              <Select value={watch('tipo_servico')} onValueChange={(v) => setValue('tipo_servico', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="seguros">Seguros</SelectItem>
                  <SelectItem value="creditos">Créditos</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={watch('estado')} onValueChange={(v) => setValue('estado', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_abordado">Não Abordado</SelectItem>
                  <SelectItem value="abordado">Abordado</SelectItem>
                  <SelectItem value="interessado">Interessado</SelectItem>
                  <SelectItem value="nao_interessado">Não Interessado</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Empresa Parceira</Label>
              <Input {...register('empresa_parceira')} />
            </div>
            <div>
              <Label>Urgência</Label>
              <Select value={watch('urgencia')} onValueChange={(v) => setValue('urgencia', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea rows={3} {...register('notas')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {interacao ? 'Guardar' : 'Registar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
