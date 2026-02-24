import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EntidadeCard } from './EntidadeCard';
import { ProcessoSugeridoCard } from './ProcessoSugeridoCard';
import { TarefasSugeridasList } from './TarefasSugeridasList';
import type {
  ExtracaoResponse,
  EntidadeExtraida,
  ProcessoSugerido,
  TarefaSugerida,
} from '@/hooks/useExtracaoDocumento';

interface ExtracaoReviewPanelProps {
  resultado: ExtracaoResponse;
  onCriarEntidade: (entidade: EntidadeExtraida) => void;
  onAbrirEntidade: (id: number) => void;
  onCriarProcesso: (processo: ProcessoSugerido) => void;
  onCriarTarefas: (tarefas: TarefaSugerida[]) => void;
}

const confiancaCores: Record<string, string> = {
  alta: 'bg-green-100 text-green-700',
  media: 'bg-yellow-100 text-yellow-700',
  baixa: 'bg-red-100 text-red-700',
};

const confiancaLabels: Record<string, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export const ExtracaoReviewPanel: React.FC<ExtracaoReviewPanelProps> = ({
  resultado,
  onCriarEntidade,
  onAbrirEntidade,
  onCriarProcesso,
  onCriarTarefas,
}) => {
  return (
    <div className="space-y-6">
      {/* Header com confiança */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Resultados da Extração</h3>
        <Badge className={confiancaCores[resultado.confianca] || confiancaCores.media}>
          Confiança: {confiancaLabels[resultado.confianca] || resultado.confianca}
        </Badge>
      </div>

      {/* Notas */}
      {resultado.notas && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-sm text-gray-600">{resultado.notas}</p>
        </div>
      )}

      {/* Entidades */}
      {resultado.entidades.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Entidades ({resultado.entidades.length})
          </h4>
          <div className="space-y-2">
            {resultado.entidades.map((ent, i) => (
              <EntidadeCard
                key={i}
                entidade={ent}
                onCriarEntidade={onCriarEntidade}
                onAbrirEntidade={onAbrirEntidade}
              />
            ))}
          </div>
        </div>
      )}

      {/* Processo Sugerido */}
      {resultado.processo && (resultado.processo.titulo_sugerido || resultado.processo.tipo_sugerido) && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Processo Sugerido
          </h4>
          <ProcessoSugeridoCard
            processo={resultado.processo}
            onCriarProcesso={onCriarProcesso}
          />
        </div>
      )}

      {/* Tarefas Sugeridas */}
      {resultado.tarefas_sugeridas.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Tarefas Sugeridas ({resultado.tarefas_sugeridas.length})
          </h4>
          <TarefasSugeridasList
            tarefas={resultado.tarefas_sugeridas}
            onCriarTarefas={onCriarTarefas}
          />
        </div>
      )}
    </div>
  );
};
