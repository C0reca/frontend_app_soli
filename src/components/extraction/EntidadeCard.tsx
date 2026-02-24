import React from 'react';
import { User, Building, ExternalLink, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { EntidadeExtraida } from '@/hooks/useExtracaoDocumento';

interface EntidadeCardProps {
  entidade: EntidadeExtraida;
  onCriarEntidade: (entidade: EntidadeExtraida) => void;
  onAbrirEntidade: (id: number) => void;
}

export const EntidadeCard: React.FC<EntidadeCardProps> = ({
  entidade,
  onCriarEntidade,
  onAbrirEntidade,
}) => {
  const existe = !!entidade.entidade_existente_id;

  return (
    <div className={`border rounded-lg p-4 ${existe ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${existe ? 'bg-green-100' : 'bg-amber-100'}`}>
            <User className={`h-4 w-4 ${existe ? 'text-green-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{entidade.nome || 'Sem nome'}</span>
              {entidade.papel && (
                <Badge variant="outline" className="text-xs">
                  {entidade.papel}
                </Badge>
              )}
            </div>
            {entidade.nif && (
              <p className="text-sm text-gray-600">NIF: {entidade.nif}</p>
            )}
            {entidade.morada && (
              <p className="text-sm text-gray-500">{entidade.morada}</p>
            )}
            {entidade.email && (
              <p className="text-sm text-gray-500">{entidade.email}</p>
            )}
            {entidade.telefone && (
              <p className="text-sm text-gray-500">{entidade.telefone}</p>
            )}

            {/* Status */}
            <div className="mt-2">
              {existe ? (
                <div className="flex items-center gap-1 text-sm text-green-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>
                    Existe: {entidade.entidade_existente_nome} (#{entidade.entidade_existente_id})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-sm text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Não encontrada no sistema</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ação */}
        <div>
          {existe ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAbrirEntidade(entidade.entidade_existente_id!)}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Abrir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCriarEntidade(entidade)}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Criar Entidade
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
