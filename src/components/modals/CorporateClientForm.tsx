import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DynamicSelect } from '@/components/ui/DynamicSelect';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useClients } from '@/hooks/useClients';
import { ClienteContactosTab } from '@/components/ClienteContactosTab';
import { ClientCombobox } from '@/components/ui/clientcombobox';
import { ClientModal } from './ClientModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, X, AlertTriangle } from 'lucide-react';

export interface RepresentanteLocal {
  id?: number;
  cliente_id?: number | null;
  nome: string;
  nif: string;
  email: string;
  telemovel: string;
  cargo: string;
  quota_valor?: number | null;
  quota_tipo?: string | null;
}

interface CorporateClientFormProps {
  form: UseFormReturn<any>;
  watch: (name: string) => any;
  setValue: (name: string, value: any) => void;
  clienteId?: number;
  contactosLocais?: Array<{ tipo: 'telefone' | 'email'; valor: string; descricao?: string; principal: boolean }>;
  onContactosChange?: (contactos: Array<{ tipo: 'telefone' | 'email'; valor: string; descricao?: string; principal: boolean }>) => void;
  representantesLocais?: RepresentanteLocal[];
  onRepresentantesChange?: (reps: RepresentanteLocal[]) => void;
}

export const CorporateClientForm: React.FC<CorporateClientFormProps> = ({
  form,
  watch,
  setValue,
  clienteId,
  contactosLocais,
  onContactosChange,
  representantesLocais = [],
  onRepresentantesChange,
}) => {
  const { register, formState: { errors } } = form;
  const { clients, isLoading: isClientsLoading } = useClients();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newRepClienteId, setNewRepClienteId] = useState<number | undefined>(undefined);
  const [newRepCargo, setNewRepCargo] = useState('');
  const [newRepQuotaValor, setNewRepQuotaValor] = useState('');
  const [newRepQuotaTipo, setNewRepQuotaTipo] = useState<string>('percentagem');

  const handleAddRepresentante = () => {
    if (!newRepClienteId) return;
    if (representantesLocais.some(r => r.cliente_id === newRepClienteId)) return;
    const selectedClient = clients?.find(c => Number(c.id) === newRepClienteId);
    if (!selectedClient) return;
    const newRep: RepresentanteLocal = {
      cliente_id: newRepClienteId,
      nome: (selectedClient as any).nome || (selectedClient as any).nome_empresa || '',
      nif: (selectedClient as any).nif || (selectedClient as any).nif_empresa || '',
      email: (selectedClient as any).email || '',
      telemovel: (selectedClient as any).telefone || '',
      cargo: newRepCargo,
      quota_valor: newRepQuotaValor ? parseFloat(newRepQuotaValor) : null,
      quota_tipo: newRepQuotaTipo,
    };
    onRepresentantesChange?.([...representantesLocais, newRep]);
    setNewRepClienteId(undefined);
    setNewRepCargo('');
    setNewRepQuotaValor('');
    setNewRepQuotaTipo('percentagem');
  };

  const handleUpdateRepQuota = (index: number, field: 'quota_valor' | 'quota_tipo', value: any) => {
    const updated = [...representantesLocais];
    updated[index] = { ...updated[index], [field]: field === 'quota_valor' ? (value ? parseFloat(value) : null) : value };
    onRepresentantesChange?.(updated);
  };

  // Quota validation
  const capitalSocialStr = watch('capital_social') || '';
  const capitalSocialNum = parseFloat(capitalSocialStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  const quotaTipoAtual = representantesLocais.length > 0 ? (representantesLocais[0]?.quota_tipo || 'percentagem') : 'percentagem';
  const somaQuotas = representantesLocais.reduce((sum, r) => sum + (r.quota_valor || 0), 0);
  const quotaExpected = quotaTipoAtual === 'percentagem' ? 100 : capitalSocialNum;
  const quotaLabel = quotaTipoAtual === 'percentagem' ? '%' : '€';
  const hasQuotas = representantesLocais.some(r => r.quota_valor != null && r.quota_valor > 0);
  const quotaMismatch = hasQuotas && Math.abs(somaQuotas - quotaExpected) > 0.01;

  const handleRemoveRepresentante = (index: number) => {
    const updated = representantesLocais.filter((_, i) => i !== index);
    onRepresentantesChange?.(updated);
  };

  return (
    <>
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
                  style={{ textTransform: 'uppercase' }}
                  onChange={(e) => { e.target.value = e.target.value.toUpperCase(); register('nome_empresa').onChange(e); }}
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
                <Label htmlFor="registo_comercial">N.º Registo Comercial</Label>
                <Input
                  id="registo_comercial"
                  {...register('registo_comercial')}
                  placeholder="Número de registo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="forma_juridica">Forma jurídica</Label>
                <DynamicSelect
                  categoria="forma_juridica"
                  value={watch('forma_juridica')}
                  onValueChange={(value) => setValue('forma_juridica', value)}
                  placeholder="Selecione"
                  fallbackOptions={[
                    { value: "LDA", label: "Sociedade por Quotas (LDA)" },
                    { value: "SA", label: "Sociedade Anónima (SA)" },
                    { value: "SGPS", label: "Sociedade Gestora de Participações Sociais (SGPS)" },
                    { value: "CRL", label: "Cooperativa de Responsabilidade Limitada (CRL)" },
                    { value: "EI", label: "Estabelecimento Individual (EI)" },
                    { value: "other", label: "Outra" },
                  ]}
                />
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

            {/* Representantes Legais */}
              <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold">Representantes Legais</h4>

              {representantesLocais.map((rep, index) => (
                <div key={rep.id ?? `new-${index}`} className="rounded-lg border bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rep.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {[rep.cargo, rep.nif].filter(Boolean).join(' | ')}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 shrink-0"
                      onClick={() => handleRemoveRepresentante(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Quota:</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="h-7 text-xs w-24"
                      placeholder="Valor"
                      value={rep.quota_valor ?? ''}
                      onChange={(e) => handleUpdateRepQuota(index, 'quota_valor', e.target.value)}
                    />
                    <Select
                      value={rep.quota_tipo || 'percentagem'}
                      onValueChange={(v) => handleUpdateRepQuota(index, 'quota_tipo', v)}
                    >
                      <SelectTrigger className="h-7 text-xs w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentagem">%</SelectItem>
                        <SelectItem value="euros">€</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}

              {quotaMismatch && (
                <Alert className="border-amber-300 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-800">
                    Soma das quotas ({somaQuotas.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}{quotaLabel}) não corresponde ao esperado ({quotaExpected.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}{quotaLabel}).
                    {quotaTipoAtual === 'euros' && capitalSocialNum === 0 && ' Preencha o campo "Capital social" acima.'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <Label>Adicionar representante</Label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsClientModalOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Nova Entidade
                  </Button>
                </div>
                <ClientCombobox
                  clients={clients || []}
                  value={newRepClienteId}
                  onChange={(value) => setNewRepClienteId(value)}
                  isLoading={isClientsLoading}
                />
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input
                    value={newRepCargo}
                    onChange={(e) => setNewRepCargo(e.target.value)}
                    placeholder="Gerente, Administrador, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Quota (valor)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newRepQuotaValor}
                      onChange={(e) => setNewRepQuotaValor(e.target.value)}
                      placeholder="Ex: 50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={newRepQuotaTipo}
                      onValueChange={(v) => setNewRepQuotaTipo(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentagem">% (Percentagem)</SelectItem>
                        <SelectItem value="euros">€ (Euros)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {newRepClienteId && representantesLocais.some(r => r.cliente_id === newRepClienteId) && (
                  <p className="text-sm text-amber-600">Esta entidade já foi adicionada como representante.</p>
                )}
                <Button
                  type="button"
                  size="sm"
                  disabled={!newRepClienteId || representantesLocais.some(r => r.cliente_id === newRepClienteId)}
                  onClick={handleAddRepresentante}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Representante
                </Button>
              </div>
            </div>
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
            <CardTitle>Morada da Sede</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="codigo_rcbe">Código RCBE</Label>
              <Input
                id="codigo_rcbe"
                {...register('codigo_rcbe')}
                placeholder="Código do Registo Central do Beneficiário Efetivo"
              />
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
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
    <ClientModal
      isOpen={isClientModalOpen}
      onClose={() => setIsClientModalOpen(false)}
      onSuccess={(newClient) => {
        // Após criar o cliente, selecioná-lo automaticamente no campo de novo representante
        if (newClient?.id) {
          setNewRepClienteId(Number(newClient.id));
        }
        setIsClientModalOpen(false);
      }}
    />
    </>
  );
};