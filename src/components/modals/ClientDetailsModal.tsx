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
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="identification">Identificação</TabsTrigger>
        <TabsTrigger value="contact">Contacto</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
        <TabsTrigger value="legal">Dados Jurídicos</TabsTrigger>
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
            <div>
              <label className="text-sm font-medium text-muted-foreground">Cartão de Cidadão</label>
              <p>{client.citizenCardNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Validade CC</label>
              <p>{new Date(client.citizenCardExpiry).toLocaleDateString('pt-PT')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data de Nascimento</label>
              <p>{new Date(client.birthDate).toLocaleDateString('pt-PT')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nacionalidade</label>
              <p>{client.nationality}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Estado Civil</label>
              <p>{client.maritalStatus}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Profissão</label>
              <p>{client.profession}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nº Segurança Social</label>
              <p>{client.socialSecurityNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nº Utente de Saúde</label>
              <p>{client.healthUserNumber}</p>
            </div>
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
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p>{client.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Telemóvel</label>
                <p>{client.mobile}</p>
              </div>
              {client.landline && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefone Fixo</label>
                  <p>{client.landline}</p>
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
                <p>{client.address.street}</p>
                <p>{client.address.postalCode} {client.address.locality}</p>
                <p>{client.address.district}, {client.address.country}</p>
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
              <span>Documentos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.documents.citizenCardCopy && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>Cópia do Cartão de Cidadão</span>
                <Badge variant="outline">{client.documents.citizenCardCopy}</Badge>
              </div>
            )}
            {client.documents.addressProof && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>Comprovativo de Morada</span>
                <Badge variant="outline">{client.documents.addressProof}</Badge>
              </div>
            )}
            {client.documents.bankProof && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>Comprovativo Bancário</span>
                <Badge variant="outline">{client.documents.bankProof}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="legal" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Dados Jurídicos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tem Representante Legal?</label>
              <p className="mt-1">
                <Badge className={client.hasLegalRepresentative ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {client.hasLegalRepresentative ? 'Sim' : 'Não'}
                </Badge>
              </p>
            </div>
            {client.hasLegalRepresentative && client.legalRepresentativeName && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome do Representante</label>
                <p>{client.legalRepresentativeName}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  const renderCorporateClient = (client: CorporateClient) => (
    <Tabs defaultValue="identification" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="identification">Identificação</TabsTrigger>
        <TabsTrigger value="representatives">Representantes</TabsTrigger>
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
              <p className="text-lg font-semibold">{client.companyName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">NIF</label>
              <p>{client.nif}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nº Registo Comercial</label>
              <p>{client.commercialRegistrationNumber}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Forma Jurídica</label>
              <p>{client.legalForm}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data de Constituição</label>
              <p>{new Date(client.constitutionDate).toLocaleDateString('pt-PT')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">CAE Principal</label>
              <p>{client.mainCAE}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Capital Social</label>
              <p>€{client.shareCapital}</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="representatives" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Representantes Legais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.legalRepresentatives.map((rep, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nome</label>
                    <p className="font-medium">{rep.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cargo</label>
                    <p>{rep.position}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p>{rep.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telemóvel</label>
                    <p>{rep.mobile}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">NIF</label>
                    <p>{rep.nif}</p>
                  </div>
                </div>
              </div>
            ))}
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
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p>{client.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                <p>{client.phone}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Morada da Sede</span>
              </h4>
              <div className="bg-muted p-4 rounded-lg">
                <p>{client.address.street}</p>
                <p>{client.address.postalCode} {client.address.locality}</p>
                <p>{client.address.country}</p>
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
              <span>Documentos da Empresa</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.documents.permanentCertificate && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>Certidão Permanente</span>
                <Badge variant="outline">{client.documents.permanentCertificate}</Badge>
              </div>
            )}
            {client.documents.iban && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>IBAN</span>
                <Badge variant="outline">{client.documents.iban}</Badge>
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
            {client.tipo === 'individual' ? (
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
                    client.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }>
                    {client.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Data de Criação</label>
              <p className="text-sm">{new Date(client.createdAt).toLocaleDateString('pt-PT')}</p>
            </div>
          </div>

          {/* Tags */}
          {client.tags.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {client.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Client Type Specific Content */}
          {client.tipo === 'individual' 
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