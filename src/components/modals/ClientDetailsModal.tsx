import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Client, IndividualClient, CorporateClient } from '@/hooks/useClients';
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
  Folder
} from 'lucide-react';

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
    'separated': 'Separado(a)', // legado: já não aparece no selector
    'separacao_facto': 'Separação de Facto',
    'widowed': 'Viúvo(a)',
  };
  return traducoes[estadoCivil.toLowerCase()] || estadoCivil;
};

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  isOpen,
  onClose,
  client,
}) => {
  const { dossie, isLoading: loadingDossie, createDossie, updateDossie } = useDossies(client?.id);
  const [isDossieModalOpen, setIsDossieModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  if (!client) return null;

  const renderIndividualClient = (client: IndividualClient) => (
    <Tabs defaultValue="identification" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="identification">Identificação</TabsTrigger>
        <TabsTrigger value="contact">Contacto</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
        <TabsTrigger value="irs">IRS</TabsTrigger>
        <TabsTrigger value="informacao">Informação</TabsTrigger>
        <TabsTrigger value="dossies">Arquivo</TabsTrigger>
      </TabsList>

      <TabsContent value="identification" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Dados de Identificação</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
              <p className="text-lg font-semibold">{client.nome || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Designação</label>
              <p className="text-sm">{(client as any).designacao || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">NIF</label>
              <p>{client.nif || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p>{client.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Telefone</label>
              <p>{client.telefone || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Cartão de Cidadão</label>
              <p>{client.num_cc || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Validade CC</label>
              <p>{client.validade_cc ? new Date(client.validade_cc).toLocaleDateString('pt-PT') : '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
              <p>{client.data_nascimento ? new Date(client.data_nascimento).toLocaleDateString('pt-PT') : '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nacionalidade</label>
              <p>{client.nacionalidade || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado Civil</label>
              <p>{getEstadoCivilLabel(client.estado_civil)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Profissão</label>
              <p>{client.profissao || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Incapacidade</label>
              <p>{client.incapacidade !== undefined && client.incapacidade !== null ? `${client.incapacidade}%` : '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nº Segurança Social</label>
              <p>{client.num_ss || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nº Utente de Saúde</label>
              <p>{client.num_sns || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nº Identificação Civil</label>
              <p>{client.num_ident_civil || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="contact" className="mt-6">
        <div className="space-y-6">
          <ClienteContactosTab clienteId={client.id} />
          
          <Separator />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Morada</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                {client.morada && <p>{client.morada}</p>}
                {client.codigo_postal && client.localidade && (
                  <p>{client.codigo_postal} {client.localidade}</p>
                )}
                {client.distrito && client.pais && (
                  <p>{client.distrito}, {client.pais}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Documentos e Outros</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">IBAN</span>
              <Badge variant="outline">{client.iban || '-'}</Badge>
            </div>
            {(client as any).certidao_permanente && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Certidão Permanente</span>
                <Badge variant="outline">{(client as any).certidao_permanente}</Badge>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Observações</label>
              <div className="bg-muted p-4 rounded-lg mt-2">
                <p className="text-sm">{client.observacoes || '-'}</p>
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
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Informações de Acesso</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password das Finanças</label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {client.nif || 'N/A'}
                </Badge>
                <span className="text-sm">-</span>
                <span className="font-mono text-sm">{client.senha_financas || 'Não definida'}</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password da Segurança Social</label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {client.nif || 'N/A'}
                </Badge>
                <span className="text-sm">-</span>
                <span className="font-mono text-sm">{client.senha_ss || 'Não definida'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="dossies" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Folder className="h-5 w-5" />
                  <span>Arquivo</span>
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
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Arquivo</label>
                        <p className="text-lg font-semibold">{dossie.id} - {client.nome || (client as any).nome_empresa || 'N/A'}</p>
                      </div>
                      {dossie.descricao && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                          <p className="text-sm">{dossie.descricao}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                        <p className="text-sm">{new Date(dossie.criado_em).toLocaleDateString('pt-PT')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
        <TabsTrigger value="contact">Contacto</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
        <TabsTrigger value="informacao">Informação</TabsTrigger>
        <TabsTrigger value="dossies">Arquivo</TabsTrigger>
      </TabsList>

      <TabsContent value="identification" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5" />
              <span>Dados da Empresa</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome da Empresa</label>
              <p className="text-lg font-semibold">{client.nome_empresa || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Designação</label>
              <p className="text-sm">{(client as any).designacao || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">NIF</label>
              <p>{client.nif_empresa || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p>{client.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Telefone</label>
              <p>{client.telefone || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nº Registo Comercial</label>
              <p>{client.registo_comercial || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Forma Jurídica</label>
              <p>{client.forma_juridica || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data de Constituição</label>
              <p>{client.data_constituicao ? new Date(client.data_constituicao).toLocaleDateString('pt-PT') : '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">CAE Principal</label>
              <p>{client.cae || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Capital Social</label>
              <p>{client.capital_social ? `€${client.capital_social}` : '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Incapacidade</label>
              <p>{client.incapacidade !== undefined && client.incapacidade !== null ? `${client.incapacidade}%` : '-'}</p>
            </div>
            
            {/* Representante Legal */}
            <div className="col-span-2">
              <Separator className="my-4" />
              <h4 className="font-semibold mb-3">Representante Legal</h4>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome</label>
              <p>{client.representante_nome || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Cargo</label>
              <p>{client.representante_cargo || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p>{client.representante_email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Telemóvel</label>
              <p>{client.representante_telemovel || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">NIF</label>
              <p>{client.representante_nif || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="contact" className="mt-6">
        <div className="space-y-6">
          <ClienteContactosTab clienteId={client.id} />
          
          <Separator />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Morada da Sede</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                {client.morada && <p>{client.morada}</p>}
                {client.codigo_postal && client.localidade && (
                  <p>{client.codigo_postal} {client.localidade}</p>
                )}
                {client.distrito && client.pais && (
                  <p>{client.distrito}, {client.pais}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="documents" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Documentos e Outros</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Certidão Permanente</span>
              <Badge variant="outline">{client.certidao_permanente || '-'}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">IBAN</span>
              <Badge variant="outline">{client.iban || '-'}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Observações</label>
              <div className="bg-muted p-4 rounded-lg mt-2">
                <p className="text-sm">{client.observacoes || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="informacao" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Informações de Acesso</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password das Finanças</label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {client.nif || 'N/A'}
                </Badge>
                <span className="text-sm">-</span>
                <span className="font-mono text-sm">{client.senha_financas || 'Não definida'}</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password da Segurança Social</label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {client.nif || 'N/A'}
                </Badge>
                <span className="text-sm">-</span>
                <span className="font-mono text-sm">{client.senha_ss || 'Não definida'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="dossies" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Folder className="h-5 w-5" />
                  <span>Arquivo</span>
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
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Arquivo</label>
                        <p className="text-lg font-semibold">{dossie.id} - {(client as any).nome || client.nome_empresa || 'N/A'}</p>
                      </div>
                      {dossie.descricao && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                          <p className="text-sm">{dossie.descricao}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                        <p className="text-sm">{new Date(dossie.criado_em).toLocaleDateString('pt-PT')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              {(client.tipo || 'singular') === 'singular' ? (
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
          {/* Status and Internal Info */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nº Cliente</label>
                <p className="font-mono">{client.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge className={
                    (client.ativo !== false) 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }>
                    {(client.ativo !== false) ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data de Criação</label>
              <p className="text-sm">{(client as any).criado_em ? new Date((client as any).criado_em).toLocaleDateString('pt-PT') : '-'}</p>
            </div>
          </div>

          {/* Client Type Specific Content */}
          {(client.tipo || 'singular') === 'singular' 
            ? renderIndividualClient(client as IndividualClient)
            : renderCorporateClient(client as CorporateClient)
          }

          {/* Internal Notes */}
          {client.internalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Hash className="h-5 w-5" />
                  <span>Notas Internas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm">{client.internalNotes}</p>
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
          entidadeId={client.id}
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
    </Dialog>
  );
};