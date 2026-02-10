import React, { useEffect, useState, useMemo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useDossies, Dossie, getDossieDisplayLabel } from '@/hooks/useDossies';
import { useClients } from '@/hooks/useClients';
import { useProcesses } from '@/hooks/useProcesses';
import { Loader2, Check, FolderOpen } from 'lucide-react';
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command';
import { CommandDialog } from '@/components/ui/command';
import { cn, normalizeString } from '@/lib/utils';

const formSchema = z.object({
  entidade_id: z.number().optional(),
  descricao: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface DossieModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossie?: Dossie | null;
  entidadeId?: number;
}

export const DossieModal: React.FC<DossieModalProps> = ({
  isOpen,
  onClose,
  dossie,
  entidadeId,
}) => {
  const { clients = [], isLoading: isClientsLoading } = useClients();
  const { processes = [] } = useProcesses();
  const { createDossie, updateDossie } = useDossies();
  const isEditing = !!dossie;
  const [entityPickerOpen, setEntityPickerOpen] = useState(false);
  const [entitySearch, setEntitySearch] = useState('');
  const needsEntidadeSelection = !isEditing && !entidadeId;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entidade_id: entidadeId ?? dossie?.entidade_id ?? undefined,
      descricao: '',
    },
  });

  useEffect(() => {
    if (dossie) {
      form.reset({
        entidade_id: dossie.entidade_id,
        descricao: dossie.descricao ?? '',
      });
    } else {
      form.reset({
        entidade_id: entidadeId ?? undefined,
        descricao: '',
      });
    }
  }, [dossie, entidadeId, form, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setEntityPickerOpen(false);
      setEntitySearch('');
    }
  }, [isOpen]);

  const entidadeIdValue = form.watch('entidade_id');
  const entidadesDisponiveis = useMemo(() => {
    return clients
      .filter((c: { id: number | string; tem_dossies?: boolean }) => {
        const jaTemArquivo = c.tem_dossies === true;
        const eSelecionada = String(c.id) === String(entidadeIdValue);
        return eSelecionada || !jaTemArquivo;
      })
      .sort((a, b) => Number(b.id) - Number(a.id));
  }, [clients, entidadeIdValue]);

  const entidadesFiltradas = useMemo(() => {
    const norm = normalizeString(entitySearch);
    return entidadesDisponiveis.filter((c) => {
      const nome = (c.nome ?? (c as { nome_empresa?: string }).nome_empresa ?? '').toString();
      const nif =
        ((c as { tipo?: string }).tipo === 'coletivo'
          ? (c as { nif_empresa?: string }).nif_empresa
          : (c as { nif?: string }).nif) ?? '';
      return normalizeString(nome).includes(norm) || normalizeString(nif).includes(norm);
    });
  }, [entidadesDisponiveis, entitySearch]);

  const processosDaEntidade = useMemo(() => {
    if (entidadeIdValue == null) return [];
    return (processes as { cliente_id?: number }[]).filter(
      (p) => p.cliente_id != null && p.cliente_id === entidadeIdValue
    );
  }, [processes, entidadeIdValue]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && dossie) {
        await updateDossie.mutateAsync({
          id: dossie.id,
          descricao: data.descricao ?? '',
        });
      } else {
        if (data.entidade_id == null) {
          form.setError('entidade_id', { message: 'Selecione uma entidade' });
          return;
        }
        await createDossie.mutateAsync({
          entidade_id: data.entidade_id,
          nome: '',
          descricao: data.descricao ?? '',
        });
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar dossiê:', error);
    }
  };

  const selectedEntidade = entidadesDisponiveis.find(
    (c) => String(c.id) === String(entidadeIdValue)
  );
  const labelEntidade = selectedEntidade
    ? (selectedEntidade.nome ?? (selectedEntidade as { nome_empresa?: string }).nome_empresa ?? `#${selectedEntidade.id}`)
    : 'Selecione uma entidade';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            {isEditing ? 'Editar Arquivo' : 'Novo Arquivo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edite as informações do arquivo.'
              : 'Preencha os dados para criar um novo arquivo. Escolha a entidade e, se quiser, uma descrição.'}
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
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between font-normal"
                      onClick={() => setEntityPickerOpen(true)}
                      disabled={isClientsLoading}
                    >
                      <span className="truncate">{labelEntidade}</span>
                    </Button>
                    <CommandDialog
                      open={entityPickerOpen}
                      onOpenChange={(o) => {
                        setEntityPickerOpen(o);
                        setEntitySearch('');
                      }}
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Pesquisar por nome ou NIF..."
                          value={entitySearch}
                          onValueChange={setEntitySearch}
                        />
                        <CommandList>
                          <CommandEmpty>Nenhuma entidade encontrada.</CommandEmpty>
                          {entidadesFiltradas.map((c) => {
                            const nome =
                              c.nome ??
                              (c as { nome_empresa?: string }).nome_empresa ??
                              `#${c.id}`;
                            const nif =
                              (c as { tipo?: string }).tipo === 'coletivo'
                                ? (c as { nif_empresa?: string }).nif_empresa
                                : (c as { nif?: string }).nif;
                            const id =
                              typeof c.id === 'string' ? parseInt(c.id, 10) : c.id;
                            return (
                              <CommandItem
                                key={c.id}
                                onSelect={() => {
                                  field.onChange(id);
                                  setEntityPickerOpen(false);
                                }}
                                className="flex justify-between items-center"
                              >
                                <div className="flex flex-col">
                                  <span>{nome}</span>
                                  {nif && (
                                    <span className="text-xs text-muted-foreground">
                                      NIF: {nif}
                                    </span>
                                  )}
                                </div>
                                <Check
                                  className={cn(
                                    'h-4 w-4 shrink-0',
                                    String(c.id) === String(field.value)
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                              </CommandItem>
                            );
                          })}
                        </CommandList>
                      </Command>
                    </CommandDialog>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {entidadeIdValue != null && processosDaEntidade.length > 0 && !isEditing && (
              <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                <span className="font-medium">Processos da entidade:</span>{' '}
                {processosDaEntidade.length} processo(s) desta entidade ficarão
                associados a este arquivo.
              </div>
            )}

            {isEditing && dossie && (
              <div className="space-y-1 rounded-md border bg-muted/50 px-3 py-2">
                <p className="text-sm font-medium">Arquivo</p>
                <p className="text-sm font-semibold">{getDossieDisplayLabel(dossie)}</p>
                <p className="text-xs text-muted-foreground">
                  Identificado pelo id e pela entidade
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição do arquivo..."
                      className="resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
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
                {createDossie.isPending || updateDossie.isPending
                  ? 'A guardar...'
                  : isEditing
                    ? 'Atualizar'
                    : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
