import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Plus, Trash2 } from 'lucide-react';
import { useRegistosPrediais, RegistoPredial, Predio } from '@/hooks/useRegistosPrediais';
import { useClients } from '@/hooks/useClients';
import { ClientCombobox } from '@/components/ui/clientcombobox';
import { Card, CardContent } from '@/components/ui/card';

// Função para formatar automaticamente o código certidão permanente
// Formato: XX-XXXX-XXXXX-XXXXXX-XXXXXX
const formatCodigoCertidao = (value: string): string => {
  // Remove tudo que não é letra ou número
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '');
  
  // Separa letras e números
  const letters = cleaned.match(/[A-Za-z]/g)?.join('').toUpperCase() || '';
  const numbers = cleaned.match(/[0-9]/g)?.join('') || '';
  
  // Limita a 2 letras
  const limitedLetters = letters.slice(0, 2);
  
  // Se não tiver 2 letras, retorna apenas as letras (até 2)
  if (limitedLetters.length < 2) {
    return limitedLetters;
  }
  
  // Limita números a 21 dígitos (4+5+6+6)
  const limitedNumbers = numbers.slice(0, 21);
  
  // Formata: XX-XXXX-XXXXX-XXXXXX-XXXXXX
  let formatted = limitedLetters;
  
  if (limitedNumbers.length > 0) {
    formatted += '-';
    
    // Adiciona números com travessões nos lugares corretos
    const parts: string[] = [];
    
    if (limitedNumbers.length > 0) {
      parts.push(limitedNumbers.slice(0, 4)); // 4 números
    }
    if (limitedNumbers.length > 4) {
      parts.push(limitedNumbers.slice(4, 9)); // 5 números
    }
    if (limitedNumbers.length > 9) {
      parts.push(limitedNumbers.slice(9, 15)); // 6 números
    }
    if (limitedNumbers.length > 15) {
      parts.push(limitedNumbers.slice(15, 21)); // 6 números
    }
    
    formatted += parts.join('-');
  }
  
  return formatted;
};

const predioSchema = z.object({
  predio: z.string().min(1, 'Prédio é obrigatório'),
  freguesia: z.string().optional(),
  codigo_certidao_permanente: z.string()
    .optional()
    .refine(
      (val) => !val || /^[A-Z]{2}-\d{4}-\d{5}-\d{6}-\d{6}$/.test(val),
      { message: 'Formato inválido. Use: XX-XXXX-XXXXX-XXXXXX-XXXXXX (ex: GP-0000-00000-000000-000000)' }
    ),
});

const formSchema = z.object({
  numero_processo: z.string().min(1, 'Número do processo é obrigatório'),
  cliente_id: z.number({ invalid_type_error: 'Cliente é obrigatório' }).min(1, 'Cliente é obrigatório'),
  predios: z.array(predioSchema).min(1, 'Pelo menos um prédio é obrigatório'),
  registo: z.string().min(1, 'Registo é obrigatório'),
  conservatoria: z.string().min(1, 'Conservatória é obrigatória'),
  requisicao: z.string().min(1, 'Facto de Registo é obrigatório'),
  apresentacao: z.string().min(1, 'Apresentação é obrigatória'),
  data: z.string().min(1, 'Data é obrigatória'),
  apresentacao_complementar: z.string().optional(),
  outras_observacoes: z.string().optional(),
  estado: z.enum(['Concluído', 'Desistência', 'Recusado', 'Provisórios', 'Registo']),
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

  const toDateInputValue = (value: any): string => {
    if (!value) return '';
    // if already 'YYYY-MM-DD'
    if (typeof value === 'string') {
      const s = value.slice(0, 10);
      return /\d{4}-\d{2}-\d{2}/.test(s) ? s : '';
    }
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch {
      return '';
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero_processo: '',
      cliente_id: undefined as unknown as number,
        predios: [{ predio: '', freguesia: '', codigo_certidao_permanente: '' }],
      registo: '',
      conservatoria: '',
      requisicao: '',
      apresentacao: '',
      data: '',
      apresentacao_complementar: '',
      outras_observacoes: '',
      estado: 'Provisórios',
      codigo_certidao_permanente: '',
    },
  });

  const { fields: predioFields, append: appendPredio, remove: removePredio } = useFieldArray({
    control: form.control,
    name: 'predios',
  });

  React.useEffect(() => {
    if (registo) {
      // Se tiver prédios na lista, usar; senão, usar o campo antigo para compatibilidade
      const predios = registo.predios && registo.predios.length > 0
        ? registo.predios.map(p => ({ predio: p.predio || '', freguesia: p.freguesia || '', codigo_certidao_permanente: p.codigo_certidao_permanente || '' }))
        : [{ predio: registo.predio || '', freguesia: registo.freguesia || '', codigo_certidao_permanente: '' }];
      
      form.reset({
        numero_processo: registo.numero_processo || '',
        cliente_id: registo.cliente_id != null ? Number(registo.cliente_id) : (undefined as unknown as number),
        predios: predios.length > 0 ? predios : [{ predio: '', freguesia: '', codigo_certidao_permanente: '' }],
        registo: registo.registo || '',
        conservatoria: registo.conservatoria || '',
        requisicao: registo.requisicao || '',
        apresentacao: registo.apresentacao || '',
        data: toDateInputValue(registo.data),
        apresentacao_complementar: registo.apresentacao_complementar || '',
        outras_observacoes: registo.outras_observacoes || '',
        estado: registo.estado || 'Provisórios',
      });
    } else {
      form.reset({
        numero_processo: '',
        cliente_id: undefined as unknown as number,
        predios: [{ predio: '', freguesia: '', codigo_certidao_permanente: '' }],
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
        cliente_id: data.cliente_id,
        predios: data.predios.map(p => ({
          predio: p.predio,
          freguesia: p.freguesia || undefined,
          codigo_certidao_permanente: p.codigo_certidao_permanente || undefined,
        })),
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
                    <FormLabel>Número do Processo *</FormLabel>
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
                    <FormLabel>Cliente *</FormLabel>
                    <ClientCombobox
                      clients={clients}
                      value={field.value}
                      onChange={field.onChange}
                      isLoading={false}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base font-semibold">Prédios *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendPredio({ predio: '', freguesia: '', codigo_certidao_permanente: '' })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Prédio
                </Button>
              </div>
              
              {predioFields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <CardContent className="p-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`predios.${index}.predio`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prédio *</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome/Localização do prédio" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`predios.${index}.freguesia`}
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

                      <FormField
                        control={form.control}
                        name={`predios.${index}.codigo_certidao_permanente`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código Certidão Permanente</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="GP-0000-00000-000000-000000" 
                                {...field}
                                onChange={(e) => {
                                  // Formatar automaticamente com letras, travessões e números
                                  const formatted = formatCodigoCertidao(e.target.value);
                                  field.onChange(formatted);
                                }}
                                maxLength={28} // XX-XXXX-XXXXX-XXXXXX-XXXXXX = 28 caracteres
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                      {predioFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePredio(index)}
                          className="mt-8"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registo *</FormLabel>
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
                    <FormLabel>Conservatória *</FormLabel>
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
                    <FormLabel>Facto de Registo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Número do facto de registo" {...field} />
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
                    <FormLabel>Apresentação *</FormLabel>
                    <FormControl>
                      <Input placeholder="Detalhes da apresentação" {...field} />
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

            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Provisórios">Provisórios</SelectItem>
                      <SelectItem value="Registo">Registo</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                      <SelectItem value="Desistência">Desistência</SelectItem>
                      <SelectItem value="Recusado">Recusado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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