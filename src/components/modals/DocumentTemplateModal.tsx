import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useDocumentTemplates, DocumentTemplate } from '@/hooks/useDocumentTemplates';

interface DocumentTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: DocumentTemplate | null;
}

export const DocumentTemplateModal: React.FC<DocumentTemplateModalProps> = ({
  isOpen,
  onClose,
  template
}) => {
  const { createTemplate, updateTemplate } = useDocumentTemplates();
  const { register, handleSubmit, setValue, watch, reset } = useForm();

  React.useEffect(() => {
    if (template) {
      setValue('name', template.name);
      setValue('description', template.description);
      setValue('category', template.category);
      setValue('format', template.format);
      setValue('variables', template.variables.join(', '));
    } else {
      reset();
    }
  }, [template, setValue, reset]);

  const onSubmit = (data: any) => {
    const templateData = {
      ...data,
      variables: data.variables.split(',').map((v: string) => v.trim()).filter((v: string) => v),
      size: '0 KB', // Mock size
      filePath: `/templates/${data.name.toLowerCase().replace(/\s+/g, '-')}.docx`
    };

    if (template) {
      updateTemplate.mutate({ id: template.id, ...templateData });
    } else {
      createTemplate.mutate(templateData);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar Template' : 'Novo Template de Documento'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Template</Label>
            <Input
              id="name"
              {...register('name', { required: true })}
              placeholder="Ex: Contrato de Prestação de Serviços"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descreva o propósito deste template..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select onValueChange={(value) => setValue('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Contrato">Contrato</SelectItem>
                <SelectItem value="Relatório">Relatório</SelectItem>
                <SelectItem value="Proposta">Proposta</SelectItem>
                <SelectItem value="Fatura">Fatura</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="format">Formato</Label>
            <Select onValueChange={(value) => setValue('format', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DOCX">DOCX</SelectItem>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="HTML">HTML</SelectItem>
                <SelectItem value="TXT">TXT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="variables">Variáveis (separadas por vírgula)</Label>
            <Input
              id="variables"
              {...register('variables')}
              placeholder="Ex: nomeCliente, dataInicio, valor"
            />
            <p className="text-xs text-gray-500 mt-1">
              Estas variáveis poderão ser substituídas ao gerar documentos
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {template ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};