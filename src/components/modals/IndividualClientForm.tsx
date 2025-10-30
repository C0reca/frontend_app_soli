import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Scan } from 'lucide-react';
import { IndividualClient } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const handleCitizenCardScan = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const response = await fetch('http://127.0.0.1:8081/cc', { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) {
        let msg = "Erro ao obter dados do Cartão de Cidadão.";
        try {
          const body = await response.json();
          if (body?.error) msg = body.error;
        } catch (_) {}
        throw new Error(msg);
      }

      const data = await response.json();

      // Conversão de datas para formato YYYY-MM-DD (compatível com input type="date")
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const cleaned = dateStr.trim().replace(/\s+/g, '/'); // troca espaços por barras
        const parts = cleaned.split('/');
        return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
      };


      setValue('nome', `${data.givenName ?? ''} ${data.surname ?? ''}`.trim());
      setValue('nif', data.taxNo ?? '');
      setValue('num_cc', data.documentNumber ?? '');
      setValue('validade_cc', formatDate(data.validityEndDate));
      setValue('data_nascimento', formatDate(data.dateOfBirth));
      setValue('nacionalidade', data.nationality ?? '');
      setValue('num_ss', data.socialSecurityNumber ?? '');
      setValue('num_sns', data.healthNumber ?? '');
      setValue('num_ident_civil', data.civilianIdNumber ?? '');

      console.log("Validade formatada:", formatDate(data.validityEndDate));
      console.log("Nascimento formatada:", formatDate(data.dateOfBirth));

      // Morada
      const address = data.address ?? {};
      setValue('morada', address.street ?? '');
      setValue('codigo_postal', address.postalCode ?? '');
      setValue('localidade', address.municipality ?? '');
      setValue('distrito', address.district ?? '');
      setValue('pais', address.countryCode ?? 'Portugal');

      toast({
        title: "Dados preenchidos com sucesso",
        description: "Os dados do Cartão de Cidadão foram carregados.",
      });

    } catch (err: any) {
      toast({
        title: "Erro ao ler Cartão de Cidadão",
        description: err?.name === 'AbortError'
          ? 'Tempo esgotado. Certifique-se que o leitor está a correr e o cartão inserido.'
          : (err?.message || 'Certifique-se que instalou o middleware Autenticação.gov e iniciou o leitor.'),
        variant: "destructive"
      });
    }
  };


  return (
    <Tabs defaultValue="identification" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="identification">Identificação</TabsTrigger>
        <TabsTrigger value="contact">Contacto / Morada</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
      </TabsList>

      <TabsContent value="identification" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Identificação</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCitizenCardScan}
                className="flex items-center space-x-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>Ler CC</span>
              </Button>
            </div>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Morada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
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