import React from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Correspondencia } from '@/hooks/useCorrespondencia';

interface CorrespondenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  correspondencia?: Correspondencia | null;
  processoId?: number;
  clienteId?: number;
  isLoading?: boolean;
}

export const CorrespondenciaModal: React.FC<CorrespondenciaModalProps> = ({
  isOpen, onClose, onSubmit, correspondencia, processoId, clienteId, isLoading,
}) => {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      tipo: correspondencia?.tipo || 'enviada',
      assunto: correspondencia?.assunto || '',
      descricao: correspondencia?.descricao || '',
      destinatario: correspondencia?.destinatario || '',
      remetente: correspondencia?.remetente || '',
      data_envio: correspondencia?.data_envio?.slice(0, 10) || '',
      data_rececao: correspondencia?.data_rececao?.slice(0, 10) || '',
      tracking_code: correspondencia?.tracking_code || '',
      estado: correspondencia?.estado || 'pendente',
      notas: correspondencia?.notas || '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        tipo: correspondencia?.tipo || 'enviada',
        assunto: correspondencia?.assunto || '',
        descricao: correspondencia?.descricao || '',
        destinatario: correspondencia?.destinatario || '',
        remetente: correspondencia?.remetente || '',
        data_envio: correspondencia?.data_envio?.slice(0, 10) || '',
        data_rececao: correspondencia?.data_rececao?.slice(0, 10) || '',
        tracking_code: correspondencia?.tracking_code || '',
        estado: correspondencia?.estado || 'pendente',
        notas: correspondencia?.notas || '',
      });
    }
  }, [isOpen, correspondencia, reset]);

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      processo_id: processoId || correspondencia?.processo_id || null,
      cliente_id: clienteId || correspondencia?.cliente_id || null,
      data_envio: data.data_envio || null,
      data_rececao: data.data_rececao || null,
    });
  };

  const tipo = watch('tipo');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{correspondencia ? 'Editar Correspondência' : 'Nova Correspondência'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setValue('tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="recebida">Recebida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={watch('estado')} onValueChange={(v) => setValue('estado', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="enviada">Enviada</SelectItem>
                  <SelectItem value="recebida">Recebida</SelectItem>
                  <SelectItem value="devolvida">Devolvida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Assunto *</Label>
            <Input {...register('assunto', { required: 'Obrigatório' })} />
            {errors.assunto && <span className="text-xs text-red-500">{errors.assunto.message as string}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{tipo === 'enviada' ? 'Destinatário' : 'Remetente'}</Label>
              <Input {...register(tipo === 'enviada' ? 'destinatario' : 'remetente')} />
            </div>
            <div>
              <Label>Código Tracking</Label>
              <Input {...register('tracking_code')} placeholder="Ex: RR123456789PT" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data de Envio</Label>
              <Input type="date" {...register('data_envio')} />
            </div>
            <div>
              <Label>Data de Receção</Label>
              <Input type="date" {...register('data_rececao')} />
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea rows={2} {...register('descricao')} />
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea rows={2} {...register('notas')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {correspondencia ? 'Guardar' : 'Registar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
