import React from 'react';
import { Client, getEffectiveTipo } from '@/hooks/useClients';
import { ClientDetailsModal } from '@/components/modals/ClientDetailsModal';
import api from '@/services/api';

interface ClickableClientNameProps {
  clientId?: number;
  client?: Client | null;
  clientName?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ClickableClientName: React.FC<ClickableClientNameProps> = ({
  clientId,
  client: clientProp,
  clientName,
  className = "text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors",
  children,
}) => {
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(clientProp || null);
  const [isClientDetailsOpen, setIsClientDetailsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (clientProp) {
      // Se já temos o cliente completo, usar diretamente
      setSelectedClient(clientProp);
      setIsClientDetailsOpen(true);
    } else if (clientId) {
      // Se só temos o ID, buscar o cliente
      setIsLoading(true);
      try {
        const response = await api.get(`/clientes/${clientId}`);
        setSelectedClient(response.data);
        setIsClientDetailsOpen(true);
      } catch (error) {
        console.error('Erro ao buscar cliente:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const displayName = children || clientName || (clientProp ? (getEffectiveTipo(clientProp) === 'coletivo' ? (clientProp as any).nome_empresa : (clientProp as any).nome) : 'N/A');

  if (!clientId && !clientProp) {
    return <span className={className}>{displayName}</span>;
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={className}
        disabled={isLoading}
      >
        {isLoading ? 'A carregar...' : displayName}
      </button>
      {/* Só montamos o modal quando está aberto para evitar N instâncias de useDossies */}
      {isClientDetailsOpen && (
        <ClientDetailsModal
          isOpen={isClientDetailsOpen}
          onClose={() => setIsClientDetailsOpen(false)}
          client={selectedClient}
        />
      )}
    </>
  );
};
