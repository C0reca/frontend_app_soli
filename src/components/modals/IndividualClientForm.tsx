import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="identification">Identificação</TabsTrigger>
        <TabsTrigger value="contact">Contacto</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
      </TabsList>

      <TabsContent value="identification" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  {...register('nome')}
                  placeholder="Nome completo"
                />
                {errors.nome && (
                  <p className="text-sm text-red-600">{errors.nome.message?.toString()}</p>
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
                <Label htmlFor="num_cc">Cartão de Cidadão</Label>
                <Input
                  id="num_cc"
                  {...register('num_cc')}
                  placeholder="00000000 0ZZ0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validade_cc">Validade CC</Label>
                <Input
                  id="validade_cc"
                  type="date"
                  {...register('validade_cc')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de nascimento</Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  {...register('data_nascimento')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nacionalidade">Nacionalidade</Label>
                <Input
                  id="nacionalidade"
                  {...register('nacionalidade')}
                  placeholder="Portuguesa"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado_civil">Estado civil</Label>
                <Select
                  value={watch('estado_civil')}
                  onValueChange={(value) => setValue('estado_civil', value)}
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
                <Label htmlFor="profissao">Profissão</Label>
                <Input
                  id="profissao"
                  {...register('profissao')}
                  placeholder="Profissão"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="num_ss">N.º Segurança Social</Label>
                <Input
                  id="num_ss"
                  {...register('num_ss')}
                  placeholder="12345678901"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="num_sns">N.º Utente de Saúde</Label>
                <Input
                  id="num_sns"
                  {...register('num_sns')}
                  placeholder="123456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="num_ident_civil">N.º Identificação Civil</Label>
                <Input
                  id="num_ident_civil"
                  {...register('num_ident_civil')}
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
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  {...register('telefone')}
                  placeholder="+351 123 456 789"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Morada</h4>
              <div className="space-y-2">
                <Label htmlFor="morada">Rua</Label>
                <Input
                  id="morada"
                  {...register('morada')}
                  placeholder="Rua, nº, andar"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo_postal">Código postal</Label>
                  <Input
                    id="codigo_postal"
                    {...register('codigo_postal')}
                    placeholder="1234-567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localidade">Localidade</Label>
                  <Input
                    id="localidade"
                    {...register('localidade')}
                    placeholder="Lisboa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="distrito">Distrito</Label>
                  <Input
                    id="distrito"
                    {...register('distrito')}
                    placeholder="Lisboa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    {...register('pais')}
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
            <CardTitle>Documentos e Outros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                {...register('iban')}
                placeholder="PT50 0000 0000 0000 0000 0000 0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                {...register('observacoes')}
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