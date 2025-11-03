import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building, User, MapPin, FileText, Calendar, Edit } from 'lucide-react';
import { RegistoPredial } from '@/hooks/useRegistosPrediais';

interface RegistoPredialDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  registo: RegistoPredial | null;
}

export const RegistoPredialDetailsModal: React.FC<RegistoPredialDetailsModalProps> = ({
  isOpen,
  onClose,
  registo,
}) => {
  const { data: clienteData, isLoading: isLoadingCliente } = useQuery({
    queryKey: ['cliente', registo?.cliente_id],
    queryFn: async () => {
      const response = await api.get(`/clientes/${registo?.cliente_id}`);
      return response.data;
    },
    enabled: !!registo?.cliente_id,
  });

  if (!registo) return null;

  const clienteNome = clienteData?.nome || clienteData?.nome_empresa || registo.cliente?.nome || `ID: ${registo.cliente_id}`;

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Concluído':
        return 'bg-green-100 text-green-800';
      case 'Desistência':
        return 'bg-gray-100 text-gray-800';
      case 'Recusado':
        return 'bg-red-100 text-red-800';
      case 'Provisórios':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (estado: string) => {
    switch (estado) {
      case 'Concluído':
        return 'Concluído';
      case 'Desistência':
        return 'Desistência';
      case 'Recusado':
        return 'Recusado';
      case 'Provisórios':
        return 'Provisórios';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Detalhes do Registo Predial</span>
          </DialogTitle>
          <DialogDescription>
            Informações completas do registo predial {registo.numero_processo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header com status */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{registo.numero_processo} - {clienteNome || 'N/A'}</h3>
              <p className="text-sm text-gray-600">{registo.predio}</p>
            </div>
            <Badge className={getStatusColor(registo.estado)}>
              {getStatusLabel(registo.estado)}
            </Badge>
          </div>

          <Separator />

          {/* Informações do Cliente */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center">
              <User className="h-4 w-4 mr-2" />
              Cliente
            </h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">{isLoadingCliente ? 'A carregar...' : (clienteNome || 'N/A')}</p>
            </div>
          </div>

          {/* Localização */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Localização
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Prédio</label>
                <p className="text-sm">{registo.predio}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Freguesia</label>
                <p className="text-sm">{registo.freguesia}</p>
              </div>
            </div>
          </div>

          {/* Informações do Registo */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Dados do Registo
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Registo de Facto</label>
                <p className="text-sm">{registo.registo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Conservatória</label>
                <p className="text-sm">{registo.conservatoria}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Requerimento</label>
                <p className="text-sm">{registo.requisicao}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Apresentação</label>
                <p className="text-sm">{registo.apresentacao}</p>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Datas
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Data</label>
                <p className="text-sm">{new Date(registo.data).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Data de Criação</label>
                <p className="text-sm">{new Date(registo.data_criacao).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>

          {/* Apresentação Complementar */}
          {registo.apresentacao_complementar && (
            <div className="space-y-3">
              <h4 className="font-medium">Apresentação Complementar</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{registo.apresentacao_complementar}</p>
              </div>
            </div>
          )}

          {/* Outras Observações */}
          {registo.outras_observacoes && (
            <div className="space-y-3">
              <h4 className="font-medium">Outras Observações</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{registo.outras_observacoes}</p>
              </div>
            </div>
          )}

          <Separator />

          {/* Ações */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};