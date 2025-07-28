import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IndividualClient } from '@/hooks/useClients';

interface IndividualClientFormProps {
  form: UseFormReturn<any>;
  watch: (name: string) => any;
  setValue: (name: string, value: any) => void;
}

export const IndividualClientForm: React.FC<IndividualClientFormProps> = ({
  form,
  watch,
  setValue
}) => {
  const { register, formState: { errors } } = form;

  return (
    <Tabs defaultValue="identification" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="identification">Identificação</TabsTrigger>
        <TabsTrigger value="contact">Contacto</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
        <TabsTrigger value="legal">Dados Jurídicos</TabsTrigger>
      </TabsList>

      <TabsContent value="identification" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  {...register('fullName')}
                  placeholder="Nome completo"
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600">{errors.fullName.message?.toString()}</p>
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
                <Label htmlFor="citizenCardNumber">Cartão de Cidadão</Label>
                <Input
                  id="citizenCardNumber"
                  {...register('citizenCardNumber')}
                  placeholder="00000000 0ZZ0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="citizenCardExpiry">Validade CC</Label>
                <Input
                  id="citizenCardExpiry"
                  type="date"
                  {...register('citizenCardExpiry')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register('birthDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidade</Label>
                <Input
                  id="nationality"
                  {...register('nationality')}
                  placeholder="Portuguesa"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maritalStatus">Estado civil</Label>
                <Select
                  value={watch('maritalStatus')}
                  onValueChange={(value) => setValue('maritalStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Solteiro(a)</SelectItem>
                    <SelectItem value="married">Casado(a)</SelectItem>
                    <SelectItem value="divorced">Divorciado(a)</SelectItem>
                    <SelectItem value="widowed">Viúvo(a)</SelectItem>
                    <SelectItem value="separated">Separado(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profession">Profissão</Label>
                <Input
                  id="profession"
                  {...register('profession')}
                  placeholder="Profissão"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="socialSecurityNumber">N.º Segurança Social</Label>
                <Input
                  id="socialSecurityNumber"
                  {...register('socialSecurityNumber')}
                  placeholder="12345678901"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="healthUserNumber">N.º Utente de Saúde</Label>
                <Input
                  id="healthUserNumber"
                  {...register('healthUserNumber')}
                  placeholder="123456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="civilIdentificationNumber">N.º Identificação Civil</Label>
                <Input
                  id="civilIdentificationNumber"
                  {...register('civilIdentificationNumber')}
                  placeholder="123456789"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="contact" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="email@exemplo.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message?.toString()}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Telemóvel</Label>
                <Input
                  id="mobile"
                  {...register('mobile')}
                  placeholder="+351 123 456 789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="landline">Telefone fixo</Label>
                <Input
                  id="landline"
                  {...register('landline')}
                  placeholder="+351 123 456 789"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Morada</h4>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address.district">Distrito</Label>
                  <Input
                    id="address.district"
                    {...register('address.district')}
                    placeholder="Lisboa"
                  />
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
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documents.citizenCardCopy">Cópia do Cartão de Cidadão</Label>
                <Input
                  id="documents.citizenCardCopy"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  {...register('documents.citizenCardCopy')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documents.addressProof">Comprovativo de morada</Label>
                <Input
                  id="documents.addressProof"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  {...register('documents.addressProof')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documents.bankProof">Comprovativo bancário</Label>
                <Input
                  id="documents.bankProof"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  {...register('documents.bankProof')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documents.digitalSignature">Assinatura digital</Label>
                <Input
                  id="documents.digitalSignature"
                  type="file"
                  accept=".pdf"
                  {...register('documents.digitalSignature')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="legal" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Dados Jurídicos / Processuais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hasLegalRepresentative"
                checked={watch('hasLegalRepresentative')}
                onCheckedChange={(checked) => setValue('hasLegalRepresentative', checked)}
              />
              <Label htmlFor="hasLegalRepresentative">Tem representante legal?</Label>
            </div>

            {watch('hasLegalRepresentative') && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="legalRepresentativeName">Nome do representante</Label>
                  <Input
                    id="legalRepresentativeName"
                    {...register('legalRepresentativeName')}
                    placeholder="Nome do representante legal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="powerOfAttorney">Procuração</Label>
                  <Input
                    id="powerOfAttorney"
                    type="file"
                    accept=".pdf"
                    {...register('powerOfAttorney')}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="legalObservations">Observações legais/processuais</Label>
              <Textarea
                id="legalObservations"
                {...register('legalObservations')}
                placeholder="Observações..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};