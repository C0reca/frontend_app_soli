import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DynamicSelect } from '@/components/ui/DynamicSelect';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { CreditCard, Scan } from 'lucide-react';
import { IndividualClient } from '@/hooks/useClients';
import { useToast } from '@/hooks/use-toast';
import { ClienteContactosTab } from '@/components/ClienteContactosTab';
import { CodigoPostalInput } from '@/components/ui/CodigoPostalInput';

interface IndividualClientFormProps {
  form: UseFormReturn<any>;
  watch: (name: string) => any;
  setValue: (name: string, value: any) => void;
  clienteId?: number;
  contactosLocais?: Array<{ tipo: 'telefone' | 'email'; valor: string; descricao?: string; principal: boolean }>;
  onContactosChange?: (contactos: Array<{ tipo: 'telefone' | 'email'; valor: string; descricao?: string; principal: boolean }>) => void;
}

// Tempo máximo para ler o CC (inclui tempo para o utilizador introduzir a PIN da morada no diálogo)
const CC_READ_TIMEOUT_MS = 90 * 1000; // 90 segundos

export const IndividualClientForm: React.FC<IndividualClientFormProps> = ({
  form,
  watch,
  setValue,
  clienteId,
  contactosLocais,
  onContactosChange
}) => {
  const { register, formState: { errors } } = form;
  const { toast } = useToast();
  const [isReadingCC, setIsReadingCC] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('identification');

  const tabs = ['identification', 'contact', 'documents'] as const;
  const tabLabels = { identification: 'Identificação', contact: 'Contacto / Morada', documents: 'Documentos' };
  const currentIdx = tabs.indexOf(activeTab as typeof tabs[number]);
  const goNext = () => { if (currentIdx < tabs.length - 1) setActiveTab(tabs[currentIdx + 1]); };
  const goPrev = () => { if (currentIdx > 0) setActiveTab(tabs[currentIdx - 1]); };

  const handleCitizenCardScan = async () => {
    if (isReadingCC) return;
    setIsReadingCC(true);
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = setTimeout(() => controller.abort(), CC_READ_TIMEOUT_MS);
    try {
      const response = await fetch('http://127.0.0.1:8081/cc', { signal: controller.signal });
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = null;
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

      // Só atualiza o campo se o valor do CC não for vazio E (o campo estiver vazio OU for um campo de identificação do CC)
      const ccFields = ['nome', 'nif', 'num_cc', 'validade_cc', 'data_nascimento', 'nacionalidade', 'num_ss', 'num_sns', 'num_ident_civil', 'morada', 'codigo_postal', 'localidade', 'concelho', 'distrito', 'pais'];
      const setIfEmpty = (field: string, value: string) => {
        if (!value) return;
        const current = form.getValues(field);
        // Campos de identificação CC são sempre atualizados (vêm do cartão, são fonte de verdade)
        const alwaysUpdate = ['nome', 'nif', 'num_cc', 'validade_cc', 'data_nascimento', 'num_ss', 'num_sns', 'num_ident_civil'];
        if (alwaysUpdate.includes(field) || !current || current === '') {
          setValue(field, value);
        }
      };

      setIfEmpty('nome', `${data.givenName ?? ''} ${data.surname ?? ''}`.trim());
      setIfEmpty('nif', data.taxNo ?? '');
      setIfEmpty('num_cc', data.documentNumber ?? '');
      setIfEmpty('validade_cc', formatDate(data.validityEndDate));
      setIfEmpty('data_nascimento', formatDate(data.dateOfBirth));
      setIfEmpty('nacionalidade', data.nationality ?? '');
      setIfEmpty('num_ss', data.socialSecurityNumber ?? '');
      setIfEmpty('num_sns', data.healthNumber ?? '');
      setIfEmpty('num_ident_civil', data.civilianIdNumber ?? '');

      // Morada — o CC pode devolver nomes de campos variados dependendo do middleware
      const address = data.address ?? data.morada ?? {};
      const rua = address.street || address.streetName || address.streetType
        ? `${address.streetType || ''} ${address.streetName || address.street || ''}`.trim()
        : address.street || '';
      const codigoPostal = address.postalCode || address.zip || address.cp4
        ? `${address.cp4 || address.postalCode || ''}${address.cp3 ? `-${address.cp3}` : ''}`
        : '';
      const localidade = address.parish || address.freguesia || address.locality || address.municipality || '';
      const concelho = address.municipality || address.concelho || address.city || '';
      const distrito = address.district || address.distrito || '';

      setIfEmpty('morada', rua);
      setIfEmpty('codigo_postal', codigoPostal);
      setIfEmpty('localidade', localidade);
      setIfEmpty('concelho', concelho);
      setIfEmpty('distrito', distrito);
      setIfEmpty('pais', address.countryCode || address.country || 'Portugal');

      const moradaLida = !!(rua || codigoPostal || localidade);
      toast({
        title: "Dados do CC carregados",
        description: moradaLida
          ? "Todos os dados foram preenchidos, incluindo morada."
          : "Dados pessoais preenchidos. A morada não foi lida — pode ser necessário introduzir o PIN da morada no leitor.",
      });
    } catch (err: any) {
      let errMsg: string;
      if (err?.name === 'AbortError') {
        errMsg = 'Tempo esgotado (90s). Insira o PIN da morada mais rapidamente e tente novamente.';
      } else if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError') || err?.message?.includes('ERR_CONNECTION_REFUSED')) {
        errMsg = 'O leitor de Cartão de Cidadão não está a correr. Verifique que: 1) O programa "CC Reader" está aberto; 2) O leitor de cartões está ligado ao computador; 3) O cartão está inserido no leitor.';
      } else {
        errMsg = err?.message || 'Erro desconhecido ao ler o cartão.';
      }
      toast({
        title: "Erro ao ler Cartão de Cidadão",
        description: errMsg,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsReadingCC(false);
    }
  };


  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        {tabs.map((tab, i) => (
          <TabsTrigger key={tab} value={tab} className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">{i + 1}</span>
            {tabLabels[tab]}
          </TabsTrigger>
        ))}
      </TabsList>

      <p className="text-xs text-muted-foreground mt-2">Campos com <span className="text-red-500">*</span> são obrigatórios. Os restantes pode preencher mais tarde.</p>

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
                disabled={isReadingCC}
                className="flex items-center space-x-2"
              >
                <CreditCard className="h-4 w-4" />
                <span>{isReadingCC ? 'A ler... (introduza o PIN se pedido)' : 'Ler Cartão de Cidadão'}</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo <span className="text-red-500">*</span></Label>
                <Input
                  id="nome"
                  {...register('nome')}
                  placeholder="Nome completo"
                  style={{ textTransform: 'uppercase' }}
                  onChange={(e) => { e.target.value = e.target.value.toUpperCase(); register('nome').onChange(e); }}
                />
                {errors.nome && (
                  <p className="text-sm text-red-600">{errors.nome.message?.toString()}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nif">NIF <span className="text-red-500">*</span></Label>
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

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground p-2 -mx-2">
                  <span>Campos adicionais (opcionais)</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="senha_financas">Senha Finanças</Label>
                <Input
                  id="senha_financas"
                  {...register('senha_financas')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha_ss">Senha Segurança Social</Label>
                <Input
                  id="senha_ss"
                  {...register('senha_ss')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="designacao">Designação</Label>
              <Input
                id="designacao"
                {...register('designacao')}
                placeholder="Designação"
              />
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
                <Label htmlFor="naturalidade_freguesia">Naturalidade (Freguesia)</Label>
                <Input
                  id="naturalidade_freguesia"
                  {...register('naturalidade_freguesia')}
                  placeholder="Ex: Santa Maria Maior"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="naturalidade_concelho">Naturalidade (Concelho)</Label>
                <Input
                  id="naturalidade_concelho"
                  {...register('naturalidade_concelho')}
                  placeholder="Ex: Lisboa"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado_civil">Estado civil</Label>
                <DynamicSelect
                  categoria="estado_civil"
                  value={watch('estado_civil')}
                  onValueChange={(value) => setValue('estado_civil', value)}
                  placeholder="Selecione"
                  fallbackOptions={[
                    { value: "single", label: "Solteiro(a)" },
                    { value: "married", label: "Casado(a)" },
                    { value: "uniao_facto", label: "União de Facto" },
                    { value: "divorced", label: "Divorciado(a)" },
                    { value: "separacao_facto", label: "Separação de Facto" },
                    { value: "widowed", label: "Viúvo(a)" },
                  ]}
                />
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

              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="contact" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Contactos</CardTitle>
          </CardHeader>
          <CardContent>
            <ClienteContactosTab 
              clienteId={clienteId} 
              contactosLocais={contactosLocais}
              onContactosChange={onContactosChange}
            />
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
                  <CodigoPostalInput
                      value={watch('codigo_postal') || ''}
                      onChange={(val) => setValue('codigo_postal', val)}
                      onSelect={(result) => {
                        // Auto-preencher localidade, concelho e distrito ao selecionar código postal
                        if (result.localidade && !watch('localidade')) setValue('localidade', result.localidade);
                        if (result.concelho && !watch('concelho')) setValue('concelho', result.concelho);
                        if (result.distrito && !watch('distrito')) setValue('distrito', result.distrito);
                      }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localidade">Freguesia</Label>
                  <Input
                      id="localidade"
                      {...register('localidade')}
                      placeholder="Mafamude"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="concelho">Concelho</Label>
                  <Input
                      id="concelho"
                      {...register('concelho')}
                      placeholder="Vila Nova de Gaia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distrito">Distrito</Label>
                  <Input
                      id="distrito"
                      {...register('distrito')}
                      placeholder="Porto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">

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
                {...form.register('iban')}
                placeholder="PT50 0000 0000 0000 0000 0000 0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                {...form.register('observacoes')}
                placeholder="Observações..."
                rows={4}
              />
            </div>

          </CardContent>
        </Card>
      </TabsContent>

      {/* Navegação entre passos */}
      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" size="sm" onClick={goPrev} disabled={currentIdx === 0}>
          Anterior
        </Button>
        <span className="text-xs text-muted-foreground self-center">
          Passo {currentIdx + 1} de {tabs.length}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={goNext} disabled={currentIdx === tabs.length - 1}>
          Seguinte
        </Button>
      </div>
    </Tabs>
  );
};