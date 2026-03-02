/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useRegistosAutomoveis, RegistoAutomovel } from '@/hooks/useRegistosAutomoveis';
import { useClients } from '@/hooks/useClients';
import { ClientCombobox } from '@/components/ui/clientcombobox';
import { cn } from '@/lib/utils';

interface RegistoAutomovelModalProps {
  isOpen: boolean;
  onClose: () => void;
  registo?: RegistoAutomovel | null;
}

const STEPS = [
  { label: 'Informações Gerais', shortLabel: '1' },
  { label: 'Pedido & Veículo', shortLabel: '2' },
  { label: 'Ato / Apresentação', shortLabel: '3' },
  { label: 'Atos Requeridos', shortLabel: '4' },
  { label: 'Sujeito Ativo (Comprador)', shortLabel: '5' },
  { label: 'Sujeito Passivo (Vendedor)', shortLabel: '6' },
  { label: 'Emolumentos & Pagamento', shortLabel: '7' },
  { label: 'Declarações & Observações', shortLabel: '8' },
];

export const RegistoAutomovelModal: React.FC<RegistoAutomovelModalProps> = ({
  isOpen,
  onClose,
  registo,
}) => {
  const { createRegisto, updateRegisto, importPdf, uploadAnexo } = useRegistosAutomoveis();
  const { clients } = useClients();
  const isEditing = !!registo;
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  const toDateInputValue = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') {
      const s = value.slice(0, 10);
      return /\d{4}-\d{2}-\d{2}/.test(s) ? s : '';
    }
    return '';
  };

  const getDefaultValues = (r?: RegistoAutomovel | null) => ({
    tipo: r?.tipo || 'particular',
    pago_por: r?.pago_por || 'particular',
    entidade_id: r?.entidade_id || undefined,
    outras_observacoes: r?.outras_observacoes || '',
    numero_pedido: r?.numero_pedido || '',
    data_pedido: toDateInputValue(r?.data_pedido),
    data_publicacao: toDateInputValue(r?.data_publicacao),
    data_venda_facto: toDateInputValue(r?.data_venda_facto),
    data_contrato: toDateInputValue(r?.data_contrato),
    numero_apresentacao: r?.numero_apresentacao || '',
    data_apresentacao: toDateInputValue(r?.data_apresentacao),
    numero_conta: r?.numero_conta || '',
    valor: r?.valor || '',
    despacho: r?.despacho || '',
    emolumento_valor: r?.emolumento_valor || '',
    agravamento_valor: r?.agravamento_valor || '',
    reducao_valor: r?.reducao_valor || '',
    entidade_pagamento: r?.entidade_pagamento || '',
    referencia_pagamento: r?.referencia_pagamento || '',
    montante: r?.montante || '',
    valor_pago: r?.valor_pago || '',
    data_limite_pagamento: toDateInputValue(r?.data_limite_pagamento),
    data_pagamento: toDateInputValue(r?.data_pagamento),
    matricula: r?.matricula || '',
    marca: r?.marca || '',
    quota_parte: r?.quota_parte || '',
    quadro_numero: r?.quadro_numero || '',
    registo_inicial_propriedade: r?.registo_inicial_propriedade || false,
    procedimento_especial: r?.procedimento_especial || false,
    transferencia_locacao: r?.transferencia_locacao || false,
    declaracao_compra_venda: r?.declaracao_compra_venda || false,
    reserva_propriedade: r?.reserva_propriedade || false,
    rent_a_car: r?.rent_a_car || false,
    locacao_financeira: r?.locacao_financeira || false,
    hipoteca: r?.hipoteca || false,
    penhora: r?.penhora || false,
    arresto: r?.arresto || false,
    usufruto: r?.usufruto || false,
    extincao_registo: r?.extincao_registo || false,
    mudanca_residencia: r?.mudanca_residencia || false,
    alteracao_nome: r?.alteracao_nome || false,
    pedido_2via: r?.pedido_2via || false,
    conversao_arresto_penhora: r?.conversao_arresto_penhora || false,
    conversao_registo: r?.conversao_registo || false,
    apreensao: r?.apreensao || false,
    acao: r?.acao || false,
    quantia_reserva: r?.quantia_reserva || '',
    clausula_penal: r?.clausula_penal || '',
    outras_causas_indicar: r?.outras_causas_indicar || '',
    locacao_inicio: toDateInputValue(r?.locacao_inicio),
    locacao_fim: toDateInputValue(r?.locacao_fim),
    hipoteca_quantia: r?.hipoteca_quantia || '',
    hipoteca_tribunal_processo: r?.hipoteca_tribunal_processo || '',
    sa_nome: r?.sa_nome || '',
    sa_nif: r?.sa_nif || '',
    sa_morada: r?.sa_morada || '',
    sa_codigo_postal: r?.sa_codigo_postal || '',
    sa_localidade: r?.sa_localidade || '',
    sa_doc_identificacao: r?.sa_doc_identificacao || '',
    sa_numero_identificacao: r?.sa_numero_identificacao || '',
    sa_certidao_online: r?.sa_certidao_online || '',
    sa_email: r?.sa_email || '',
    sa_telemovel: r?.sa_telemovel || '',
    sp_nome: r?.sp_nome || '',
    sp_nif: r?.sp_nif || '',
    sp_morada: r?.sp_morada || '',
    sp_codigo_postal: r?.sp_codigo_postal || '',
    sp_localidade: r?.sp_localidade || '',
    sp_doc_identificacao: r?.sp_doc_identificacao || '',
    sp_numero_identificacao: r?.sp_numero_identificacao || '',
    sp_certidao_online: r?.sp_certidao_online || '',
    sp_email: r?.sp_email || '',
    sp_telemovel: r?.sp_telemovel || '',
    declaracao_vendedor_confirma: r?.declaracao_vendedor_confirma || false,
    declaracao_entrega_exemplar: r?.declaracao_entrega_exemplar || false,
    declaracao_aprovacao_sp: r?.declaracao_aprovacao_sp || false,
  });

  const form = useForm({
    defaultValues: getDefaultValues(registo),
  });

  React.useEffect(() => {
    form.reset(getDefaultValues(registo));
    setPdfFile(null);
    setCurrentStep(0);
  }, [registo]);

  const tipo = form.watch('tipo');

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const data = await importPdf.mutateAsync(file);
      setPdfFile(file);
      const currentValues = form.getValues();
      const merged = { ...currentValues };
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined && value !== '') {
          (merged as any)[key] = value;
        }
      }
      form.reset(merged);
    } finally {
      setIsImporting(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value === '' || value === null) continue;
        cleaned[key] = value;
      }

      if (cleaned.tipo === 'stand' && cleaned.pago_por === 'stand') {
        cleaned.estado_pagamento = 'pendente';
      } else {
        cleaned.estado_pagamento = 'pago';
      }

      if (isEditing && registo) {
        await updateRegisto.mutateAsync({ id: registo.id, ...cleaned });
      } else {
        const novoRegisto = await createRegisto.mutateAsync(cleaned);
        if (pdfFile && novoRegisto?.id) {
          await uploadAnexo.mutateAsync({ registoId: novoRegisto.id, file: pdfFile, tipo: 'pdf_irn' });
        }
      }
      setPdfFile(null);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar registo:', error);
    }
  };

  const booleanFields = [
    { name: 'registo_inicial_propriedade', label: 'Registo Inicial de Propriedade' },
    { name: 'procedimento_especial', label: 'Procedimento Especial' },
    { name: 'transferencia_locacao', label: 'Transferência/Locação' },
    { name: 'declaracao_compra_venda', label: 'Declaração Compra e Venda' },
    { name: 'reserva_propriedade', label: 'Reserva de Propriedade' },
    { name: 'rent_a_car', label: 'Rent-a-Car' },
    { name: 'locacao_financeira', label: 'Locação Financeira' },
    { name: 'hipoteca', label: 'Hipoteca' },
    { name: 'penhora', label: 'Penhora' },
    { name: 'arresto', label: 'Arresto' },
    { name: 'usufruto', label: 'Usufruto' },
    { name: 'extincao_registo', label: 'Extinção de Registo' },
    { name: 'mudanca_residencia', label: 'Mudança de Residência' },
    { name: 'alteracao_nome', label: 'Alteração de Nome' },
    { name: 'pedido_2via', label: 'Pedido 2.ª Via' },
    { name: 'conversao_arresto_penhora', label: 'Conversão Arresto/Penhora' },
    { name: 'conversao_registo', label: 'Conversão de Registo' },
    { name: 'apreensao', label: 'Apreensão' },
    { name: 'acao', label: 'Ação' },
  ];

  const goNext = () => setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
  const goPrev = () => setCurrentStep(s => Math.max(s - 1, 0));
  const isLastStep = currentStep === STEPS.length - 1;

  // Step 0: Geral (PDF upload + tipo/entidade/pago_por)
  const StepGeral = () => (
    <div className="space-y-4">
      {!isEditing && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <label className="cursor-pointer flex flex-col items-center gap-2">
            <Upload className="h-6 w-6 text-gray-400" />
            <span className="text-sm text-gray-600">
              {isImporting
                ? 'A processar PDF com IA...'
                : pdfFile
                  ? `PDF importado: ${pdfFile.name} (será guardado como anexo)`
                  : 'Importar PDF do IRN (auto-preenche o formulário e guarda como anexo)'}
            </span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handlePdfUpload}
              disabled={isImporting}
            />
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="particular">Particular</SelectItem>
                  <SelectItem value="stand">Stand</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="entidade_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendedor (Entidade)</FormLabel>
              <ClientCombobox
                clients={clients}
                value={field.value}
                onChange={field.onChange}
                isLoading={false}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pago_por"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pago por</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="particular">Particular</SelectItem>
                  <SelectItem value="solicitador">Solicitador</SelectItem>
                  {tipo === 'stand' && <SelectItem value="stand">Stand</SelectItem>}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  // Step 1: Pedido & Veículo
  const StepPedidoVeiculo = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-base font-semibold text-gray-800 mb-3">Pedido</h4>
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="numero_pedido" render={({ field }) => (
                <FormItem><FormLabel>N.º Pedido</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="data_pedido" render={({ field }) => (
                <FormItem><FormLabel>Data Pedido</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="data_publicacao" render={({ field }) => (
                <FormItem><FormLabel>Data Publicação</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="data_venda_facto" render={({ field }) => (
                <FormItem><FormLabel>Data Venda de Facto</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="data_contrato" render={({ field }) => (
                <FormItem><FormLabel>Data Contrato</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
              )} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h4 className="text-base font-semibold text-gray-800 mb-3">Veículo</h4>
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="matricula" render={({ field }) => (
                <FormItem><FormLabel>Matrícula</FormLabel><FormControl><Input placeholder="AA-00-AA" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="marca" render={({ field }) => (
                <FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="quota_parte" render={({ field }) => (
                <FormItem><FormLabel>Quota Parte</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="quadro_numero" render={({ field }) => (
                <FormItem><FormLabel>N.º Quadro (VIN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Step 2: Ato / Apresentação
  const StepAto = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="numero_apresentacao" render={({ field }) => (
              <FormItem><FormLabel>N.º Apresentação</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="data_apresentacao" render={({ field }) => (
              <FormItem><FormLabel>Data Apresentação</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="numero_conta" render={({ field }) => (
              <FormItem><FormLabel>N.º Conta</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="valor" render={({ field }) => (
              <FormItem><FormLabel>Valor</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
            )} />
          </div>
          <div className="mt-4">
            <FormField control={form.control} name="despacho" render={({ field }) => (
              <FormItem><FormLabel>Despacho</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Step 3: Atos Requeridos
  const StepAtosRequeridos = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {booleanFields.map(({ name, label }) => (
              <FormField
                key={name}
                control={form.control}
                name={name as any}
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">{label}</FormLabel>
                  </FormItem>
                )}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormField control={form.control} name="quantia_reserva" render={({ field }) => (
              <FormItem><FormLabel>Quantia Reserva</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="hipoteca_quantia" render={({ field }) => (
              <FormItem><FormLabel>Hipoteca Quantia</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="hipoteca_tribunal_processo" render={({ field }) => (
              <FormItem><FormLabel>Hipoteca Tribunal/Processo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormField control={form.control} name="locacao_inicio" render={({ field }) => (
              <FormItem><FormLabel>Locação Início</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="locacao_fim" render={({ field }) => (
              <FormItem><FormLabel>Locação Fim</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
            )} />
          </div>
          <div className="mt-4 space-y-4">
            <FormField control={form.control} name="clausula_penal" render={({ field }) => (
              <FormItem><FormLabel>Cláusula Penal</FormLabel><FormControl><Textarea className="resize-none" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="outras_causas_indicar" render={({ field }) => (
              <FormItem><FormLabel>Outras Causas a Indicar</FormLabel><FormControl><Textarea className="resize-none" {...field} /></FormControl></FormItem>
            )} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Step 4: Sujeito Ativo (Comprador)
  const StepSujeitoAtivo = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="sa_nome" render={({ field }) => (
              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="sa_nif" render={({ field }) => (
              <FormItem><FormLabel>NIF</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
          <FormField control={form.control} name="sa_morada" render={({ field }) => (
            <FormItem><FormLabel>Morada</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="sa_codigo_postal" render={({ field }) => (
              <FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input placeholder="0000-000" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="sa_localidade" render={({ field }) => (
              <FormItem><FormLabel>Localidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="sa_doc_identificacao" render={({ field }) => (
              <FormItem><FormLabel>Doc. Identificação</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="sa_numero_identificacao" render={({ field }) => (
              <FormItem><FormLabel>N.º Identificação</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField control={form.control} name="sa_certidao_online" render={({ field }) => (
              <FormItem><FormLabel>Certidão Online</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="sa_email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="sa_telemovel" render={({ field }) => (
              <FormItem><FormLabel>Telemóvel</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Step 5: Sujeito Passivo (Vendedor)
  const StepSujeitoPassivo = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="sp_nome" render={({ field }) => (
              <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="sp_nif" render={({ field }) => (
              <FormItem><FormLabel>NIF</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
          <FormField control={form.control} name="sp_morada" render={({ field }) => (
            <FormItem><FormLabel>Morada</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="sp_codigo_postal" render={({ field }) => (
              <FormItem><FormLabel>Código Postal</FormLabel><FormControl><Input placeholder="0000-000" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="sp_localidade" render={({ field }) => (
              <FormItem><FormLabel>Localidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="sp_doc_identificacao" render={({ field }) => (
              <FormItem><FormLabel>Doc. Identificação</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="sp_numero_identificacao" render={({ field }) => (
              <FormItem><FormLabel>N.º Identificação</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField control={form.control} name="sp_certidao_online" render={({ field }) => (
              <FormItem><FormLabel>Certidão Online</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="sp_email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="sp_telemovel" render={({ field }) => (
              <FormItem><FormLabel>Telemóvel</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
            )} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Step 6: Emolumentos + Pagamento IRN
  const StepPagamento = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-base font-semibold text-gray-800 mb-3">Emolumentos</h4>
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="emolumento_valor" render={({ field }) => (
                <FormItem><FormLabel>Emolumento</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="agravamento_valor" render={({ field }) => (
                <FormItem><FormLabel>Agravamento</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="reducao_valor" render={({ field }) => (
                <FormItem><FormLabel>Redução</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
              )} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h4 className="text-base font-semibold text-gray-800 mb-3">Pagamento IRN</h4>
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="entidade_pagamento" render={({ field }) => (
                <FormItem><FormLabel>Entidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="referencia_pagamento" render={({ field }) => (
                <FormItem><FormLabel>Referência</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="montante" render={({ field }) => (
                <FormItem><FormLabel>Montante</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="valor_pago" render={({ field }) => (
                <FormItem><FormLabel>Valor Pago</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="data_limite_pagamento" render={({ field }) => (
                <FormItem><FormLabel>Data Limite Pagamento</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="data_pagamento" render={({ field }) => (
                <FormItem><FormLabel>Data Pagamento</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
              )} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Step 7: Declarações + Observações (final)
  const StepFinalizar = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <h4 className="text-base font-semibold text-gray-800 mb-3">Declarações</h4>
          <div className="space-y-3">
            <FormField control={form.control} name="declaracao_vendedor_confirma" render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="text-sm font-normal">O vendedor confirma a venda</FormLabel>
              </FormItem>
            )} />
            <FormField control={form.control} name="declaracao_entrega_exemplar" render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="text-sm font-normal">Entrega de exemplar</FormLabel>
              </FormItem>
            )} />
            <FormField control={form.control} name="declaracao_aprovacao_sp" render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="text-sm font-normal">Aprovação do sujeito passivo</FormLabel>
              </FormItem>
            )} />
          </div>
        </CardContent>
      </Card>

      <FormField control={form.control} name="outras_observacoes" render={({ field }) => (
        <FormItem>
          <FormLabel>Observações</FormLabel>
          <FormControl><Textarea className="resize-none" placeholder="Observações adicionais..." {...field} /></FormControl>
        </FormItem>
      )} />
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0: return <StepGeral />;
      case 1: return <StepPedidoVeiculo />;
      case 2: return <StepAto />;
      case 3: return <StepAtosRequeridos />;
      case 4: return <StepSujeitoAtivo />;
      case 5: return <StepSujeitoPassivo />;
      case 6: return <StepPagamento />;
      case 7: return <StepFinalizar />;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Registo Automóvel' : 'Novo Registo Automóvel'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulário de registo automóvel
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1.5 pb-1">
          {STEPS.map((step, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentStep(i)}
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors',
                i === currentStep
                  ? 'bg-blue-600 text-white'
                  : i < currentStep
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              )}
              title={step.label}
            >
              {i < currentStep ? <Check className="h-3.5 w-3.5" /> : step.shortLabel}
            </button>
          ))}
        </div>

        {/* Step title */}
        <div className="border-b pb-3">
          <h3 className="text-lg font-bold text-gray-900">
            {STEPS[currentStep].label}
          </h3>
          <p className="text-sm text-gray-500">Passo {currentStep + 1} de {STEPS.length}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="min-h-[300px]">
              {renderStep()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 0 ? onClose : goPrev}
                className="gap-1"
              >
                {currentStep === 0 ? (
                  'Cancelar'
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </>
                )}
              </Button>

              {isLastStep ? (
                <Button type="submit" disabled={createRegisto.isPending || updateRegisto.isPending} className="gap-1">
                  <Check className="h-4 w-4" />
                  {isEditing ? 'Atualizar' : 'Criar'}
                </Button>
              ) : (
                <Button type="button" onClick={goNext} className="gap-1">
                  Seguinte
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
