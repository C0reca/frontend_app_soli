import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useRegistosPrediais, RegistoPredial } from '@/hooks/useRegistosPrediais';
import { useClients } from '@/hooks/useClients';

const formSchema = z.object({
  numero_processo: z.string().min(1, 'Número do processo é obrigatório'),
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  predio: z.string().min(1, 'Prédio é obrigatório'),
  freguesia: z.string().min(1, 'Freguesia é obrigatória'),
  registo: z.string().min(1, 'Registo é obrigatório'),
  conservatoria: z.string().min(1, 'Conservatória é obrigatória'),
  requisicao: z.string().min(1, 'Requerimento é obrigatório'),
  apresentacao: z.string().min(1, 'Apresentação é obrigatória'),
  data: z.string().min(1, 'Data é obrigatória'),
  apresentacao_complementar: z.string().optional(),
  outras_observacoes: z.string().optional(),
  estado: z.enum(['Concluído', 'Desistência', 'Recusado', 'Provisórios']),
});

type FormData = z.infer<typeof formSchema>;

interface RegistoPredialModalProps {
  isOpen: boolean;
  onClose: () => void;
  registo?: RegistoPredial | null;
}

export const RegistoPredialModal: React.FC<RegistoPredialModalProps> = ({
  isOpen,
  onClose,
  registo,
}) => {
  const { createRegisto, updateRegisto } = useRegistosPrediais();
  const { clients } = useClients();
  const isEditing = !!registo;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero_processo: '',
      cliente_id: '',
      predio: '',
      freguesia: '',
      registo: '',
      conservatoria: '',
      requisicao: '',
      apresentacao: '',
      data: '',
      apresentacao_complementar: '',
      outras_observacoes: '',
      estado: 'Provisórios',
    },
  });

  React.useEffect(() => {
    if (registo) {
      form.reset({
        numero_processo: registo.numero_processo,
        cliente_id: registo.cliente_id.toString(),
        predio: registo.predio,
        freguesia: registo.freguesia,
        registo: registo.registo,
        conservatoria: registo.conservatoria,
        requisicao: registo.requisicao,
        apresentacao: registo.apresentacao,
        data: registo.data,
        apresentacao_complementar: registo.apresentacao_complementar || '',
        outras_observacoes: registo.outras_observacoes || '',
        estado: registo.estado,
      });
    } else {
      form.reset({
        numero_processo: '',
        cliente_id: '',
        predio: '',
        freguesia: '',
        registo: '',
        conservatoria: '',
        requisicao: '',
        apresentacao: '',
        data: '',
        apresentacao_complementar: '',
        outras_observacoes: '',
        estado: 'Provisórios',
      });
    }
  }, [registo, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const registoData = {
        numero_processo: data.numero_processo,
        cliente_id: parseInt(data.cliente_id),
        predio: data.predio,
        freguesia: data.freguesia,
        registo: data.registo,
        conservatoria: data.conservatoria,
        requisicao: data.requisicao,
        apresentacao: data.apresentacao,
        data: data.data,
        apresentacao_complementar: data.apresentacao_complementar,
        outras_observacoes: data.outras_observacoes,
        estado: data.estado,
      };

      if (isEditing && registo) {
        await updateRegisto.mutateAsync({
          id: registo.id,
          ...registoData,
        });
      } else {
        await createRegisto.mutateAsync(registoData);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar registo:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Registo Predial' : 'Novo Registo Predial'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite as informações do registo predial.'
              : 'Preencha os dados para criar um novo registo predial.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero_processo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Processo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 2024/001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="predio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prédio</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome/Localização do prédio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="freguesia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Freguesia</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da freguesia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registo</FormLabel>
                    <FormControl>
                      <Input placeholder="Número do registo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conservatoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conservatória</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da conservatória" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requisicao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requerimento</FormLabel>
                    <FormControl>
                      <Input placeholder="Número do requerimento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apresentacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apresentação</FormLabel>
                    <FormControl>
                      <Input placeholder="Detalhes da apresentação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Provisórios">Provisórios</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                        <SelectItem value="Desistência">Desistência</SelectItem>
                        <SelectItem value="Recusado">Recusado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="apresentacao_complementar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apresentação Complementar (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalhes adicionais da apresentação complementar..."
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
              name="outras_observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outras Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createRegisto.isPending || updateRegisto.isPending}
              >
                {isEditing ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};