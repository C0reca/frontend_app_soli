import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Client, IndividualClient, CorporateClient, getEffectiveTipo } from '@/hooks/useClients';
import { useDossies, Dossie } from '@/hooks/useDossies';
import { DossieModal } from './DossieModal';
import { ClientModal } from './ClientModal';
import { AgregadoFamiliarTab } from '@/components/AgregadoFamiliarTab';
import { ClienteContactosTab } from '@/components/ClienteContactosTab';
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
  Paperclip
} from 'lucide-react';
import api from '@/services/api';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ProcessDetailsModal } from '@/components/modals/ProcessDetailsModal';
import { Process } from '@/hooks/useProcesses';

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
const MoradaSection = ({ morada, codigo_postal, localidade, distrito, pais }: { morada?: string; codigo_postal?: string; localidade?: string; distrito?: string; pais?: string }) => {
  const temAlgo = morada || codigo_postal || localidade || distrito || pais;
  return (
    <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
      {temAlgo ? (
        <>
          {morada && <p className="text-sm">{morada}</p>}
          {(codigo_postal || localidade) && <p className="text-sm">{[codigo_postal, localidade].filter(Boolean).join(' ')}</p>}
          {(distrito || pais) && <p className="text-sm text-muted-foreground">{[distrito, pais].filter(Boolean).join(', ')}</p>}
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
  const { dossie, isLoading: loadingDossie, createDossie, updateDossie } = useDossies(entidadeId);
  const [isDossieModalOpen, setIsDossieModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [processDetailsOpen, setProcessDetailsOpen] = React.useState(false);
  const [selectedProcessForDetails, setSelectedProcessForDetails] = React.useState<Process | null>(null);
  const [ccDocs, setCcDocs] = React.useState<{ id: number; nome_original: string }[]>([]);
  const [loadingCcDocs, setLoadingCcDocs] = React.useState(false);
  const [uploadingCc, setUploadingCc] = React.useState(false);
  const { toast } = useToast();

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

  if (!client) return null;

  const renderIndividualClient = (client: IndividualClient) => (
    <Tabs defaultValue="identification" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="identification">Identificação</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
        <TabsTrigger value="irs">IRS</TabsTrigger>
        <TabsTrigger value="informacao">Informação</TabsTrigger>
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
                <DetailField label="Email" value={client.email} />
                <DetailField label="Telefone" value={client.telefone} />
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
              <MoradaSection morada={client.morada} codigo_postal={client.codigo_postal} localidade={client.localidade} distrito={client.distrito} pais={client.pais} />
            </CardContent>
          </Card>

          <ClienteContactosTab clienteId={client.id} uniformCard />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="h-5 w-5" />
                Cópia do Cartão de Cidadão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !entidadeId) return;
                    try {
                      setUploadingCc(true);
                      const form = new FormData();
                      form.append('file', file);
                      await api.post(`cliente-documentos/upload-cliente/${entidadeId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
                      toast({ title: 'Sucesso', description: 'Documento enviado com sucesso.' });
                      fetchCcDocs();
                    } catch (err: unknown) {
                      const ex = err as { response?: { data?: { detail?: string } } };
                      toast({ title: 'Erro', description: ex?.response?.data?.detail || 'Erro ao enviar documento.', variant: 'destructive' });
                    } finally {
                      setUploadingCc(false);
                      e.target.value = '';
                    }
                  }}
                  disabled={uploadingCc}
                  className="text-sm"
                />
                <div className="rounded-lg border bg-muted/50 p-4">
                {loadingCcDocs ? (
                  <p className="text-sm text-muted-foreground">A carregar...</p>
                ) : ccDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum anexo</p>
                ) : (
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {ccDocs.map((d) => (
                      <li key={d.id} className="flex items-center gap-2">
                        <a href={`/api/cliente-documentos/download/${d.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1">
                          {d.nome_original}
                        </a>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="text-red-600"
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
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Documentos e Outros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <DetailField label="IBAN" value={client.iban} />
              {(client as any).certidao_permanente && <DetailField label="Certidão Permanente" value={(client as any).certidao_permanente} />}
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Observações</span>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm whitespace-pre-wrap">{client.observacoes || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="irs" className="mt-6">
        <AgregadoFamiliarTab clienteId={client.id} cliente={client} />
      </TabsContent>

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
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Password das Finanças</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs">{client.nif || 'N/A'}</Badge>
                  <span className="font-mono text-sm">{client.senha_financas || 'Não definida'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Password da Segurança Social</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs">{client.num_ss || 'N/A'}</Badge>
                  <span className="font-mono text-sm">{client.senha_ss || 'Não definida'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

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
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="identification">Identificação</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
        <TabsTrigger value="irs">IRS</TabsTrigger>
        <TabsTrigger value="informacao">Informação</TabsTrigger>
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
                <DetailField label="Email" value={client.email} />
                <DetailField label="Telefone" value={client.telefone} />
                <DetailField label="Nº Registo Comercial" value={client.registo_comercial} />
                <DetailField label="Forma Jurídica" value={client.forma_juridica} />
                <DetailField label="Data de Constituição" value={client.data_constituicao ? new Date(client.data_constituicao).toLocaleDateString('pt-PT') : null} />
                <DetailField label="CAE Principal" value={client.cae} />
                <DetailField label="Capital Social" value={client.capital_social ? `${client.capital_social}` : null} />
                <DetailField label="Incapacidade" value={client.incapacidade != null ? `${client.incapacidade}%` : null} />
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3 text-sm">Representante Legal</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                  <DetailField label="Nome" value={client.representante_nome} />
                  <DetailField label="Cargo" value={client.representante_cargo} />
                  <DetailField label="Email" value={client.representante_email} />
                  <DetailField label="Telemóvel" value={client.representante_telemovel} />
                  <DetailField label="NIF" value={client.representante_nif} />
                </div>
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
              <MoradaSection morada={client.morada} codigo_postal={client.codigo_postal} localidade={client.localidade} distrito={client.distrito} pais={client.pais} />
            </CardContent>
          </Card>

          <ClienteContactosTab clienteId={client.id} uniformCard />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="h-5 w-5" />
                Documentos anexos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !entidadeId) return;
                    try {
                      setUploadingCc(true);
                      const form = new FormData();
                      form.append('file', file);
                      await api.post(`cliente-documentos/upload-cliente/${entidadeId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
                      toast({ title: 'Sucesso', description: 'Documento enviado com sucesso.' });
                      fetchCcDocs();
                    } catch (err: unknown) {
                      const ex = err as { response?: { data?: { detail?: string } } };
                      toast({ title: 'Erro', description: ex?.response?.data?.detail || 'Erro ao enviar documento.', variant: 'destructive' });
                    } finally {
                      setUploadingCc(false);
                      e.target.value = '';
                    }
                  }}
                  disabled={uploadingCc}
                  className="text-sm"
                />
                <div className="rounded-lg border bg-muted/50 p-4">
                {loadingCcDocs ? (
                  <p className="text-sm text-muted-foreground">A carregar...</p>
                ) : ccDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum anexo</p>
                ) : (
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {ccDocs.map((d) => (
                      <li key={d.id} className="flex items-center gap-2">
                        <a href={`/api/cliente-documentos/download/${d.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1">
                          {d.nome_original}
                        </a>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="text-red-600"
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
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              Documentos e Outros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <DetailField label="Certidão Permanente" value={client.certidao_permanente} />
              <DetailField label="IBAN" value={client.iban} />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Observações</span>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm whitespace-pre-wrap">{client.observacoes || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="irs" className="mt-6">
        <AgregadoFamiliarTab clienteId={client.id} cliente={client} />
      </TabsContent>

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
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Password das Finanças</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs">{client.nif_empresa || 'N/A'}</Badge>
                  <span className="font-mono text-sm">{client.senha_financas || 'Não definida'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Password da Segurança Social</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs">{client.num_ss || 'N/A'}</Badge>
                  <span className="font-mono text-sm">{client.senha_ss || 'Não definida'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

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
          {getEffectiveTipo(client) === 'singular' 
            ? renderIndividualClient(client as IndividualClient)
            : renderCorporateClient(client as CorporateClient)
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
    </Dialog>
  );
};