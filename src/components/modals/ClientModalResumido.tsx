import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building, Loader2, FileText } from 'lucide-react';
import { useClients, Client } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';

const resumidoSingularSchema = z.object({
  tipo: z.literal('singular'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  nif: z.string().min(1, 'NIF é obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(1, 'Telemóvel é obrigatório'),
  nome_empresa: z.string().optional(),
  nif_empresa: z.string().optional(),
});

const resumidoColetivoSchema = z.object({
  tipo: z.literal('coletivo'),
  nome_empresa: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  nif_empresa: z.string().min(1, 'NIF é obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  nome: z.string().optional(),
  nif: z.string().optional(),
});

interface ClientModalResumidoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (client: Client) => void;
  onOpenFullForm?: () => void;
}

export const ClientModalResumido: React.FC<ClientModalResumidoProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenFullForm,
}) => {
  const { createClient } = useClients();
  const { toast } = useToast();
  const [tipo, setTipo] = useState<'singular' | 'coletivo'>('singular');

  const schema = tipo === 'singular' ? resumidoSingularSchema : resumidoColetivoSchema;

  const form = useForm<Record<string, string>>({
    defaultValues: {
      tipo: 'singular',
      nome: '',
      nif: '',
      nome_empresa: '',
      nif_empresa: '',
      email: '',
      telefone: '',
    },
  });

  const { handleSubmit, register, setError, clearErrors, formState: { errors, isSubmitting } } = form;

  React.useEffect(() => {
    clearErrors();
  }, [tipo]);

  React.useEffect(() => {
    if (isOpen) {
      setTipo('singular');
      form.reset({
        tipo: 'singular',
        nome: '',
        nif: '',
        nome_empresa: '',
        nif_empresa: '',
        email: '',
        telefone: '',
      });
    }
  }, [isOpen]);

  const onSubmit = async (data: Record<string, string>) => {
    const parsed = schema.safeParse({
      tipo,
      nome: data.nome,
      nif: data.nif,
      nome_empresa: data.nome_empresa,
      nif_empresa: data.nif_empresa,
      email: data.email,
      telefone: data.telefone,
    });
    if (!parsed.success) {
      const errs = parsed.error.flatten().fieldErrors;
      Object.entries(errs).forEach(([field, messages]) => {
        setError(field as 'nome' | 'nif' | 'nome_empresa' | 'nif_empresa' | 'email' | 'telefone', {
          message: Array.isArray(messages) ? messages[0] : messages,
        });
      });
      return;
    }
    try {
      const d = parsed.data;
      const payload: Record<string, unknown> = {
        tipo: d.tipo,
        email: d.email || null,
        telefone: d.telefone || null,
      };
      if (d.tipo === 'singular') {
        payload.nome = d.nome;
        payload.nif = d.nif;
      } else {
        payload.nome_empresa = d.nome_empresa;
        payload.nif_empresa = d.nif_empresa;
      }
      const created = await createClient.mutateAsync(payload as Omit<Client, 'id' | 'createdAt'>);
      toast({
        title: 'Cliente criado',
        description: 'O novo cliente foi criado com sucesso.',
      });
      onSuccess?.(created as Client);
      onClose();
      form.reset();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string | unknown[] } }; message?: string };
      const detail = err?.response?.data?.detail;
      let errorMessage: string;
      if (Array.isArray(detail)) {
        errorMessage = detail.map((e: { msg?: string }) => e?.msg || '').join(' | ');
      } else if (typeof detail === 'string') {
        errorMessage = detail;
      } else {
        errorMessage = err?.message || 'Ocorreu um erro ao criar o cliente.';
      }
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleSwitchToFull = () => {
    onOpenFullForm?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Cliente (Formulário Rápido)</DialogTitle>
          <DialogDescription>
            Preencha os dados principais. Pode abrir o formulário completo para mais opções.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs
            value={tipo}
            onValueChange={(v) => {
              setTipo(v as 'singular' | 'coletivo');
              form.reset(v === 'singular'
                ? { tipo: 'singular', nome: '', nif: '', nome_empresa: '', nif_empresa: '', email: '', telefone: '' }
                : { tipo: 'coletivo', nome: '', nif: '', nome_empresa: '', nif_empresa: '', email: '', telefone: '' });
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="singular" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Pessoa Singular
              </TabsTrigger>
              <TabsTrigger value="coletivo" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Pessoa Coletiva
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {tipo === 'singular' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo *</Label>
                <Input id="nome" {...register('nome')} placeholder="Nome completo" style={{ textTransform: 'uppercase' }} onChange={(e) => { e.target.value = e.target.value.toUpperCase(); register('nome').onChange(e); }} />
                {errors.nome && (
                  <p className="text-sm text-red-600">{errors.nome.message?.toString()}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nif">NIF *</Label>
                <Input id="nif" {...register('nif')} placeholder="123456789" />
                {errors.nif && (
                  <p className="text-sm text-red-600">{errors.nif.message?.toString()}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome_empresa">Nome da empresa *</Label>
                <Input id="nome_empresa" {...register('nome_empresa')} placeholder="Nome da empresa" style={{ textTransform: 'uppercase' }} onChange={(e) => { e.target.value = e.target.value.toUpperCase(); register('nome_empresa').onChange(e); }} />
                {errors.nome_empresa && (
                  <p className="text-sm text-red-600">{errors.nome_empresa.message?.toString()}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nif_empresa">NIF *</Label>
                <Input id="nif_empresa" {...register('nif_empresa')} placeholder="123456789" />
                {errors.nif_empresa && (
                  <p className="text-sm text-red-600">{errors.nif_empresa.message?.toString()}</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" {...register('email')} placeholder="email@exemplo.pt" />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message?.toString()}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telemóvel / Telefone *</Label>
            <Input id="telefone" {...register('telefone')} placeholder="912345678" />
            {errors.telefone && (
              <p className="text-sm text-red-600">{errors.telefone.message?.toString()}</p>
            )}
          </div>

          {onOpenFullForm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={handleSwitchToFull}
            >
              <FileText className="h-4 w-4 mr-2" />
              Preencher formulário completo
            </Button>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
