import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useDossies, Dossie, getDossieDisplayLabel } from '@/hooks/useDossies';
import { useClients } from '@/hooks/useClients';
import { Loader2 } from 'lucide-react';
import { ClientCombobox } from '@/components/ui/clientcombobox';
import { ClientModal } from './ClientModal';

const formSchema = z.object({
  entidade_id: z.number().optional(),
  descricao: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface DossieModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossie?: Dossie | null;
  entidadeId?: number; // Opcional - se não fornecido, permite selecionar
}

export const DossieModal: React.FC<DossieModalProps> = ({
  isOpen,
  onClose,
  dossie,
  entidadeId,
}) => {
  const { clients = [], isLoading: isClientsLoading } = useClients();
  const { createDossie, updateDossie } = useDossies();
  const isEditing = !!dossie;
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const needsEntidadeSelection = !isEditing && !entidadeId;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entidade_id: entidadeId || dossie?.entidade_id || undefined,
      descricao: '',
    },
  });

  useEffect(() => {
    if (dossie) {
      form.reset({
        entidade_id: dossie.entidade_id,
        descricao: dossie.descricao || '',
      });
    } else {
      form.reset({
        entidade_id: entidadeId || undefined,
        descricao: '',
      });
    }
  }, [dossie, entidadeId, form, isOpen]);

  const handleClientCreated = (createdClient: any) => {
    if (createdClient?.id) {
      const newId = typeof createdClient.id === 'string' ? parseInt(createdClient.id, 10) : createdClient.id;
      if (!Number.isNaN(newId)) {
        form.setValue('entidade_id', newId);
      }
    }
    setIsClientModalOpen(false);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && dossie) {
        await updateDossie.mutateAsync({
          id: dossie.id,
          descricao: data.descricao,
        });
      } else {
        if (!data.entidade_id) {
          form.setError('entidade_id', { message: 'Selecione uma entidade' });
          return;
        }
        await createDossie.mutateAsync({
          entidade_id: data.entidade_id,
          descricao: data.descricao,
        });
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar dossiê:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Arquivo' : 'Novo Arquivo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edite as informações do arquivo.'
              : 'Preencha os dados para criar um novo arquivo.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {needsEntidadeSelection && (
              <FormField
                control={form.control}
                name="entidade_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entidade *</FormLabel>
                    <ClientCombobox
                      clients={clients.filter((c: any) => {
                        const jaTemArquivo = c.tem_dossies === true;
                        const eSelecionada = c.id === field.value;
                        return eSelecionada || !jaTemArquivo;
                      })}
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      isLoading={isClientsLoading}
                      placeholderEmpty="Selecione uma entidade"
                      insideDialog
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isEditing && dossie && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Arquivo</label>
                <p className="text-sm font-semibold">{getDossieDisplayLabel(dossie)}</p>
                <p className="text-xs text-muted-foreground">
                  O arquivo é identificado pelo id e pela entidade
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição do arquivo..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createDossie.isPending || updateDossie.isPending}
              >
                {(createDossie.isPending || updateDossie.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={handleClientCreated}
      />
    </Dialog>
  );
};

