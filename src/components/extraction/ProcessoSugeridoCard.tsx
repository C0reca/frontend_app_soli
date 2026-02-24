import React from 'react';
import { FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProcessoSugerido } from '@/hooks/useExtracaoDocumento';

interface ProcessoSugeridoCardProps {
  processo: ProcessoSugerido;
  onCriarProcesso: (processo: ProcessoSugerido) => void;
}

export const ProcessoSugeridoCard: React.FC<ProcessoSugeridoCardProps> = ({
  processo,
  onCriarProcesso,
}) => {
  if (!processo.titulo_sugerido && !processo.tipo_sugerido) return null;

  return (
    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-blue-100">
            <FolderOpen className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {processo.titulo_sugerido || 'Processo sem título'}
            </p>
            {processo.tipo_sugerido && (
              <p className="text-sm text-blue-600">Tipo: {processo.tipo_sugerido}</p>
            )}
            {processo.descricao && (
              <p className="text-sm text-gray-600 mt-1">{processo.descricao}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCriarProcesso(processo)}
          className="border-blue-300 text-blue-700 hover:bg-blue-100"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Criar Processo
        </Button>
      </div>
    </div>
  );
};
