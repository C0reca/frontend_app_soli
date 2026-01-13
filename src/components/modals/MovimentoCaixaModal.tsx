import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { MovimentoCaixa, CreateMovimentoData } from '@/hooks/useCaixa';

const formSchema = z.object({
  tipo: z.enum(['entrada', 'saida'], {
    required_error: "Selecione o tipo de movimento",
  }),
  valor: z.number({
    required_error: "Valor é obrigatório",
    invalid_type_error: "Valor deve ser um número",
  }).positive("Valor deve ser positivo"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  data: z.string().min(1, "Data é obrigatória"),
  hora: z.string().refine(
    (val) => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val),
    {
      message: "Hora inválida. Utilize o formato HH:MM",
    }
  ).optional().nullable(),
  associado_a_processo: z.boolean().default(false),
  processo_id: z.string().optional(),
  tipo_transferencia: z.enum(['mb', 'dinheiro', 'transferencia']).default('dinheiro'),
}).refine((data) => {
  if (data.associado_a_processo && !data.processo_id) {
    return false;
  }
  return true;
}, {
  message: "ID do processo é obrigatório quando associado a processo",
  path: ["processo_id"],
});

type FormData = z.infer<typeof formSchema>;

interface MovimentoCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateMovimentoData) => Promise<void>;
  onSuccess?: () => void;
  initialData?: MovimentoCaixa | null;
  mode?: 'create' | 'edit';
}

export const MovimentoCaixaModal: React.FC<MovimentoCaixaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSuccess,
  initialData = null,
  mode = 'create',
}) => {
  const defaultValues = useMemo<FormData>(() => {
    const agora = new Date();
    const dataHoje = agora.toISOString().split('T')[0];
    return {
      tipo: undefined,
      valor: undefined,
      descricao: '',
      data: dataHoje,
      hora: '',
      associado_a_processo: false,
      processo_id: '',
      tipo_transferencia: 'dinheiro',
    };
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const isAssociadoAProcesso = form.watch('associado_a_processo');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialData) {
      const dataIso = initialData.data
        ? new Date(initialData.data).toISOString().split('T')[0]
        : defaultValues.data;
      const hora = initialData.hora ?? (initialData.data ? new Date(initialData.data).toTimeString().slice(0, 5) : '');
      form.reset({
        tipo: initialData.tipo,
        valor: initialData.valor,
        descricao: initialData.descricao,
        data: dataIso,
        hora,
        associado_a_processo: Boolean(initialData.processo_id),
        processo_id: initialData.processo_id ? String(initialData.processo_id) : '',
        tipo_transferencia: initialData.tipo_transferencia ?? 'dinheiro',
      });
    } else {
      form.reset(defaultValues);
    }
  }, [isOpen, initialData, form, defaultValues]);

  const handleSubmit = async (data: FormData) => {
      // Remove processo_id se não estiver associado a processo
    const submitData: CreateMovimentoData = {
        ...data,
      hora: data.hora ? data.hora : undefined,
        processo_id: data.associado_a_processo ? data.processo_id : undefined,
      };
      
      await onSave(submitData);
      
      form.reset();
      onSuccess?.();
  };

  const handleClose = () => {
    form.reset(defaultValues);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Editar Movimento de Caixa' : 'Novo Movimento de Caixa'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Atualize os detalhes do movimento selecionado.'
              : 'Registe uma entrada ou saída de dinheiro na caixa.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Movimento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (€) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'edit' && (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="hora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="tipo_transferencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Transferência *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de transferência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mb">Mb</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o motivo do movimento..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="associado_a_processo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Associar a um processo
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Marque se este movimento está relacionado com um processo específico.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {isAssociadoAProcesso && (
              <FormField
                control={form.control}
                name="processo_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID do Processo *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o ID do processo"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'A registar...' : 'Registar Movimento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};