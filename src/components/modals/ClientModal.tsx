import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Building, Loader2 } from 'lucide-react';
import { useClients, Client, IndividualClient, CorporateClient } from '@/hooks/useClients';
import { IndividualClientForm } from './IndividualClientForm';
import { CorporateClientForm } from './CorporateClientForm';
import { useToast } from '@/hooks/use-toast';

// Schema base para campos comuns
const baseClientSchema = z.object({
  internalNumber: z.string().min(1, 'Número interno é obrigatório'),
  responsibleEmployee: z.string().min(1, 'Funcionário responsável é obrigatório'),
  status: z.enum(['active', 'inactive']),
  internalNotes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Schema para pessoa singular
const individualClientSchema = baseClientSchema.extend({
  tipo: z.literal('individual'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  nif: z.string().min(9, 'NIF deve ter 9 dígitos'),
  email: z.string().email('Email inválido'),
  mobile: z.string().min(9, 'Telemóvel deve ter pelo menos 9 dígitos'),
  citizenCardNumber: z.string().optional(),
  citizenCardExpiry: z.string().optional(),
  birthDate: z.string().optional(),
  nationality: z.string().optional(),
  maritalStatus: z.string().optional(),
  profession: z.string().optional(),
  socialSecurityNumber: z.string().optional(),
  healthUserNumber: z.string().optional(),
  civilIdentificationNumber: z.string().optional(),
  landline: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    postalCode: z.string().optional(),
    locality: z.string().optional(),
    district: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  documents: z.object({
    citizenCardCopy: z.string().optional(),
    addressProof: z.string().optional(),
    bankProof: z.string().optional(),
    digitalSignature: z.string().optional(),
    otherDocuments: z.array(z.string()).optional(),
  }).optional(),
  hasLegalRepresentative: z.boolean().optional(),
  legalRepresentativeName: z.string().optional(),
  powerOfAttorney: z.string().optional(),
  legalObservations: z.string().optional(),
});

// Schema para pessoa coletiva
const corporateClientSchema = baseClientSchema.extend({
  tipo: z.literal('corporate'),
  companyName: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  nif: z.string().min(9, 'NIF deve ter 9 dígitos'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(9, 'Telefone deve ter pelo menos 9 dígitos'),
  commercialRegistrationNumber: z.string().optional(),
  legalForm: z.string().optional(),
  constitutionDate: z.string().optional(),
  mainCAE: z.string().optional(),
  shareCapital: z.string().optional(),
  legalRepresentatives: z.array(z.object({
    name: z.string(),
    nif: z.string(),
    email: z.string(),
    mobile: z.string(),
    position: z.string(),
    appointmentDocument: z.string().optional(),
  })).optional(),
  address: z.object({
    street: z.string().optional(),
    postalCode: z.string().optional(),
    locality: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  documents: z.object({
    permanentCertificate: z.string().optional(),
    iban: z.string().optional(),
    constitutionDeed: z.string().optional(),
    bylaws: z.string().optional(),
    otherDocuments: z.array(z.string()).optional(),
  }).optional(),
  businessAreas: z.array(z.string()).optional(),
  observations: z.string().optional(),
});

type ClientFormData = z.infer<typeof individualClientSchema> | z.infer<typeof corporateClientSchema>;

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  client,
}) => {
  const { createClient, updateClient } = useClients();
  const { toast } = useToast();
  const isEditing = !!client;
  const [tipo, settipo] = useState<'individual' | 'corporate'>(
    client?.tipo || 'individual'
  );

  const getSchema = () => {
    return tipo === 'individual' ? individualClientSchema : corporateClientSchema;
  };

  const getDefaultValues = () => {
    if (client) return client;
    
    const baseDefaults = {
      internalNumber: '',
      responsibleEmployee: '',
      status: 'active' as const,
      internalNotes: '',
      tags: [],
    };

    if (tipo === 'individual') {
      return {
        ...baseDefaults,
        tipo: 'individual' as const,
        nome: '',
        nif: '',
        email: '',
        mobile: '',
        address: {
          street: '',
          postalCode: '',
          locality: '',
          district: '',
          country: 'Portugal',
        },
        documents: {},
        hasLegalRepresentative: false,
      };
    } else {
      return {
        ...baseDefaults,
        tipo: 'corporate' as const,
        companyName: '',
        nif: '',
        email: '',
        phone: '',
        legalRepresentatives: [],
        address: {
          street: '',
          postalCode: '',
          locality: '',
          country: 'Portugal',
        },
        documents: {},
        businessAreas: [],
      };
    }
  };

  const form = useForm<any>({
    defaultValues: getDefaultValues(),
  });

  const { handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = form;

  React.useEffect(() => {
    reset(getDefaultValues());
  }, [tipo, client]);

  const onSubmit = async (data: any) => {
    try {
      if (isEditing && client) {
        await updateClient.mutateAsync({ id: client.id, ...data } as any);
        toast({
          title: "Cliente atualizado",
          description: "As informações do cliente foram atualizadas com sucesso.",
        });
      } else {
        await createClient.mutateAsync(data as Omit<Client, 'id' | 'createdAt'>);
        toast({
          title: "Cliente criado",
          description: "O novo cliente foi criado com sucesso.",
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o cliente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Altere as informações do cliente'
              : 'Preencha os dados do novo cliente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {!isEditing && (
            <Card>
              <CardHeader>
                <CardTitle>Tipo de Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={tipo}
                  onValueChange={(value) => settipo(value as 'individual' | 'corporate')}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="individual" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Pessoa Singular
                    </TabsTrigger>
                    <TabsTrigger value="corporate" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Pessoa Coletiva
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Dados Internos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="internalNumber">Nº Cliente Interno</Label>
                  <Input
                    id="internalNumber"
                    {...form.register('internalNumber')}
                    placeholder="CLI-001"
                  />
                  {errors.internalNumber && (
                    <p className="text-sm text-red-600">{errors.internalNumber.message?.toString()}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsibleEmployee">Funcionário Responsável</Label>
                  <Select
                    value={watch('responsibleEmployee')}
                    onValueChange={(value) => setValue('responsibleEmployee', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emp1">João Silva</SelectItem>
                      <SelectItem value="emp2">Maria Santos</SelectItem>
                      <SelectItem value="emp3">Pedro Oliveira</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.responsibleEmployee && (
                    <p className="text-sm text-red-600">{errors.responsibleEmployee.message?.toString()}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={watch('status')}
                    onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Digite tags separadas por vírgula (ex: fiscal, heranças)"
                  value={watch('tags')?.join(', ') || ''}
                  onChange={(e) => {
                    const tagsArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
                    setValue('tags', tagsArray);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Separe as tags por vírgulas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="internalNotes">Notas Internas</Label>
                <Input
                  id="internalNotes"
                  {...form.register('internalNotes')}
                  placeholder="Observações internas sobre o cliente"
                />
              </div>
            </CardContent>
          </Card>

          {tipo === 'individual' ? (
            <IndividualClientForm form={form} watch={watch} setValue={setValue} />
          ) : (
            <CorporateClientForm form={form} watch={watch} setValue={setValue} />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};