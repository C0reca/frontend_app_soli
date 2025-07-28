import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2 } from 'lucide-react';
import { CorporateClient } from '@/hooks/useClients';

interface CorporateClientFormProps {
  form: UseFormReturn<any>;
  watch: (name: string) => any;
  setValue: (name: string, value: any) => void;
}

export const CorporateClientForm: React.FC<CorporateClientFormProps> = ({
  form,
  watch,
  setValue
}) => {
  const { register, formState: { errors } } = form;

  const addLegalRepresentative = () => {
    const current = watch('legalRepresentatives') || [];
    setValue('legalRepresentatives', [
      ...current,
      {
        name: '',
        nif: '',
        email: '',
        mobile: '',
        position: '',
        appointmentDocument: ''
      }
    ]);
  };

  const removeLegalRepresentative = (index: number) => {
    const current = watch('legalRepresentatives') || [];
    setValue('legalRepresentatives', current.filter((_: any, i: number) => i !== index));
  };

  const addBusinessArea = () => {
    const current = watch('businessAreas') || [];
    setValue('businessAreas', [...current, '']);
  };

  const removeBusinessArea = (index: number) => {
    const current = watch('businessAreas') || [];
    setValue('businessAreas', current.filter((_: any, i: number) => i !== index));
  };

  return (
    <Tabs defaultValue="identification" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="identification">Identificação</TabsTrigger>
        <TabsTrigger value="representatives">Representantes</TabsTrigger>
        <TabsTrigger value="contact">Contacto</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
      </TabsList>

      <TabsContent value="identification" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Identificação da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da empresa</Label>
                <Input
                  id="companyName"
                  {...register('companyName')}
                  placeholder="Nome da empresa"
                />
                {errors.companyName && (
                  <p className="text-sm text-red-600">{errors.companyName.message?.toString()}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nif">NIF</Label>
                <Input
                  id="nif"
                  {...register('nif')}
                  placeholder="123456789"
                />
                {errors.nif && (
                  <p className="text-sm text-red-600">{errors.nif.message?.toString()}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commercialRegistrationNumber">N.º Registo Comercial</Label>
                <Input
                  id="commercialRegistrationNumber"
                  {...register('commercialRegistrationNumber')}
                  placeholder="Número de registo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalForm">Forma jurídica</Label>
                <Select
                  value={watch('legalForm')}
                  onValueChange={(value) => setValue('legalForm', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LDA">Sociedade por Quotas (LDA)</SelectItem>
                    <SelectItem value="SA">Sociedade Anónima (SA)</SelectItem>
                    <SelectItem value="SGPS">Sociedade Gestora de Participações Sociais (SGPS)</SelectItem>
                    <SelectItem value="CRL">Cooperativa de Responsabilidade Limitada (CRL)</SelectItem>
                    <SelectItem value="EI">Estabelecimento Individual (EI)</SelectItem>
                    <SelectItem value="other">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="constitutionDate">Data de constituição</Label>
                <Input
                  id="constitutionDate"
                  type="date"
                  {...register('constitutionDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mainCAE">CAE principal</Label>
                <Input
                  id="mainCAE"
                  {...register('mainCAE')}
                  placeholder="12345"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shareCapital">Capital social</Label>
              <Input
                id="shareCapital"
                {...register('shareCapital')}
                placeholder="€ 5.000,00"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="representatives" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Representantes Legais
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLegalRepresentative}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(watch('legalRepresentatives') || []).map((rep: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Representante {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLegalRepresentative(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`legalRepresentatives.${index}.name`}>Nome</Label>
                    <Input
                      {...register(`legalRepresentatives.${index}.name`)}
                      placeholder="Nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`legalRepresentatives.${index}.nif`}>NIF</Label>
                    <Input
                      {...register(`legalRepresentatives.${index}.nif`)}
                      placeholder="123456789"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`legalRepresentatives.${index}.email`}>Email</Label>
                    <Input
                      type="email"
                      {...register(`legalRepresentatives.${index}.email`)}
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`legalRepresentatives.${index}.mobile`}>Telemóvel</Label>
                    <Input
                      {...register(`legalRepresentatives.${index}.mobile`)}
                      placeholder="+351 123 456 789"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`legalRepresentatives.${index}.position`}>Cargo</Label>
                    <Input
                      {...register(`legalRepresentatives.${index}.position`)}
                      placeholder="Gerente, Administrador, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`legalRepresentatives.${index}.appointmentDocument`}>Documento de nomeação</Label>
                    <Input
                      type="file"
                      accept=".pdf"
                      {...register(`legalRepresentatives.${index}.appointmentDocument`)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {(!watch('legalRepresentatives') || watch('legalRepresentatives').length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum representante legal adicionado. Clique em "Adicionar" para começar.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="contact" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Contacto da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email geral</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="geral@empresa.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message?.toString()}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+351 123 456 789"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Morada da Sede</h4>
              <div className="space-y-2">
                <Label htmlFor="address.street">Rua</Label>
                <Input
                  id="address.street"
                  {...register('address.street')}
                  placeholder="Rua, nº, andar"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address.postalCode">Código postal</Label>
                  <Input
                    id="address.postalCode"
                    {...register('address.postalCode')}
                    placeholder="1234-567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address.locality">Localidade</Label>
                  <Input
                    id="address.locality"
                    {...register('address.locality')}
                    placeholder="Lisboa"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.country">País</Label>
                <Input
                  id="address.country"
                  {...register('address.country')}
                  placeholder="Portugal"
                  defaultValue="Portugal"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Áreas de atuação</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBusinessArea}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>

              {(watch('businessAreas') || []).map((area: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    {...register(`businessAreas.${index}`)}
                    placeholder="Ex: Fiscal, Laboral, Registos"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBusinessArea(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Documentos da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documents.permanentCertificate">Certidão permanente</Label>
                <Input
                  id="documents.permanentCertificate"
                  {...register('documents.permanentCertificate')}
                  placeholder="Código da certidão"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documents.iban">IBAN</Label>
                <Input
                  id="documents.iban"
                  {...register('documents.iban')}
                  placeholder="PT50 0000 0000 0000 0000 0000 0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documents.constitutionDeed">Escritura de constituição</Label>
                <Input
                  id="documents.constitutionDeed"
                  type="file"
                  accept=".pdf"
                  {...register('documents.constitutionDeed')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documents.bylaws">Estatutos</Label>
                <Input
                  id="documents.bylaws"
                  type="file"
                  accept=".pdf"
                  {...register('documents.bylaws')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                {...register('observations')}
                placeholder="Observações sobre a empresa..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};