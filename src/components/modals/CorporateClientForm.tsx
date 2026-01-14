import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
            <CardTitle>Identificação da Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome_empresa">Nome da empresa *</Label>
                <Input
                  id="nome_empresa"
                  {...register('nome_empresa')}
                  placeholder="Nome da empresa"
                />
                {errors.nome_empresa && (
                  <p className="text-sm text-red-600">{errors.nome_empresa.message?.toString()}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nif_empresa">NIF *</Label>
                <Input
                  id="nif_empresa"
                  {...register('nif_empresa')}
                  placeholder="123456789"
                />
                {errors.nif_empresa && (
                  <p className="text-sm text-red-600">{errors.nif_empresa.message?.toString()}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registo_comercial">N.º Registo Comercial</Label>
                <Input
                  id="registo_comercial"
                  {...register('registo_comercial')}
                  placeholder="Número de registo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="forma_juridica">Forma jurídica</Label>
                <Select
                  value={watch('forma_juridica')}
                  onValueChange={(value) => setValue('forma_juridica', value)}
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
                <Label htmlFor="data_constituicao">Data de constituição</Label>
                <Input
                  id="data_constituicao"
                  type="date"
                  {...register('data_constituicao')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cae">CAE principal</Label>
                <Input
                  id="cae"
                  {...register('cae')}
                  placeholder="12345"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capital_social">Capital social</Label>
              <Input
                id="capital_social"
                {...register('capital_social')}
                placeholder="€ 5.000,00"
              />
            </div>

            {/* Representante Legal */}
              <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold">Representante Legal</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="representante_nome">Nome *</Label>
                  <Input
                    id="representante_nome"
                    {...register('representante_nome')}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="representante_nif">NIF *</Label>
                  <Input
                    id="representante_nif"
                    {...register('representante_nif')}
                    placeholder="123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="representante_email">Email *</Label>
                  <Input
                    type="email"
                    id="representante_email"
                    {...register('representante_email')}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="representante_telemovel">Telemóvel</Label>
                  <Input
                    id="representante_telemovel"
                    {...register('representante_telemovel')}
                    placeholder="+351 123 456 789"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="representante_cargo">Cargo</Label>
                <Input
                  id="representante_cargo"
                  {...register('representante_cargo')}
                  placeholder="Gerente, Administrador, etc."
                />
              </div>
            </div>
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
                <Label htmlFor="email">Email geral *</Label>
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
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  {...register('telefone')}
                  placeholder="+351 123 456 789"
                />
                {errors.telefone && (
                  <p className="text-sm text-red-600">{errors.telefone.message?.toString()}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Morada da Sede</h4>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="certidao_permanente">Certidão permanente</Label>
                <Input
                  id="certidao_permanente"
                  {...register('certidao_permanente')}
                  placeholder="Código da certidão"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  {...register('iban')}
                  placeholder="PT50 0000 0000 0000 0000 0000 0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incapacidade">Incapacidade (%)</Label>
              <Input
                id="incapacidade"
                type="number"
                min="0"
                max="100"
                {...register('incapacidade', {
                  valueAsNumber: true,
                  validate: (value) => {
                    if (value === undefined || value === null || value === '') return true;
                    const num = Number(value);
                    return (num >= 0 && num <= 100) || 'Incapacidade deve estar entre 0 e 100%';
                  }
                })}
                placeholder="0-100"
              />
              {errors.incapacidade && (
                <p className="text-sm text-red-500">{errors.incapacidade.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                {...register('observacoes')}
                placeholder="Observações sobre a empresa..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senha_financas">Senha Finanças</Label>
                <Input
                  id="senha_financas"
                  type="password"
                  {...register('senha_financas')}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha_ss">Senha Segurança Social</Label>
                <Input
                  id="senha_ss"
                  type="password"
                  {...register('senha_ss')}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};