import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useIRS, IRS as IRSType, IRSCreate, IRSUpdate } from '@/hooks/useIRS';
import { Client, useClients } from '@/hooks/useClients';
import { Loader2, Plus, ExternalLink } from 'lucide-react';
import { ClientCombobox } from '@/components/ui/clientcombobox';
import { ClientModal } from './ClientModal';
import { useAgregadoFamiliar } from '@/hooks/useAgregadoFamiliar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const irsSchema = z.object({
  cliente_id: z.number().min(1, 'Selecione um cliente'),
  fase: z.enum(['1', '2']).transform(val => parseInt(val)),
  estado: z.enum(['Por Pagar', 'Pago', 'Isento']).default('Por Pagar'),
  estado_entrega: z.enum(['Enviado', 'Levantado Pelo Cliente']).optional(),
  levantar_irs_apos_dia: z.string().optional(),
});

type IRSFormData = z.infer<typeof irsSchema>;

interface IRSModalProps {
  irs?: IRSType | null;
  clients: Client[];
  isOpen: boolean;
  onClose: () => void;
}

export const IRSModal: React.FC<IRSModalProps> = ({ irs, clients, isOpen, onClose }) => {
  const { createIRS, updateIRS } = useIRS();
  const { clients: allClients, isLoading: isClientsLoading } = useClients();
  const isEditing = !!irs;
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  // Preparar clientes para o ClientCombobox (inclui campos de NIF para pesquisa)
  // Usar allClients em vez de clients para ter sempre a lista atualizada
  const clientsForCombobox = (allClients || clients).map((client) => {
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
    };
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
          fase: irs.fase.toString() as '1' | '2',
          estado: irs.estado,
          estado_entrega: irs.estado_entrega,
          levantar_irs_apos_dia: irs.levantar_irs_apos_dia || '',
        }
      : {
          cliente_id: 0,
          fase: '1' as '1' | '2',
          estado: 'Por Pagar',
          estado_entrega: undefined,
          levantar_irs_apos_dia: '',
        },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (irs) {
        reset({
          cliente_id: irs.cliente_id,
          fase: irs.fase.toString() as '1' | '2',
          estado: irs.estado,
          estado_entrega: irs.estado_entrega,
          levantar_irs_apos_dia: irs.levantar_irs_apos_dia || '',
        });
      } else {
        reset({
          cliente_id: 0,
          fase: '1' as '1' | '2',
          estado: 'Por Pagar',
          estado_entrega: undefined,
          levantar_irs_apos_dia: '',
        });
      }
    }
  }, [isOpen, irs, reset]);

  const clienteId = watch('cliente_id');
  const { agregado, isLoading: isLoadingAgregado } = useAgregadoFamiliar(clienteId && clienteId > 0 ? clienteId : undefined);
  
  // Obter dados do cliente selecionado
  const clienteSelecionado = clienteId ? (allClients || clients).find(c => {
    const cId = typeof c.id === 'string' ? parseInt(c.id, 10) : c.id;
    return cId === clienteId;
  }) : null;

  const handleClientCreated = (createdClient: Client) => {
    if (createdClient?.id) {
      const newId = typeof createdClient.id === 'string' ? parseInt(createdClient.id, 10) : createdClient.id;
      if (!Number.isNaN(newId)) {
        setValue('cliente_id', newId);
      }
    }
    setIsClientModalOpen(false);
  };

  const onSubmit = async (data: IRSFormData) => {
    try {
      if (isEditing && irs) {
        // Validar: não permitir alterar estado de "Pago" para "Por Pagar" se já tem recibo
        if (irs.numero_recibo && irs.estado === 'Pago' && data.estado === 'Por Pagar') {
          alert('Não é possível alterar o pagamento para "Por Pagar" após o recibo ter sido gerado.');
          return;
        }
        
        const updateData: IRSUpdate = {
          fase: data.fase,
          estado: data.estado,
          estado_entrega: data.estado_entrega,
          levantar_irs_apos_dia: data.levantar_irs_apos_dia || undefined,
        };
        await updateIRS.mutateAsync({ id: irs.id, data: updateData });
      } else {
        // Ao criar, sempre usa o ano atual
        const anoAtual = new Date().getFullYear();
        const createData: IRSCreate = {
          cliente_id: data.cliente_id,
          ano: anoAtual,
          fase: data.fase,
          estado: data.estado,
          estado_entrega: data.estado_entrega,
        };
        await createIRS.mutateAsync(createData);
      }
      onClose();
    } catch (error) {
      console.error('Error submitting IRS:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar IRS' : 'Novo IRS'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="cliente_id">Cliente *</Label>
              {!isEditing && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsClientModalOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Novo Cliente
                </Button>
              )}
            </div>
            {isEditing ? (
              <Select
                value={clienteId?.toString() || ''}
                disabled={true}
              >
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
            {errors.cliente_id && (
              <p className="text-sm text-red-500">{errors.cliente_id.message}</p>
            )}
          </div>

          {/* Agregado Familiar - Mostrar quando cliente é selecionado e não está em edição */}
          {!isEditing && clienteId && clienteId > 0 && (
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
                {isLoadingAgregado ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>NIF</TableHead>
                        <TableHead>Password Finanças</TableHead>
                        <TableHead>Relação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Linha do Titular */}
                      {clienteSelecionado && (
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">
                            {(clienteSelecionado.tipo === 'singular' || !clienteSelecionado.tipo)
                              ? (clienteSelecionado as any).nome || `Cliente #${clienteSelecionado.id}`
                              : (clienteSelecionado as any).nome_empresa || `Cliente #${clienteSelecionado.id}`}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {(clienteSelecionado.tipo === 'singular' || !clienteSelecionado.tipo)
                                ? (clienteSelecionado as any).nif || '-'
                                : (clienteSelecionado as any).nif_empresa || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {(clienteSelecionado as any).senha_financas || 'Não definida'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-blue-600">Titular</Badge>
                          </TableCell>
                        </TableRow>
                      )}
                      {/* Membros do Agregado */}
                      {agregado.map((relacao) => {
                        const tipo = relacao.cliente_relacionado?.tipo || 'singular';
                        const nome = tipo === 'singular'
                          ? relacao.cliente_relacionado?.nome
                          : relacao.cliente_relacionado?.nome_empresa;
                        const nif = tipo === 'singular'
                          ? relacao.cliente_relacionado?.nif
                          : relacao.cliente_relacionado?.nif_empresa;
                        const senhaFinancas = relacao.cliente_relacionado?.senha_financas || 'Não definida';
                        const tipoRelacaoLabels: Record<string, string> = {
                          esposo: 'Esposo',
                          esposa: 'Esposa',
                          filho: 'Filho',
                          filha: 'Filha',
                          pai: 'Pai',
                          mae: 'Mãe',
                        };
                        
                        return (
                          <TableRow key={relacao.id}>
                            <TableCell className="font-medium">{nome || `Cliente #${relacao.cliente_relacionado_id}`}</TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">{nif || '-'}</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">{senhaFinancas}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{tipoRelacaoLabels[relacao.tipo_relacao] || relacao.tipo_relacao}</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {agregado.length === 0 && !clienteSelecionado && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Nenhum membro no agregado familiar.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="estado_entrega">Estado</Label>
              <Select
                value={watch('estado_entrega') || ''}
                onValueChange={(value) => setValue('estado_entrega', value === '' ? undefined : value as 'Enviado' | 'Levantado Pelo Cliente')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enviado">Enviado</SelectItem>
                  <SelectItem value="Levantado Pelo Cliente">Levantado Pelo Cliente</SelectItem>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSuccess={handleClientCreated}
      />
    </Dialog>
  );
};

