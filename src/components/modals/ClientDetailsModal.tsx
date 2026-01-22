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
        {(client as any).tem_dossies && <TabsTrigger value="dossies">Arquivos</TabsTrigger>}
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
              <p className="text-lg font-semibold">{client.nome}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">NIF</label>
              <p>{client.nif}</p>
            </div>
            {client.num_cc && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Cartão de Cidadão</label>
                <p>{client.num_cc}</p>
              </div>
            )}
            {client.validade_cc && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Validade CC</label>
                <p>{new Date(client.validade_cc).toLocaleDateString('pt-PT')}</p>
              </div>
            )}
            {client.data_nascimento && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
                <p>{new Date(client.data_nascimento).toLocaleDateString('pt-PT')}</p>
              </div>
            )}
            {client.nacionalidade && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nacionalidade</label>
                <p>{client.nacionalidade}</p>
              </div>
            )}
            {client.estado_civil && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Estado Civil</label>
                <p>{client.estado_civil}</p>
              </div>
            )}
            {client.profissao && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Profissão</label>
                <p>{client.profissao}</p>
              </div>
            )}
            {client.incapacidade !== undefined && client.incapacidade !== null && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Incapacidade</label>
                <p>{client.incapacidade}%</p>
              </div>
            )}
            {client.num_ss && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nº Segurança Social</label>
                <p>{client.num_ss}</p>
              </div>
            )}
            {client.num_sns && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nº Utente de Saúde</label>
                <p>{client.num_sns}</p>
              </div>
            )}
            {client.num_ident_civil && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nº Identificação Civil</label>
                <p>{client.num_ident_civil}</p>
              </div>
            )}
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
            {client.iban && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>IBAN</span>
                <Badge variant="outline">{client.iban}</Badge>
              </div>
            )}
            {client.observacoes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Observações</label>
                <div className="bg-muted p-4 rounded-lg mt-2">
                  <p className="text-sm">{client.observacoes}</p>
                </div>
              </div>
            )}
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

      {(client as any).tem_dossies && (
        <TabsContent value="dossies" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Folder className="h-5 w-5" />
                  <span>Arquivo</span>
                </CardTitle>
                {dossie && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsDossieModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Arquivo
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
                  <p>O arquivo será criado automaticamente quando necessário.</p>
                  <p className="text-sm mt-2">Todos os processos desta entidade serão guardados no arquivo.</p>
                </div>
              ) : (
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nome do Arquivo</label>
                        <p className="text-lg font-semibold">{dossie.nome}</p>
                      </div>
                      {dossie.numero && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Número</label>
                          <p>{dossie.numero}</p>
                        </div>
                      )}
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
      )}
    </Tabs>
  );

  const renderCorporateClient = (client: CorporateClient) => (
    <Tabs defaultValue="identification" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="identification">Identificação</TabsTrigger>
        <TabsTrigger value="contact">Contacto</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
        <TabsTrigger value="irs">IRS</TabsTrigger>
        <TabsTrigger value="informacao">Informação</TabsTrigger>
        {(client as any).tem_dossies && <TabsTrigger value="dossies">Arquivos</TabsTrigger>}
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
              <p className="text-lg font-semibold">{client.nome_empresa}</p>
            </div>
            {client.nif_empresa && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">NIF</label>
                <p>{client.nif_empresa}</p>
              </div>
            )}
            {client.registo_comercial && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nº Registo Comercial</label>
                <p>{client.registo_comercial}</p>
              </div>
            )}
            {client.forma_juridica && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Forma Jurídica</label>
                <p>{client.forma_juridica}</p>
              </div>
            )}
            {client.data_constituicao && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Constituição</label>
                <p>{new Date(client.data_constituicao).toLocaleDateString('pt-PT')}</p>
              </div>
            )}
            {client.cae && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">CAE Principal</label>
                <p>{client.cae}</p>
              </div>
            )}
            {client.capital_social && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Capital Social</label>
                <p>€{client.capital_social}</p>
              </div>
            )}
            {client.incapacidade !== undefined && client.incapacidade !== null && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Incapacidade</label>
                <p>{client.incapacidade}%</p>
              </div>
            )}
            
            {/* Representante Legal */}
            {(client.representante_nome || client.representante_nif || client.representante_email) && (
              <>
                <div className="col-span-2">
                  <Separator className="my-4" />
                  <h4 className="font-semibold mb-3">Representante Legal</h4>
                </div>
                {client.representante_nome && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                    <p>{client.representante_nome}</p>
                  </div>
                )}
                {client.representante_cargo && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cargo</label>
                    <p>{client.representante_cargo}</p>
                  </div>
                )}
                {client.representante_email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{client.representante_email}</p>
                  </div>
                )}
                {client.representante_telemovel && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telemóvel</label>
                    <p>{client.representante_telemovel}</p>
                  </div>
                )}
                {client.representante_nif && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">NIF</label>
                    <p>{client.representante_nif}</p>
                  </div>
                )}
              </>
            )}
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
            {client.certidao_permanente && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>Certidão Permanente</span>
                <Badge variant="outline">{client.certidao_permanente}</Badge>
              </div>
            )}
            {client.iban && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>IBAN</span>
                <Badge variant="outline">{client.iban}</Badge>
              </div>
            )}
            {client.observacoes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Observações</label>
                <div className="bg-muted p-4 rounded-lg mt-2">
                  <p className="text-sm">{client.observacoes}</p>
                </div>
              </div>
            )}
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

      {(client as any).tem_dossies && (
        <TabsContent value="dossies" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Folder className="h-5 w-5" />
                  <span>Arquivo</span>
                </CardTitle>
                {dossie && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsDossieModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Arquivo
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
                  <p>O arquivo será criado automaticamente quando necessário.</p>
                  <p className="text-sm mt-2">Todos os processos desta entidade serão guardados no arquivo.</p>
                </div>
              ) : (
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nome do Arquivo</label>
                        <p className="text-lg font-semibold">{dossie.nome}</p>
                      </div>
                      {dossie.numero && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Número</label>
                          <p>{dossie.numero}</p>
                        </div>
                      )}
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
      )}
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
                <p className="font-mono">{client.internalNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Responsável</label>
                <p>{client.responsibleEmployee}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge className={
                    (client.status || 'active') === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }>
                    {(client.status || 'active') === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data de Criação</label>
              <p className="text-sm">{new Date(client.createdAt).toLocaleDateString('pt-PT')}</p>
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

      {client && (client as any).tem_dossies && (
        <DossieModal
          isOpen={isDossieModalOpen}
          onClose={() => {
            setIsDossieModalOpen(false);
          }}
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