import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, FileText, CheckCircle, XCircle, Clock, ArrowLeftRight, Check, X, Trash2 } from 'lucide-react';
import { useIRS, IRS } from '@/hooks/useIRS';
import { IRSModal } from '@/components/modals/IRSModal';
import { useClients } from '@/hooks/useClients';
import { useAuth } from '@/contexts/AuthContext';

export const IRS: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selectedIRS, setSelectedIRS] = useState<IRS | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { irsList, isLoading, generateRecibo, updateIRS, deleteIRS } = useIRS(showAll ? undefined : true);
  const { clients } = useClients();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const filteredIRS = irsList.filter((irs: IRS) => {
    const clienteNome = irs.cliente?.nome?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    return clienteNome.includes(searchLower);
  });

  const getEstadoBadge = (estado: string, onClick?: () => void) => {
    if (estado === 'Pago') {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
    } else if (estado === 'Isento') {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800"><CheckCircle className="w-3 h-3 mr-1" />Isento</Badge>;
    } else {
      return (
        <Badge 
          variant="outline" 
          className={onClick ? "cursor-pointer hover:bg-gray-100" : ""}
          onClick={onClick}
        >
          <Clock className="w-3 h-3 mr-1" />Por Pagar
        </Badge>
      );
    }
  };

  const handleEdit = (irs: IRS) => {
    setSelectedIRS(irs);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedIRS(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedIRS(null);
  };

  const handleGenerateRecibo = async (irs: IRS) => {
    await generateRecibo(irs.id);
  };

  const handleToggleEstado = async (irs: IRS) => {
    // Não permitir alterar de "Pago" para "Por Pagar" se já existe número de recibo
    if (irs.estado === 'Pago' && irs.numero_recibo) {
      return; // Não fazer nada se já tem recibo
    }
    
    // Toggle entre estados: Por Pagar <-> Pago, Isento não muda
    let novoEstado: 'Por Pagar' | 'Pago' | 'Isento';
    if (irs.estado === 'Pago') {
      novoEstado = 'Por Pagar';
    } else if (irs.estado === 'Por Pagar') {
      novoEstado = 'Pago';
    } else {
      // Isento - não muda
      return;
    }
    
    await updateIRS.mutateAsync({
      id: irs.id,
      data: { estado: novoEstado }
    });
  };

  const handleDelete = async (irs: IRS) => {
    // Avisar se tiver recibo gerado
    let confirmMessage = 'Tem certeza que deseja eliminar este IRS?';
    if (irs.numero_recibo) {
      confirmMessage = `ATENÇÃO: Este IRS já tem um recibo gerado (${irs.numero_recibo}). Tem certeza que deseja eliminar?`;
    }
    
    if (confirm(confirmMessage)) {
      await deleteIRS.mutateAsync(irs.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>IRS</CardTitle>
              <CardDescription>Gestão de IRS - Lista de IRS em aberto</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={showAll ? "outline" : "default"}
                onClick={() => setShowAll(false)}
              >
                Em Aberto
              </Button>
              <Button
                variant={showAll ? "default" : "outline"}
                onClick={() => setShowAll(true)}
              >
                Todos
              </Button>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Novo IRS
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Pesquisar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Nº Recibo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIRS.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      Nenhum IRS encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIRS.map((irs: IRS) => (
                    <TableRow key={irs.id}>
                      <TableCell className="font-medium">
                        {irs.cliente?.nome || `Cliente #${irs.cliente_id}`}
                      </TableCell>
                      <TableCell>{irs.ano}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Fase {irs.fase}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEstadoBadge(
                            irs.estado,
                            (irs.estado === 'Por Pagar' || irs.estado === 'Isento') ? () => handleToggleEstado(irs) : undefined
                          )}
                          {/* Só mostrar botão de toggle se não tiver recibo gerado e não for Isento ou Pago com recibo */}
                          {!irs.numero_recibo && irs.estado !== 'Isento' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleToggleEstado(irs)}
                              title={irs.estado === 'Pago' ? 'Marcar como Por Pagar' : 'Marcar como Pago'}
                            >
                              {irs.estado === 'Pago' ? (
                                <X className="w-3 h-3 text-red-500" />
                              ) : (
                                <Check className="w-3 h-3 text-green-500" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {irs.estado_entrega ? (
                          <Badge variant="outline">{irs.estado_entrega}</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{irs.numero_recibo || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(irs)}
                            title="Editar IRS"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {irs.estado === 'Pago' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateRecibo(irs)}
                              title="Gerar Recibo"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          )}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(irs)}
                              title="Eliminar IRS"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <IRSModal
          irs={selectedIRS}
          clients={clients}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

