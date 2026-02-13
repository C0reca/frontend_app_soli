import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '@/services/api';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Minimize2 } from 'lucide-react';
import { useMinimize } from '@/contexts/MinimizeContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Building, Loader2 } from 'lucide-react';
import { useClients, Client, IndividualClient, CorporateClient } from '@/hooks/useClients';
import { IndividualClientForm } from './IndividualClientForm';
import { CorporateClientForm } from './CorporateClientForm';
import { useToast } from '@/hooks/use-toast';

// Schema base para campos comuns
const baseClientSchema = z.object({
  internalNumber: z.string().optional(),
  // Campo removido: responsável não se aplica a clientes
  status: z.enum(['active', 'inactive']).optional(),
  internalNotes: z.string().optional(),
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
  initialData?: any;
  onSuccess?: (client: Client) => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  client,
  initialData,
  onSuccess,
}) => {
  const { minimize } = useMinimize();
  const { createClient, updateClient } = useClients();
  const { toast } = useToast();
  const isEditing = !!client;
  const [contactosLocais, setContactosLocais] = useState<Array<{ tipo: 'telefone' | 'email'; valor: string; descricao?: string; principal: boolean }>>([]);
  const [tipo, setTipo] = useState<'singular' | 'coletivo'>(
    // Se tipo for null/undefined ou não for válido, assume como singular
    client?.tipo === 'coletivo' ? 'coletivo' : 'singular'
  );

  const getSchema = () => {
    return tipo === 'singular' ? individualClientSchema : corporateClientSchema;
  };

  const getDefaultValues = () => {
    if (initialData) {
      return initialData;
    }
    const effectiveClientTipo = client?.tipo === 'coletivo' ? 'coletivo' : 'singular';
    const commonFromClient = client ? {
      email: client.email ?? '',
      telefone: client.telefone ?? '',
      morada: client.morada ?? '',
      codigo_postal: client.codigo_postal ?? '',
      localidade: client.localidade ?? '',
      distrito: client.distrito ?? '',
      pais: client.pais ?? 'Portugal',
      iban: client.iban ?? '',
      observacoes: client.observacoes ?? '',
      status: (client.status || 'active') as 'active' | 'inactive',
      internalNotes: (client as any).internalNotes ?? '',
    } : {};

    if (client) {
      // Edição: ao mudar de tipo, preservar dados mapeando campos
      if (tipo === 'singular') {
        return {
          ...client,
          ...commonFromClient,
          tipo: 'singular' as const,
          // Se estava coletivo → trazer nome da empresa e NIF para nome/NIF da pessoa
          nome: effectiveClientTipo === 'coletivo' ? (client.nome_empresa ?? client.nome ?? '') : (client.nome ?? ''),
          nif: effectiveClientTipo === 'coletivo' ? (client.nif_empresa ?? client.nif ?? '') : (client.nif ?? ''),
          data_nascimento: client.data_nascimento ?? '',
          estado_civil: client.estado_civil ?? '',
          profissao: client.profissao ?? '',
          num_cc: (client as any).num_cc ?? '',
          validade_cc: client.validade_cc ?? '',
          num_ss: (client as any).num_ss ?? '',
          num_sns: (client as any).num_sns ?? '',
          num_ident_civil: (client as any).num_ident_civil ?? '',
          nacionalidade: (client as any).nacionalidade ?? '',
        };
      } else {
        return {
          ...client,
          ...commonFromClient,
          tipo: 'coletivo' as const,
          // Se estava singular → copiar nome/NIF para empresa e usar nome como representante
          nome_empresa: effectiveClientTipo === 'singular' ? (client.nome ?? (client as any).nome_empresa ?? '') : ((client as any).nome_empresa ?? ''),
          nif_empresa: effectiveClientTipo === 'singular' ? (client.nif ?? (client as any).nif_empresa ?? '') : ((client as any).nif_empresa ?? ''),
          representante_nome: effectiveClientTipo === 'singular' ? (client.nome ?? client.representante_nome ?? '') : (client.representante_nome ?? ''),
          representante_nif: effectiveClientTipo === 'singular' ? (client.nif ?? client.representante_nif ?? '') : (client.representante_nif ?? ''),
          representante_email: effectiveClientTipo === 'singular' ? (client.email ?? client.representante_email ?? '') : (client.representante_email ?? ''),
          representante_telemovel: effectiveClientTipo === 'singular' ? (client.telefone ?? client.representante_telemovel ?? '') : (client.representante_telemovel ?? ''),
          representante_cargo: client.representante_cargo ?? '',
          forma_juridica: (client as any).forma_juridica ?? '',
          data_constituicao: (client as any).data_constituicao ?? '',
          registo_comercial: (client as any).registo_comercial ?? '',
          cae: (client as any).cae ?? '',
          capital_social: (client as any).capital_social ?? '',
          certidao_permanente: (client as any).certidao_permanente ?? '',
        };
      }
    }

    const baseDefaults = {
      status: 'active' as const,
      internalNotes: '',
    };

    if (tipo === 'singular') {
      return {
        ...baseDefaults,
        tipo: 'singular' as const,
        nome: '',
        email: '',
        telefone: '',
        morada: '',
        codigo_postal: '',
        localidade: '',
        distrito: '',
        pais: 'Portugal',
        nif: '',
        data_nascimento: '',
        estado_civil: '',
        profissao: '',
        num_cc: '',
        validade_cc: '',
        num_ss: '',
        num_sns: '',
        num_ident_civil: '',
        nacionalidade: '',
        iban: '',
        observacoes: '',
      };
    } else {
      return {
        ...baseDefaults,
        tipo: 'coletivo' as const,
        nome_empresa: '',
        email: '',
        telefone: '',
        morada: '',
        codigo_postal: '',
        localidade: '',
        distrito: '',
        pais: 'Portugal',
        nif_empresa: '',
        forma_juridica: '',
        data_constituicao: '',
        registo_comercial: '',
        cae: '',
        capital_social: '',
        representante_nome: '',
        representante_nif: '',
        representante_email: '',
        representante_telemovel: '',
        representante_cargo: '',
        iban: '',
        certidao_permanente: '',
        observacoes: '',
      };
    }
  };

  const form = useForm<any>({
    defaultValues: getDefaultValues(),
  });

  const { handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = form;

  React.useEffect(() => {
    reset(getDefaultValues());
  }, [tipo, client, initialData]);

  const normalizeData = (data: any): any => {
    const normalized: any = {};
    const dateFields = ['data_nascimento', 'validade_cc', 'data_constituicao'];
    const emailFields = ['email', 'representante_email'];

    Object.keys(data).forEach(key => {
      const value = data[key];
      if (dateFields.includes(key)) {
        if (value === '' || value === null || value === undefined) return;
        normalized[key] = value;
      } else if (key === 'incapacidade') {
        normalized[key] = value === '' || value === null || value === undefined || value === 0 ? null : Number(value);
      } else if (emailFields.includes(key)) {
        if (value === '' || value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
          normalized[key] = null;
        } else {
          normalized[key] = value;
        }
      } else {
        normalized[key] = value;
      }
    });
    return normalized;
  };

  const onSubmit = async (data: any) => {
    try {
      const normalizedData = normalizeData(data);
      
      if (isEditing && client) {
        const updated = await updateClient.mutateAsync({ id: client.id, ...normalizedData } as any);
        toast({
          title: "Cliente atualizado",
          description: "As informações do cliente foram atualizadas com sucesso.",
        });
        onSuccess?.(updated as Client);
      } else {
        const created = await createClient.mutateAsync(normalizedData as Omit<Client, 'id' | 'createdAt'>);
        
        // Criar contactos se houver contactos locais
        if (contactosLocais.length > 0 && created.id) {
          try {
            for (const contacto of contactosLocais) {
              await api.post(`/clientes/${created.id}/contactos`, {
                ...contacto,
                cliente_id: created.id,
              });
            }
          } catch (contactoError: any) {
            console.error('Erro ao criar contactos:', contactoError);
            // Não falhar a criação do cliente se os contactos falharem
          }
        }
        
        toast({
          title: "Cliente criado",
          description: "O novo cliente foi criado com sucesso.",
        });
        onSuccess?.(created as Client);
      }
      setContactosLocais([]); // Limpar contactos locais
      onClose();
    } catch (error: any) {
      console.error('Error saving client:', error);

      // Extrair mensagem legível mesmo quando o backend devolve um array de erros (422)
      const detail = error?.response?.data?.detail;
      let errorMessage: string;

      if (Array.isArray(detail)) {
        // FastAPI 422: lista de erros de validação
        const messages = detail.map((e: any) => {
          if (e?.msg && e?.loc) {
            const fieldPath = Array.isArray(e.loc) ? e.loc.join('.') : String(e.loc);
            return `${fieldPath}: ${e.msg}`;
          }
          return e?.msg || JSON.stringify(e);
        });
        errorMessage = messages.join(' | ');
      } else if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (typeof error?.response?.data?.message === 'string') {
        errorMessage = error.response.data.message;
      } else if (typeof error?.message === 'string') {
        errorMessage = error.message;
      } else {
        errorMessage = "Ocorreu um erro ao salvar o cliente. Tente novamente.";
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Altere as informações do cliente'
                  : 'Preencha os dados do novo cliente'}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-12 top-4"
              onClick={() => {
                const data = form.getValues();
                minimize({ type: 'client', title: isEditing ? `Editar: ${client?.nome || (client as any)?.nome_empresa || 'Cliente'}` : 'Novo Cliente', payload: { data, client } });
                onClose();
              }}
              aria-label={'Minimizar'}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Cliente</CardTitle>
              {isEditing && (
                <CardDescription>
                  Pode alterar o tipo e converter os dados sem perder informação.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <Tabs
                value={tipo}
                onValueChange={(value) => setTipo(value as 'singular' | 'coletivo')}
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
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setTipo(tipo === 'singular' ? 'coletivo' : 'singular')}
                >
                  {tipo === 'singular' ? (
                    <>
                      <Building className="h-4 w-4 mr-2" />
                      Converter para Pessoa Coletiva (Empresa)
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 mr-2" />
                      Converter para Pessoa Singular (Particular)
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados Internos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {isEditing && (
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
                )}

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
                <Label htmlFor="internalNotes">Notas Internas</Label>
                <Input
                  id="internalNotes"
                  {...form.register('internalNotes')}
                  placeholder="Observações internas sobre o cliente"
                />
              </div>
            </CardContent>
          </Card>

          {tipo === 'singular' ? (
            <IndividualClientForm 
              form={form} 
              watch={watch} 
              setValue={setValue} 
              clienteId={isEditing && client ? client.id : undefined}
              contactosLocais={contactosLocais}
              onContactosChange={setContactosLocais}
            />
          ) : (
            <CorporateClientForm 
              form={form} 
              watch={watch} 
              setValue={setValue} 
              clienteId={isEditing && client ? client.id : undefined}
              contactosLocais={contactosLocais}
              onContactosChange={setContactosLocais}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Estado do Arquivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <AlertDescription>
                  {client?.tem_dossies
                    ? 'Esta entidade já possui um arquivo associado e não é possível remover essa associação.'
                    : 'Esta entidade ainda não tem arquivo. Para criar um, utilize a página "Arquivos".'}
                </AlertDescription>
              </Alert>
              {!client?.tem_dossies && (
                <p className="text-sm text-muted-foreground">
                  A criação de arquivos é feita exclusivamente na página Arquivos. Depois de criado, o estado fica permanente.
                </p>
              )}
            </CardContent>
          </Card>

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