import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { Client, IndividualClient, CorporateClient, getEffectiveTipo } from '@/hooks/useClients';
import { useDossies, Dossie } from '@/hooks/useDossies';
import { useContaCorrenteCliente } from '@/hooks/useContaCorrente';
import { DossieModal } from './DossieModal';
import { ClientModal } from './ClientModal';
import { TransacaoModal } from './TransacaoModal';
import { AgregadoFamiliarTab } from '@/components/AgregadoFamiliarTab';
import { ClienteContactosTab } from '@/components/ClienteContactosTab';
import { FiliacaoSection } from '@/components/FiliacaoSection';
import {
  Building,
  Mail,
  Phone,
  Calendar,
  User,
  MapPin,
  FileText,
  Hash,
  Users,
  CreditCard,
  Home,
  Plus,
  Edit,
  Trash2,
  Folder,
  Paperclip,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Loader2,
  Printer,
} from 'lucide-react';
import api from '@/services/api';
import { printRGPD } from '@/utils/printRGPD';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ProcessDetailsModal } from '@/components/modals/ProcessDetailsModal';
import { Process } from '@/hooks/useProcesses';
import type { ContaCorrenteProcesso, TransacaoFinanceira } from '@/types/financeiro';
import { useTransacoes } from '@/hooks/useFinanceiro';

// ── Modal de Movimentos (histórico de transações de um processo) ──

const getTipoBadgeMovimentos = (tipo: string) => {
  switch (tipo) {
    case 'custo': return <Badge className="bg-red-100 text-red-800 text-xs">Custo</Badge>;
    case 'despesa': return <Badge className="bg-red-100 text-red-800 text-xs">Despesa</Badge>;
    case 'pagamento': return <Badge className="bg-green-100 text-green-800 text-xs">Pagamento</Badge>;
    case 'honorario': return <Badge className="bg-green-100 text-green-800 text-xs">Honorário</Badge>;
    case 'reembolso': return <Badge className="bg-blue-100 text-blue-800 text-xs">Reembolso</Badge>;
    default: return <Badge variant="outline" className="text-xs">{tipo}</Badge>;
  }
};

const formatCurrencyStatic = (value: any) => {
  const n = typeof value === 'number' ? value : Number(value) || 0;
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n);
};

interface MovimentosModalProps {
  isOpen: boolean;
  onClose: () => void;
  processo: ContaCorrenteProcesso | null;
  clienteId: number;
}

const MovimentosModal: React.FC<MovimentosModalProps> = ({ isOpen, onClose, processo, clienteId }) => {
  const params = !processo ? {} : processo.processo_id === 0
    ? { cliente_id: clienteId, sem_processo: true }
    : { processo_id: processo.processo_id, cliente_id: clienteId };

  const { transacoes, isLoading } = useTransacoes(isOpen && processo ? params : {});

  if (!processo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Movimentos — {processo.processo_titulo}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Histórico de movimentos do processo {processo.processo_titulo}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
            <span className="text-xs font-medium text-red-600 flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 shrink-0" />
              Custos
            </span>
            <span className="text-sm font-bold text-red-600">{formatCurrencyStatic(processo.total_custos)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 shrink-0" />
              Pagam.
            </span>
            <span className="text-sm font-bold text-green-600">{formatCurrencyStatic(processo.total_pagamentos)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
            <span className="text-xs font-medium text-blue-600 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 shrink-0" />
              Reemb.
            </span>
            <span className="text-sm font-bold text-blue-600">{formatCurrencyStatic(processo.total_reembolsos)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 shrink-0" />
              Saldo
            </span>
            <span className="text-sm font-bold">{formatCurrencyStatic(processo.saldo)}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            A carregar movimentos...
          </div>
        ) : transacoes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Sem movimentos registados.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transacoes.map((t: TransacaoFinanceira) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{t.data ? new Date(t.data).toLocaleDateString('pt-PT') : '-'}</TableCell>
                    <TableCell>{getTipoBadgeMovimentos(t.tipo)}</TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrencyStatic(t.valor)}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{t.descricao || '-'}</TableCell>
                    <TableCell>
                      {t.tarefa_id ? <Badge variant="outline" className="text-xs">Tarefa</Badge> : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ── ClientDetailsModal ──

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

// Função para traduzir estado civil de inglês para português
const getEstadoCivilLabel = (estadoCivil?: string): string => {
  if (!estadoCivil) return '-';
  const traducoes: Record<string, string> = {
    'single': 'Solteiro(a)',
    'married': 'Casado(a)',
    'uniao_facto': 'União de Facto',
    'divorced': 'Divorciado(a)',
    'separated': 'Separado(a)',
    'separacao_facto': 'Separação de Facto',
    'widowed': 'Viúvo(a)',
  };
  return traducoes[estadoCivil.toLowerCase()] || estadoCivil;
};

// Campo de detalhe uniforme
const DetailField = ({ label, value, valueClassName, className }: { label: string; value: React.ReactNode; valueClassName?: string; className?: string }) => (
  <div className={`space-y-1 ${className ?? ''}`}>
    <span className="text-sm font-medium text-muted-foreground">{label}</span>
    <p className={`text-sm ${valueClassName ?? ''}`}>{value ?? '-'}</p>
  </div>
);

// Secção de morada uniforme
const MoradaSection = ({ morada, codigo_postal, localidade, concelho, distrito, pais }: { morada?: string; codigo_postal?: string; localidade?: string; concelho?: string; distrito?: string; pais?: string }) => {
  const temAlgo = morada || codigo_postal || localidade || concelho || distrito || pais;
  return (
    <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
      {temAlgo ? (
        <>
          {morada && <p className="text-sm">{morada}</p>}
          {(codigo_postal || localidade) && <p className="text-sm">{[codigo_postal, localidade].filter(Boolean).join(' ')}</p>}
          {(concelho || distrito || pais) && <p className="text-sm text-muted-foreground">{[concelho, distrito, pais].filter(Boolean).join(', ')}</p>}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Sem morada registada</p>
      )}
    </div>
  );
};

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  isOpen,
  onClose,
  client,
}) => {
  const entidadeId = client?.id != null ? Number(client.id) : undefined;

  // Buscar dados completos do cliente (inclui representantes)
  const { data: clienteCompleto } = useQuery({
    queryKey: ['client-detail', entidadeId],
    queryFn: async () => {
      const res = await api.get(`/clientes/${entidadeId}`);
      return res.data;
    },
    enabled: isOpen && !!entidadeId,
  });

  const { dossie, isLoading: loadingDossie, createDossie, updateDossie } = useDossies(entidadeId);
  const [isDossieModalOpen, setIsDossieModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [processDetailsOpen, setProcessDetailsOpen] = React.useState(false);
  const [selectedProcessForDetails, setSelectedProcessForDetails] = React.useState<Process | null>(null);
  const [ccDocs, setCcDocs] = React.useState<{ id: number; nome_original: string; nome_label?: string; tipo: string }[]>([]);
  const [loadingCcDocs, setLoadingCcDocs] = React.useState(false);
  const [uploadingCc, setUploadingCc] = React.useState(false);
  const [uploadingAnexo, setUploadingAnexo] = React.useState(false);
  const [anexoLabel, setAnexoLabel] = React.useState('');
  const [transacaoModalOpen, setTransacaoModalOpen] = useState(false);
  const [movimentosProcesso, setMovimentosProcesso] = useState<ContaCorrenteProcesso | null>(null);
  const { toast } = useToast();
  const { data: contaCorrente, isLoading: loadingContaCorrente } = useContaCorrenteCliente(isOpen ? (entidadeId ?? null) : null);

  const handleOpenProcess = React.useCallback((processId: number) => {
    api.get<Process>(`/processos/${processId}`)
      .then((res) => {
        setSelectedProcessForDetails(res.data);
        setProcessDetailsOpen(true);
      })
      .catch(() => {
        toast({ title: 'Erro', description: 'Não foi possível carregar o processo.', variant: 'destructive' });
      });
  }, [toast]);

  const fetchCcDocs = React.useCallback(async () => {
    if (!entidadeId) return;
    setLoadingCcDocs(true);
    try {
      const res = await api.get(`cliente-documentos/cliente/${entidadeId}`);
      setCcDocs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCcDocs([]);
    } finally {
      setLoadingCcDocs(false);
    }
  }, [entidadeId]);

  React.useEffect(() => {
    if (isOpen && entidadeId) fetchCcDocs();
  }, [isOpen, entidadeId, fetchCcDocs]);

  const renderDocList = (docs: typeof ccDocs) => (
    <div className="rounded-lg border bg-muted/50 p-4">
      {loadingCcDocs ? (
        <p className="text-sm text-muted-foreground">A carregar...</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum anexo</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-sm">
              <a href={`/api/cliente-documentos/download/${d.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1">
                {d.nome_label ? <><span className="font-medium">{d.nome_label}</span> <span className="text-muted-foreground">({d.nome_original})</span></> : d.nome_original}
              </a>
              <Button
                size="xs"
                variant="ghost"
                className="text-red-600 shrink-0"
                onClick={async () => {
                  if (!confirm('Apagar este documento?')) return;
                  try {
                    await api.delete(`cliente-documentos/${d.id}`);
                    toast({ title: 'Sucesso', description: 'Documento removido.' });
                    fetchCcDocs();
                  } catch {
                    toast({ title: 'Erro', description: 'Erro ao remover.', variant: 'destructive' });
                  }
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const uploadDoc = async (file: File, tipo: string, label?: string) => {
    if (!entidadeId) return;
    const form = new FormData();
    form.append('file', file);
    form.append('tipo', tipo);
    if (label) form.append('nome_label', label);
    await api.post(`cliente-documentos/upload-cliente/${entidadeId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    fetchCcDocs();
  };

  const renderDocUploadSection = (titulo: string, tipo: string) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{titulo}</span>
        <Input
          type="file"
          accept="image/*,.pdf"
          className="text-xs w-auto max-w-[200px] h-8"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              setUploadingCc(true);
              await uploadDoc(file, tipo);
              toast({ title: 'Sucesso', description: 'Documento enviado.' });
            } catch (err: unknown) {
              const ex = err as { response?: { data?: { detail?: string } } };
              toast({ title: 'Erro', description: ex?.response?.data?.detail || 'Erro ao enviar.', variant: 'destructive' });
            } finally {
              setUploadingCc(false);
              e.target.value = '';
            }
          }}
          disabled={uploadingCc}
        />
      </div>
      {renderDocList(ccDocs.filter(d => d.tipo === tipo))}
    </div>
  );

  const renderDocumentsTab = (isEmpresa: boolean) => (
    <TabsContent value="documents" className="mt-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Paperclip className="h-5 w-5" />
            Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* IBAN — sempre texto */}
          <DetailField label="IBAN" value={client.iban} />

          {/* Certidão Permanente — texto para singular, upload para empresa */}
          {isEmpresa
            ? renderDocUploadSection('Certidão Permanente', 'certidao')
            : (client as any).certidao_permanente
              ? <DetailField label="Certidão Permanente" value={(client as any).certidao_permanente} />
              : null
          }

          {/* Cópia do Cartão de Cidadão */}
          {renderDocUploadSection('Cópia do Cartão de Cidadão', 'cc')}

          {/* Outros Anexos */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Outros Anexos</span>
            <div className="flex gap-2 items-end">
              <Input
                value={anexoLabel}
                onChange={(e) => setAnexoLabel(e.target.value)}
                placeholder="Nome do documento..."
                className="text-sm h-8 flex-1"
              />
              <Input
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                className="text-xs w-auto max-w-[200px] h-8"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setUploadingAnexo(true);
                    await uploadDoc(file, 'anexo', anexoLabel.trim() || undefined);
                    toast({ title: 'Sucesso', description: 'Anexo enviado.' });
                    setAnexoLabel('');
                  } catch (err: unknown) {
                    const ex = err as { response?: { data?: { detail?: string } } };
                    toast({ title: 'Erro', description: ex?.response?.data?.detail || 'Erro ao enviar.', variant: 'destructive' });
                  } finally {
                    setUploadingAnexo(false);
                    e.target.value = '';
                  }
                }}
                disabled={uploadingAnexo}
              />
            </div>
            {renderDocList(ccDocs.filter(d => d.tipo === 'anexo'))}
          </div>

          {/* Observações */}
          {client.observacoes && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">Observações</span>
              <p className="text-sm whitespace-pre-wrap rounded-lg border bg-muted/50 p-3">{client.observacoes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );

  if (!client) return null;

  // Usar dados completos (com representantes) quando disponíveis
  const effectiveClient = clienteCompleto ? { ...client, ...clienteCompleto } as Client : client;

  const formatCurrency = (value: any) => {
    const n = typeof value === 'number' ? value : Number(value) || 0;
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n);
  };

  const renderContaCorrenteTab = () => (
    <TabsContent value="conta-corrente" className="mt-6">
      <div className="space-y-4">
        {loadingContaCorrente ? (
          <div className="text-center py-8 text-muted-foreground">A carregar conta corrente...</div>
        ) : !contaCorrente ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Sem dados financeiros para esta entidade.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                <span className="text-xs sm:text-sm font-medium text-red-600 flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 shrink-0" />
                  Custos
                </span>
                <span className="text-lg font-bold text-red-600">{formatCurrency(contaCorrente.total_custos)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                <span className="text-xs sm:text-sm font-medium text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 shrink-0" />
                  Pagamentos
                </span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(contaCorrente.total_pagamentos)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                <span className="text-xs sm:text-sm font-medium text-blue-600 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 shrink-0" />
                  Reembolsos
                </span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(contaCorrente.total_reembolsos)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4 shrink-0" />
                  Saldo
                </span>
                <span className="text-lg font-bold">{formatCurrency(contaCorrente.saldo_total)}</span>
              </div>
            </div>

            {contaCorrente.processos.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Processos</CardTitle>
                    <Button size="sm" onClick={() => setTransacaoModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Nova Transacao (Conta Geral)
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Processo</TableHead>
                        <TableHead>Custos</TableHead>
                        <TableHead>Pagamentos</TableHead>
                        <TableHead>Reembolsos</TableHead>
                        <TableHead>Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contaCorrente.processos.map((p: ContaCorrenteProcesso) => (
                        <TableRow
                          key={p.processo_id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setMovimentosProcesso(p)}
                        >
                          <TableCell className="font-medium">
                            {p.processo_id === 0 ? (
                              <span className="italic text-muted-foreground">{p.processo_titulo}</span>
                            ) : (
                              p.processo_titulo
                            )}
                          </TableCell>
                          <TableCell className="text-red-600">{formatCurrency(p.total_custos)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(p.total_pagamentos)}</TableCell>
                          <TableCell className="text-blue-600">{formatCurrency(p.total_reembolsos)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(p.saldo)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {contaCorrente.processos.length === 0 && (
              <div className="text-center py-4">
                <Button size="sm" onClick={() => setTransacaoModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Transacao (Conta Geral)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </TabsContent>
  );

  const renderIndividualClient = (client: IndividualClient) => (
    <Tabs defaultValue="identification" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="identification">Identificação</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
        <TabsTrigger value="informacao">Informação</TabsTrigger>
        <TabsTrigger value="irs">Dados do IRS</TabsTrigger>
        <TabsTrigger value="conta-corrente">Conta Corrente</TabsTrigger>
        <TabsTrigger value="dossies">Arquivo</TabsTrigger>
      </TabsList>

      <TabsContent value="identification" className="mt-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-5 w-5" />
                Dados de Identificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <DetailField label="Nome completo" value={client.nome} valueClassName="font-semibold" />
                <DetailField label="Designação" value={(client as any).designacao} />
                <DetailField label="NIF" value={client.nif} />
                <DetailField label="Cartão de Cidadão" value={client.num_cc} />
                <DetailField label="Validade CC" value={client.validade_cc ? new Date(client.validade_cc).toLocaleDateString('pt-PT') : null} />
                <DetailField label="Data de Nascimento" value={client.data_nascimento ? new Date(client.data_nascimento).toLocaleDateString('pt-PT') : null} />
                <DetailField label="Nacionalidade" value={client.nacionalidade} />
                <DetailField label="Estado Civil" value={getEstadoCivilLabel(client.estado_civil)} />
                <DetailField label="Profissão" value={client.profissao} />
                <DetailField label="Incapacidade" value={client.incapacidade != null ? `${client.incapacidade}%` : null} />
                <DetailField label="Nº Segurança Social" value={client.num_ss} />
                <DetailField label="Nº Utente de Saúde" value={client.num_sns} />
                <DetailField label="Nº Identificação Civil" value={client.num_ident_civil} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5" />
                Morada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MoradaSection morada={client.morada} codigo_postal={client.codigo_postal} localidade={client.localidade} concelho={client.concelho} distrito={client.distrito} pais={client.pais} />
            </CardContent>
          </Card>

          <ClienteContactosTab clienteId={client.id} uniformCard />

          <FiliacaoSection clienteId={client.id} />
        </div>
      </TabsContent>

      {renderDocumentsTab(false)}

      <TabsContent value="informacao" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5" />
              Informações de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">NIF</span>
                  <p className="font-mono text-sm">{client.nif || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Senha das Finanças</span>
                  <p className="font-mono text-sm">{client.senha_financas || 'Não definida'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Nº Segurança Social</span>
                  <p className="font-mono text-sm">{client.num_ss || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Senha da Segurança Social</span>
                  <p className="font-mono text-sm">{client.senha_ss || 'Não definida'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="irs" className="mt-6">
        <AgregadoFamiliarTab clienteId={client.id} cliente={client} />
      </TabsContent>

      {renderContaCorrenteTab()}

      <TabsContent value="dossies" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Folder className="h-5 w-5" />
                  Arquivo
                </CardTitle>
                {dossie ? (
                  <Button size="sm" onClick={() => setIsDossieModalOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Arquivo
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setIsDossieModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Arquivo
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingDossie ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando arquivo...
                </div>
              ) : !dossie ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Esta entidade ainda não tem arquivo.</p>
                  <p className="text-sm mt-2">Clique em &quot;Criar Arquivo&quot; para criar um arquivo e associar processos a esta entidade.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Dados do arquivo */}
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Dados do arquivo
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <DetailField label="ID do arquivo" value={<span className="font-mono font-semibold">{dossie.id}</span>} />
                      {dossie.numero != null && dossie.numero !== '' && <DetailField label="Número" value={dossie.numero} />}
                      <DetailField label="Criado em" value={dossie.criado_em ? new Date(dossie.criado_em).toLocaleDateString('pt-PT') : '-'} />
                      {(dossie as any).atualizado_em && <DetailField label="Atualizado em" value={new Date((dossie as any).atualizado_em).toLocaleDateString('pt-PT')} />}
                      <DetailField label="Descrição" value={dossie.descricao || '—'} className="sm:col-span-2" />
                    </div>
                  </div>
                  {/* Processos do arquivo da entidade */}
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Processos do arquivo ({(dossie.processos as any[])?.length ?? 0})
                    </h4>
                    {(dossie.processos as any[])?.length > 0 ? (
                      <div className="space-y-2">
                        {(dossie.processos as any[]).map((proc: { id: number; titulo?: string; descricao?: string; estado?: string; criado_em?: string }) => (
                          <div
                            key={proc.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleOpenProcess(proc.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleOpenProcess(proc.id)}
                            className="flex items-start justify-between gap-2 rounded-lg border bg-background p-3 text-left hover:bg-muted/70 hover:shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{proc.titulo || `Processo ${proc.id}`}</p>
                              {proc.descricao && <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{proc.descricao}</p>}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {proc.estado && <Badge variant="outline">{proc.estado}</Badge>}
                                {proc.criado_em && <span className="text-xs text-muted-foreground">{new Date(proc.criado_em).toLocaleDateString('pt-PT')}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">Nenhum processo associado a este arquivo.</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
    </Tabs>
  );

  const renderCorporateClient = (client: CorporateClient) => (
    <Tabs defaultValue="identification" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="identification">Identificação</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
        <TabsTrigger value="informacao">Informação</TabsTrigger>
        <TabsTrigger value="irs">Dados do IRS</TabsTrigger>
        <TabsTrigger value="conta-corrente">Conta Corrente</TabsTrigger>
        <TabsTrigger value="dossies">Arquivo</TabsTrigger>
      </TabsList>

      <TabsContent value="identification" className="mt-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building className="h-5 w-5" />
                Dados da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <DetailField label="Nome da empresa" value={client.nome_empresa} valueClassName="font-semibold" />
                <DetailField label="Designação" value={(client as any).designacao} />
                <DetailField label="NIF" value={client.nif_empresa} />
                <DetailField label="Nº Registo Comercial" value={client.registo_comercial} />
                <DetailField label="Forma Jurídica" value={client.forma_juridica} />
                <DetailField label="Data de Constituição" value={client.data_constituicao ? new Date(client.data_constituicao).toLocaleDateString('pt-PT') : null} />
                <DetailField label="CAE Principal" value={client.cae} />
                <DetailField label="Capital Social" value={client.capital_social ? `${client.capital_social}` : null} />
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2 text-sm">Representantes Legais</h4>
                {client.representantes && client.representantes.length > 0 ? (
                  <div className="rounded-lg border bg-muted/50 divide-y">
                    {client.representantes.map((rep) => (
                      <div key={rep.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm">
                        <span><span className="font-semibold text-muted-foreground">Nome</span> {rep.nome || '-'}</span>
                        {rep.cargo && <span><span className="font-semibold text-muted-foreground">Cargo</span> {rep.cargo}</span>}
                        {rep.nif && <span><span className="font-semibold text-muted-foreground">NIF</span> {rep.nif}</span>}
                        {rep.email && <span><span className="font-semibold text-muted-foreground">Email</span> {rep.email}</span>}
                        {rep.telemovel && <span><span className="font-semibold text-muted-foreground">Tel.</span> {rep.telemovel}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum representante legal registado.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Home className="h-5 w-5" />
                Morada da Sede
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MoradaSection morada={client.morada} codigo_postal={client.codigo_postal} localidade={client.localidade} concelho={client.concelho} distrito={client.distrito} pais={client.pais} />
            </CardContent>
          </Card>

          <ClienteContactosTab clienteId={client.id} uniformCard />

          <FiliacaoSection clienteId={client.id} />

        </div>
      </TabsContent>

      {renderDocumentsTab(true)}

      <TabsContent value="informacao" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5" />
              Informações de Acesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">NIF</span>
                  <p className="font-mono text-sm">{client.nif_empresa || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Senha das Finanças</span>
                  <p className="font-mono text-sm">{client.senha_financas || 'Não definida'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Nº Segurança Social</span>
                  <p className="font-mono text-sm">{client.num_ss || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium text-muted-foreground">Senha da Segurança Social</span>
                  <p className="font-mono text-sm">{client.senha_ss || 'Não definida'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="irs" className="mt-6">
        <AgregadoFamiliarTab clienteId={client.id} cliente={client} />
      </TabsContent>

      {renderContaCorrenteTab()}

      <TabsContent value="dossies" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Folder className="h-5 w-5" />
                  Arquivo
                </CardTitle>
                {dossie ? (
                  <Button size="sm" onClick={() => setIsDossieModalOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Arquivo
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setIsDossieModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Arquivo
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingDossie ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando arquivo...
                </div>
              ) : !dossie ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Esta entidade ainda não tem arquivo.</p>
                  <p className="text-sm mt-2">Clique em &quot;Criar Arquivo&quot; para criar um arquivo e associar processos a esta entidade.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Dados do arquivo */}
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Dados do arquivo
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <DetailField label="ID do arquivo" value={<span className="font-mono font-semibold">{dossie.id}</span>} />
                      {dossie.numero != null && dossie.numero !== '' && <DetailField label="Número" value={dossie.numero} />}
                      <DetailField label="Criado em" value={dossie.criado_em ? new Date(dossie.criado_em).toLocaleDateString('pt-PT') : '-'} />
                      {(dossie as any).atualizado_em && <DetailField label="Atualizado em" value={new Date((dossie as any).atualizado_em).toLocaleDateString('pt-PT')} />}
                      <DetailField label="Descrição" value={dossie.descricao || '—'} className="sm:col-span-2" />
                    </div>
                  </div>
                  {/* Processos do arquivo da entidade */}
                  <div className="rounded-lg border bg-muted/50 p-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Processos do arquivo ({(dossie.processos as any[])?.length ?? 0})
                    </h4>
                    {(dossie.processos as any[])?.length > 0 ? (
                      <div className="space-y-2">
                        {(dossie.processos as any[]).map((proc: { id: number; titulo?: string; descricao?: string; estado?: string; criado_em?: string }) => (
                          <div
                            key={proc.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleOpenProcess(proc.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleOpenProcess(proc.id)}
                            className="flex items-start justify-between gap-2 rounded-lg border bg-background p-3 text-left hover:bg-muted/70 hover:shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{proc.titulo || `Processo ${proc.id}`}</p>
                              {proc.descricao && <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{proc.descricao}</p>}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {proc.estado && <Badge variant="outline">{proc.estado}</Badge>}
                                {proc.criado_em && <span className="text-xs text-muted-foreground">{new Date(proc.criado_em).toLocaleDateString('pt-PT')}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">Nenhum processo associado a este arquivo.</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
    </Tabs>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogDescription className="sr-only">
            Detalhes do cliente {getEffectiveTipo(client) === 'singular' ? (client as any).nome : (client as any).nome_empresa}
          </DialogDescription>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              {getEffectiveTipo(client) === 'singular' ? (
                <>
                  <User className="h-6 w-6 text-blue-600" />
                  <span>Detalhes do Cliente - Pessoa Singular</span>
                </>
              ) : (
                <>
                  <Building className="h-6 w-6 text-green-600" />
                  <span>Detalhes do Cliente - Pessoa Coletiva</span>
                </>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => printRGPD(client)}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                RGPD
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <DetailField label="Nome" value={getEffectiveTipo(client) === 'singular' ? (client as any).nome : (client as any).nome_empresa} valueClassName="font-semibold" />
              <DetailField label="Nº Cliente" value={<span className="font-mono">{client.id}</span>} />
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <div>
                  <Badge className={(client.ativo !== false) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {(client.ativo !== false) ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              <DetailField label="Data de criação" value={(client as any).criado_em ? new Date((client as any).criado_em).toLocaleDateString('pt-PT') : null} />
            </div>
          </div>

          {/* Client Type Specific Content */}
          {getEffectiveTipo(effectiveClient) === 'singular'
            ? renderIndividualClient(effectiveClient as IndividualClient)
            : renderCorporateClient(effectiveClient as CorporateClient)
          }

          {client.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Hash className="h-5 w-5" />
                  Notas Internas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm whitespace-pre-wrap">{client.internalNotes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>

      {client && (
        <DossieModal
          isOpen={isDossieModalOpen}
          onClose={() => setIsDossieModalOpen(false)}
          dossie={dossie}
          entidadeId={entidadeId}
        />
      )}
      <ClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        client={client}
        onSuccess={() => {
          setIsEditModalOpen(false);
          // Recarregar os dados do cliente após edição
          window.location.reload();
        }}
      />
      <ProcessDetailsModal
        isOpen={processDetailsOpen}
        onClose={() => { setProcessDetailsOpen(false); setSelectedProcessForDetails(null); }}
        process={selectedProcessForDetails}
      />
      {entidadeId && (
        <TransacaoModal
          isOpen={transacaoModalOpen}
          onClose={() => setTransacaoModalOpen(false)}
          clienteId={entidadeId}
        />
      )}
      {entidadeId && movimentosProcesso && (
        <MovimentosModal
          isOpen={true}
          onClose={() => setMovimentosProcesso(null)}
          processo={movimentosProcesso}
          clienteId={entidadeId}
        />
      )}
    </Dialog>
  );
};