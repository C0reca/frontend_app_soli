import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTemplates, Template } from '@/hooks/useTemplates';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const templateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  steps: z.number().min(1, 'Número de etapas deve ser maior que 0'),
  estimatedDuration: z.string().min(1, 'Duração estimada é obrigatória'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: Template | null;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, template }) => {
  const { createTemplate, updateTemplate } = useTemplates();
  
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      steps: 1,
      estimatedDuration: '',
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        description: template.description,
        category: template.category,
        steps: template.steps,
        estimatedDuration: template.estimatedDuration,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        category: '',
        steps: 1,
        estimatedDuration: '',
      });
    }
  }, [template, form]);

  const onSubmit = async (data: TemplateFormData) => {
    try {
      if (template) {
        await updateTemplate.mutateAsync({
          id: template.id,
          ...data,
        } as Template & { id: string });
      } else {
        await createTemplate.mutateAsync(data as Omit<Template, 'id' | 'createdAt' | 'usageCount'>);
      }
      onClose();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{template ? 'Editar Template' : 'Novo Template'}</DialogTitle>
          <DialogDescription>
            {template ? 'Edite os dados do template.' : 'Preencha os dados para criar um novo template.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Template</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do template" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Digite a descrição do template" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Onboarding, Auditoria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="steps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Etapas</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        placeholder="0" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="estimatedDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração Estimada</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 2-3 dias, 1 semana" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createTemplate.isPending || updateTemplate.isPending}>
                {createTemplate.isPending || updateTemplate.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};