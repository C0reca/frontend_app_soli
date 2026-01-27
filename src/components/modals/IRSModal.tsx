import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useIRS, IRS as IRSType, IRSCreate, IRSUpdate } from '@/hooks/useIRS';
import { Client, useClients } from '@/hooks/useClients';
import { Loader2, Plus, ExternalLink, ChevronRight, ChevronLeft, Check, User, CreditCard, FileText, Mail, Printer, MessageCircle } from 'lucide-react';
import { ClientCombobox } from '@/components/ui/clientcombobox';
import { ClientModal } from './ClientModal';
import { useAgregadoFamiliar } from '@/hooks/useAgregadoFamiliar';
import { AgregadoFamiliarTab } from '@/components/AgregadoFamiliarTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

const irsSchema = z.object({
  cliente_id: z.number().min(1, 'Selecione um cliente'),
  ano: z.number().min(2000).max(2100).optional(),
  fase: z.enum(['1', '2']).transform(val => parseInt(val)),
  estado: z.enum(['Por Pagar', 'Pago', 'Isento']).default('Por Pagar'),
  estado_entrega: z.enum(['Enviado', 'Levantado Pelo Cliente', 'Aguarda Documentos', 'Contencioso Administrativo', 'Em Análise', 'Verificado', 'Concluído']).optional(),
  levantar_irs_apos_dia: z.string().optional(),
  observacoes: z.string().optional(),
});

type IRSFormData = z.infer<typeof irsSchema>;

interface IRSModalProps {
  irs?: IRSType | null;
  clients: Client[];
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
}

const STEPS = [
  { id: 1, title: 'Cliente e Ano', icon: User },
  { id: 2, title: 'Agregado Familiar', icon: FileText },
  { id: 3, title: 'Pagamento', icon: CreditCard },
  { id: 4, title: 'Recibo', icon: Printer },
];

export const IRSModal: React.FC<IRSModalProps> = ({ irs, clients, isOpen, onClose, initialStep }) => {
  const { createIRS, updateIRS, registrarHistorico } = useIRS();
  const { clients: allClients, isLoading: isClientsLoading, updateClient } = useClients();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = !!irs;
  const [currentStep, setCurrentStep] = useState(1);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [createdIRSId, setCreatedIRSId] = useState<number | null>(null);
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [updatingTelefone, setUpdatingTelefone] = useState(false);
  const [telefoneAddress, setTelefoneAddress] = useState('');

  // Preparar clientes para o ClientCombobox (ordenados do mais recente para o mais antigo)
  const clientsForCombobox = (allClients || clients)
    .map((client) => {
      const tipo = client.tipo || 'singular';
      const nome = tipo === 'singular' 
        ? (client as any).nome 
        : (client as any).nome_empresa;
      return {
        id: parseInt(client.id.toString()),
        nome: nome || `Cliente #${client.id}`,
        nome_empresa: tipo === 'coletivo' ? (client as any).nome_empresa : null,
        tipo: tipo as 'singular' | 'coletivo',
        nif: tipo === 'singular' ? (client as any).nif : null,
        nif_empresa: tipo === 'coletivo' ? (client as any).nif_empresa : null,
        criado_em: (client as any).criado_em || (client as any).createdAt || null,
      };
    })
    .sort((a, b) => {
      // Ordenar do mais recente para o mais antigo
      if (a.criado_em && b.criado_em) {
        return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
      }
      // Se não houver data, ordenar por ID (mais recente = maior ID)
      return b.id - a.id;
    });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<IRSFormData>({
    resolver: zodResolver(irsSchema),
    defaultValues: irs
      ? {
          cliente_id: irs.cliente_id,
          ano: irs.ano,
          fase: irs.fase.toString() as '1' | '2',
          estado: irs.estado,
          estado_entrega: irs.estado_entrega,
          levantar_irs_apos_dia: irs.levantar_irs_apos_dia || '',
          observacoes: irs.observacoes || '',
        }
      : {
          cliente_id: 0,
          ano: new Date().getFullYear(),
          fase: '1' as '1' | '2',
          estado: 'Por Pagar',
          estado_entrega: undefined,
          levantar_irs_apos_dia: '',
          observacoes: '',
        },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (irs) {
        reset({
          cliente_id: irs.cliente_id,
          ano: irs.ano,
          fase: irs.fase.toString() as '1' | '2',
          estado: irs.estado,
          estado_entrega: irs.estado_entrega,
          levantar_irs_apos_dia: irs.levantar_irs_apos_dia || '',
          observacoes: irs.observacoes || '',
        });
        // Se initialStep foi passado, usar ele, senão começar no step 1
        setCurrentStep(initialStep || 1);
      } else {
        reset({
          cliente_id: 0,
          ano: new Date().getFullYear(),
          fase: '1' as '1' | '2',
          estado: 'Por Pagar',
          estado_entrega: undefined,
          levantar_irs_apos_dia: '',
          observacoes: '',
        });
        setCurrentStep(1);
      }
      // Reset estados da etapa 4
      setEmailAddress('');
      setTelefoneAddress('');
      setCreatedIRSId(null);
    }
  }, [isOpen, irs, reset, initialStep]);

  const clienteId = watch('cliente_id');
  const { agregado, isLoading: isLoadingAgregado } = useAgregadoFamiliar(clienteId && clienteId > 0 ? clienteId : undefined);
  
  // Obter dados do cliente selecionado
  const clienteSelecionado = clienteId ? (allClients || clients).find(c => {
    const cId = typeof c.id === 'string' ? parseInt(c.id, 10) : c.id;
    return cId === clienteId;
  }) : null;

  // Preencher email e telefone automaticamente quando entrar na etapa 4
  useEffect(() => {
    if (currentStep === 4 && clienteSelecionado) {
      // Preencher email se existir
      if (clienteSelecionado.email) {
        setEmailAddress(clienteSelecionado.email);
      }
      // Preencher telefone se existir
      if (clienteSelecionado.telefone) {
        setTelefoneAddress(clienteSelecionado.telefone);
      }
    }
  }, [currentStep, clienteId, clienteSelecionado]);

  const handleClientCreated = (createdClient: Client) => {
    if (createdClient?.id) {
      const newId = typeof createdClient.id === 'string' ? parseInt(createdClient.id, 10) : createdClient.id;
      if (!Number.isNaN(newId)) {
        setValue('cliente_id', newId);
      }
    }
    setIsClientModalOpen(false);
  };


  const validateStep = (step: number): boolean => {
    if (step === 1) {
      const clienteId = watch('cliente_id');
      const ano = watch('ano');
      const fase = watch('fase');
      return !!clienteId && clienteId > 0 && !!ano && !!fase;
    }
    if (step === 3) {
      const estado = watch('estado');
      return !!estado;
    }
    return true;
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (validateStep(currentStep)) {
      const estado = watch('estado');
      // Se estiver na etapa 3 e o estado for "Pago", pode ir para etapa 4
      // Mas só se não estiver a editar ou se já tiver criado o IRS
      const maxSteps = (estado === 'Pago' && (!isEditing || createdIRSId !== null)) ? 4 : 3;
      setCurrentStep(prev => Math.min(prev + 1, maxSteps));
    }
  };

  const handlePrevious = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: IRSFormData) => {
    try {
      if (isEditing && irs) {
        const updateData: IRSUpdate = {
          fase: data.fase,
          estado: data.estado,
          estado_entrega: data.estado_entrega,
          levantar_irs_apos_dia: data.levantar_irs_apos_dia || undefined,
          observacoes: data.observacoes || undefined,
        };
        await updateIRS.mutateAsync({ id: irs.id, data: updateData });
        // Se o estado for "Pago", ir para a etapa 4
        if (data.estado === 'Pago') {
          setCurrentStep(4);
          return;
        }
        onClose();
      } else {
        const ano = data.ano || new Date().getFullYear();
        const createData: IRSCreate = {
          cliente_id: data.cliente_id,
          ano: ano,
          fase: data.fase,
          estado: data.estado,
          estado_entrega: data.estado_entrega,
          observacoes: data.observacoes || undefined,
        };
        const novoIRS = await createIRS.mutateAsync(createData);
        setCreatedIRSId(novoIRS.id);
        // Se o estado for "Pago", ir para a etapa 4
        if (data.estado === 'Pago') {
          setCurrentStep(4);
          return;
        }
        // Se não for "Pago", fechar o modal
        onClose();
      }
    } catch (error) {
      console.error('Error submitting IRS:', error);
    }
  };

  const handlePrintRecibo = async () => {
    const irsId = isEditing ? irs?.id : createdIRSId;
    if (!irsId) {
      toast({
        title: 'Erro',
        description: 'IRS não encontrado. Por favor, tente novamente.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const response = await api.post(`/irs/${irsId}/recibo`, {}, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 250);
        };
      } else {
        // Fallback: download se não conseguir abrir janela
        const link = document.createElement('a');
        link.href = url;
        link.download = `recibo_irs_${irsId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      toast({
        title: 'Sucesso',
        description: 'Recibo aberto para impressão.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao gerar recibo.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateEmail = async () => {
    if (!emailAddress.trim() || !clienteId) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um endereço de email válido.',
        variant: 'destructive',
      });
      return;
    }

    const irsId = isEditing ? irs?.id : createdIRSId;
    if (!irsId) {
      toast({
        title: 'Erro',
        description: 'IRS não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    const emailAnterior = clienteSelecionado?.email || '';

    setUpdatingEmail(true);
    try {
      await updateClient.mutateAsync({
        id: clienteId.toString(),
        email: emailAddress.trim(),
      });

      // Registrar no histórico do IRS
      await registrarHistorico(
        irsId,
        'alteracao',
        'email',
        emailAnterior || 'Não definido',
        emailAddress.trim(),
        `Email do cliente atualizado`
      );

      toast({
        title: 'Sucesso',
        description: 'Email atualizado com sucesso.',
      });
      // Recarregar dados do cliente após atualização
      // O useClients vai invalidar as queries automaticamente
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao atualizar email.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleUpdateTelefone = async () => {
    if (!telefoneAddress.trim() || !clienteId) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um número de telefone válido.',
        variant: 'destructive',
      });
      return;
    }

    const irsId = isEditing ? irs?.id : createdIRSId;
    if (!irsId) {
      toast({
        title: 'Erro',
        description: 'IRS não encontrado.',
        variant: 'destructive',
      });
      return;
    }

    const telefoneAnterior = clienteSelecionado?.telefone || '';

    setUpdatingTelefone(true);
    try {
      await updateClient.mutateAsync({
        id: clienteId.toString(),
        telefone: telefoneAddress.trim(),
      });

      // Registrar no histórico do IRS
      await registrarHistorico(
        irsId,
        'alteracao',
        'telefone',
        telefoneAnterior || 'Não definido',
        telefoneAddress.trim(),
        `Telefone do cliente atualizado`
      );

      toast({
        title: 'Sucesso',
        description: 'Telefone atualizado com sucesso.',
      });
      // Recarregar dados do cliente após atualização
      // O useClients vai invalidar as queries automaticamente
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao atualizar telefone.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingTelefone(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailAddress.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um endereço de email.',
        variant: 'destructive',
      });
      return;
    }

    const irsId = isEditing ? irs?.id : createdIRSId;
    if (!irsId) return;

    setSendingEmail(true);
    try {
      await api.post(`/irs/${irsId}/enviar-recibo-email`, {
        email: emailAddress.trim(),
      });
      
      toast({
        title: 'Sucesso',
        description: `Recibo enviado com sucesso para ${emailAddress}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.detail || 'Erro ao enviar email.',
        variant: 'destructive',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendWhatsApp = () => {
    const irsId = isEditing ? irs?.id : createdIRSId;
    if (!irsId || !clienteSelecionado) return;

    // Usar telefone do estado ou do cliente
    const telefone = telefoneAddress || clienteSelecionado.telefone;
    if (!telefone || !telefone.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um número de telefone.',
        variant: 'destructive',
      });
      return;
    }

    // Remover espaços e caracteres especiais do telefone
    const telefoneLimpo = telefone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    // Garantir que começa com código do país (assumir +351 para Portugal se não tiver)
    const telefoneFormatado = telefoneLimpo.startsWith('+') ? telefoneLimpo : `+351${telefoneLimpo}`;
    
    // Criar mensagem
    const ano = watch('ano') || new Date().getFullYear();
    const fase = watch('fase');
    const mensagem = encodeURIComponent(
      `Olá! Envio o recibo do IRS ${ano}, Fase ${fase}.`
    );
    
    // Abrir WhatsApp Web/App
    const whatsappUrl = `https://wa.me/${telefoneFormatado}?text=${mensagem}`;
    window.open(whatsappUrl, '_blank');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cliente_id">Cliente *</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  {isEditing ? (
                    <Select value={clienteId?.toString() || ''} disabled={true}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </Select>
                  ) : (
                    <ClientCombobox
                      clients={clientsForCombobox}
                      value={clienteId}
                      onChange={(value) => setValue('cliente_id', value)}
                      isLoading={isClientsLoading}
                    />
                  )}
                </div>
                {!isEditing && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsClientModalOpen(true)}
                    className="flex items-center gap-2 flex-shrink-0 h-10"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Cliente
                  </Button>
                )}
              </div>
              {errors.cliente_id && (
                <p className="text-sm text-red-500">{errors.cliente_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ano">Ano do IRS *</Label>
                <Select
                  value={watch('ano')?.toString() || new Date().getFullYear().toString()}
                  onValueChange={(value) => setValue('ano', parseInt(value))}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {errors.ano && (
                  <p className="text-sm text-red-500">{errors.ano.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fase">Fase *</Label>
                <Select
                  value={watch('fase').toString()}
                  onValueChange={(value) => setValue('fase', value as '1' | '2')}
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Fase 1 - 20€</SelectItem>
                    <SelectItem value="2">Fase 2 - 30€</SelectItem>
                  </SelectContent>
                </Select>
                {errors.fase && (
                  <p className="text-sm text-red-500">{errors.fase.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {clienteId && clienteId > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Agregado Familiar</CardTitle>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://www.portaldasfinancas.gov.pt', '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Portal das Finanças
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <AgregadoFamiliarTab 
                      clienteId={clienteId} 
                      cliente={clienteSelecionado || undefined}
                      irsId={isEditing ? irs?.id : createdIRSId}
                      onRegistrarHistorico={async (acao, campoAlterado, valorAnterior, valorNovo, detalhes) => {
                        const irsId = isEditing ? irs?.id : createdIRSId;
                        if (irsId) {
                          await registrarHistorico(irsId, acao, campoAlterado, valorAnterior, valorNovo, detalhes);
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Selecione um cliente na primeira etapa para ver o agregado familiar.</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado">Pagamento *</Label>
                <Select
                  value={watch('estado')}
                  onValueChange={(value) => setValue('estado', value as 'Por Pagar' | 'Pago' | 'Isento')}
                  disabled={isEditing && irs?.numero_recibo && irs.estado === 'Pago'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Por Pagar">Por Pagar</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Isento">Isento</SelectItem>
                  </SelectContent>
                </Select>
                {errors.estado && (
                  <p className="text-sm text-red-500">{errors.estado.message}</p>
                )}
                {isEditing && irs?.numero_recibo && irs.estado === 'Pago' && (
                  <p className="text-sm text-amber-600">
                    Não é possível alterar o pagamento após o recibo ter sido gerado.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado_entrega">Estado de Entrega</Label>
                <Select
                  value={watch('estado_entrega') || ''}
                  onValueChange={(value) => setValue('estado_entrega', value === '' ? undefined : value as 'Enviado' | 'Levantado Pelo Cliente' | 'Aguarda Documentos' | 'Contencioso Administrativo' | 'Em Análise' | 'Verificado' | 'Concluído')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Enviado">Enviado</SelectItem>
                    <SelectItem value="Levantado Pelo Cliente">Levantado Pelo Cliente</SelectItem>
                    <SelectItem value="Aguarda Documentos">Aguarda Documentos</SelectItem>
                    <SelectItem value="Contencioso Administrativo">Contencioso Administrativo</SelectItem>
                    <SelectItem value="Em Análise">Em Análise</SelectItem>
                    <SelectItem value="Verificado">Verificado</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                {errors.estado_entrega && (
                  <p className="text-sm text-red-500">{errors.estado_entrega.message}</p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="levantar_irs_apos_dia">Levantar IRS a partir do dia</Label>
                <Textarea
                  id="levantar_irs_apos_dia"
                  {...register('levantar_irs_apos_dia')}
                  placeholder="Ex: 15 de maio de 2025"
                  rows={2}
                />
                {errors.levantar_irs_apos_dia && (
                  <p className="text-sm text-red-500">{errors.levantar_irs_apos_dia.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                {...register('observacoes')}
                placeholder="Adicione observações sobre este IRS..."
                rows={4}
              />
              {errors.observacoes && (
                <p className="text-sm text-red-500">{errors.observacoes.message}</p>
              )}
            </div>

          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Recibo do IRS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <Check className="w-4 h-4 inline mr-2" />
                    IRS criado com sucesso! O recibo está disponível para impressão e envio.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Imprimir Recibo */}
                  <Button
                    type="button"
                    variant="outline"
                    className="flex flex-col items-center justify-center h-24 space-y-2"
                    onClick={handlePrintRecibo}
                  >
                    <Printer className="w-6 h-6" />
                    <span className="text-sm">Imprimir Recibo</span>
                  </Button>

                  {/* Enviar por Email */}
                  <div className="flex flex-col space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex flex-col items-center justify-center h-24 space-y-2"
                    >
                      <Mail className="w-6 h-6" />
                      <span className="text-sm">Enviar por Email</span>
                    </Button>
                    <div className="space-y-2">
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="text-sm"
                      />
                      {emailAddress && emailAddress !== clienteSelecionado?.email && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleUpdateEmail}
                          disabled={updatingEmail}
                          className="w-full"
                        >
                          {updatingEmail ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Atualizar Email do Cliente
                        </Button>
                      )}
                      {emailAddress && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSendEmail}
                          disabled={sendingEmail}
                          className="w-full"
                        >
                          {sendingEmail ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Mail className="w-4 h-4 mr-2" />
                          )}
                          Enviar Recibo
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Enviar por WhatsApp */}
                  <div className="flex flex-col space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex flex-col items-center justify-center h-24 space-y-2"
                    >
                      <MessageCircle className="w-6 h-6" />
                      <span className="text-sm">Enviar por WhatsApp</span>
                    </Button>
                    <div className="space-y-2">
                      <Input
                        type="tel"
                        placeholder="Telefone (ex: 912345678)"
                        value={telefoneAddress}
                        onChange={(e) => setTelefoneAddress(e.target.value)}
                        className="text-sm"
                      />
                      {telefoneAddress && telefoneAddress !== clienteSelecionado?.telefone && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleUpdateTelefone}
                          disabled={updatingTelefone}
                          className="w-full"
                        >
                          {updatingTelefone ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Atualizar Telefone do Cliente
                        </Button>
                      )}
                      {telefoneAddress && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSendWhatsApp}
                          className="w-full"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Abrir WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Só fechar se não estiver a submeter
        if (!open && !isSubmitting) {
          onClose();
        }
      }}
    >
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevenir fechamento ao clicar fora durante navegação
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar IRS' : 'Novo IRS'}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? 'Edite os dados do IRS' : 'Preencha os dados para criar um novo IRS'}
          </DialogDescription>
        </DialogHeader>

        {/* Steps Indicator - Estende de ponta a ponta */}
        <div 
          className="flex items-center mb-6" 
          style={{ 
            marginLeft: '-1.5rem', 
            marginRight: '-1.5rem', 
            paddingLeft: '1.5rem', 
            paddingRight: '1.5rem',
            width: 'calc(100% + 3rem)',
          }}
        >
          {STEPS.filter(step => {
            // Mostrar etapa 4 apenas se o estado for "Pago" ou se já estiver na etapa 4 ou se já tiver criado o IRS com estado "Pago"
            if (step.id === 4) {
              const estado = watch('estado');
              return estado === 'Pago' || currentStep === 4 || createdIRSId !== null;
            }
            return true;
          }).map((step, index, filteredSteps) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isLast = index === filteredSteps.length - 1;
            return (
              <div key={step.id} className="flex items-center" style={{ flex: isLast ? '0 1 auto' : '1 1 0%' }}>
                <div className="flex items-center min-w-0">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0 ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : isCompleted
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-gray-100 text-gray-400 border-gray-300'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
                {!isLast && (
                  <div className={`flex-1 h-0.5 mx-2 min-w-[20px] ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} style={{ flex: '1 1 0%' }} />
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {renderStepContent()}

          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePrevious(e);
                    }}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Anterior
                  </Button>
                )}
                {currentStep < 3 ? (
                  <Button 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNext(e);
                    }} 
                    disabled={!validateStep(currentStep)}
                  >
                    Seguinte
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : currentStep === 3 ? (
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    onClick={(e) => {
                      // Garantir que o evento não propaga
                      e.stopPropagation();
                    }}
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isEditing ? 'Atualizar' : 'Criar'}
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    onClick={onClose}
                  >
                    Concluir
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={handleClientCreated}
      />
    </>
  );
};
