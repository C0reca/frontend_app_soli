import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Client, IndividualClient, CorporateClient } from '@/hooks/useClients';
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
  Home
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
  if (!client) return null;

  const renderIndividualClient = (client: IndividualClient) => (
    <Tabs defaultValue="identification" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="identification">Identificação</TabsTrigger>
        <TabsTrigger value="contact">Contacto</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Informações de Contacto</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p>{client.email}</p>
                </div>
              )}
              {client.telefone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                  <p>{client.telefone}</p>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Morada</span>
              </h4>
              <div className="bg-muted p-4 rounded-lg">
                {client.morada && <p>{client.morada}</p>}
                {client.codigo_postal && client.localidade && (
                  <p>{client.codigo_postal} {client.localidade}</p>
                )}
                {client.distrito && client.pais && (
                  <p>{client.distrito}, {client.pais}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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
    </Tabs>
  );

  const renderCorporateClient = (client: CorporateClient) => (
    <Tabs defaultValue="identification" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="identification">Identificação</TabsTrigger>
        <TabsTrigger value="contact">Contacto</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Contacto da Empresa</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p>{client.email}</p>
                </div>
              )}
              {client.telefone && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                  <p>{client.telefone}</p>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Morada da Sede</span>
              </h4>
              <div className="bg-muted p-4 rounded-lg">
                {client.morada && <p>{client.morada}</p>}
                {client.codigo_postal && client.localidade && (
                  <p>{client.codigo_postal} {client.localidade}</p>
                )}
                {client.distrito && client.pais && (
                  <p>{client.distrito}, {client.pais}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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
    </Tabs>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
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
                <label className="text-sm font-medium text-muted-foreground">Funcionário Responsável</label>
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
    </Dialog>
  );
};