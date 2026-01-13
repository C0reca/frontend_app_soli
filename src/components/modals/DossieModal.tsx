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
import { useDossies, Dossie } from '@/hooks/useDossies';
import { useClients } from '@/hooks/useClients';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClientModal } from './ClientModal';

const formSchema = z.object({
  entidade_id: z.number().optional(),
  nome: z.string().min(1, 'Nome do dossiê é obrigatório'),
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
      nome: '',
      descricao: '',
    },
  });

  useEffect(() => {
    if (dossie) {
      form.reset({
        entidade_id: dossie.entidade_id,
        nome: dossie.nome || '',
        descricao: dossie.descricao || '',
      });
    } else {
      form.reset({
        entidade_id: entidadeId || undefined,
        nome: '',
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
          nome: data.nome,
          descricao: data.descricao,
        });
      } else {
        if (!data.entidade_id) {
          form.setError('entidade_id', { message: 'Selecione uma entidade' });
          return;
        }
        await createDossie.mutateAsync({
          entidade_id: data.entidade_id,
          nome: data.nome,
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
            {isEditing ? 'Editar Dossiê' : 'Novo Dossiê'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edite as informações do dossiê.'
              : 'Preencha os dados para criar um novo dossiê.'}
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
                    <div className="flex items-center justify-between gap-2">
                      <FormLabel>Entidade *</FormLabel>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsClientModalOpen(true)}
                      >
                        A entidade ainda não está criada?
                      </Button>
                    </div>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() ?? ""}
                      disabled={isClientsLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a entidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients
                          .filter((c: any) => c.tem_dossies === false || c.tem_dossies === null || c.id === field.value)
                          .map((client: any) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.nome || client.nome_empresa}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Apenas entidades sem dossiê podem ser selecionadas
                    </p>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Dossiê *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Dossiê Fiscal 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && dossie?.numero && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Número do Dossiê</label>
                <Input value={dossie.numero} disabled />
                <p className="text-xs text-muted-foreground">
                  O número é gerado automaticamente e não pode ser alterado
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
                      placeholder="Descrição do dossiê..."
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

