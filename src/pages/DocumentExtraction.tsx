import React, { useState } from 'react';
import { ScanSearch, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ExtracaoUploadZone } from '@/components/extraction/ExtracaoUploadZone';
import { ExtracaoReviewPanel } from '@/components/extraction/ExtracaoReviewPanel';
import {
  useExtracaoStatus,
  useExtrairDocumento,
  type ExtracaoResponse,
  type EntidadeExtraida,
  type ProcessoSugerido,
  type TarefaSugerida,
} from '@/hooks/useExtracaoDocumento';
import { ClientModal } from '@/components/modals/ClientModal';
import { ProcessModal } from '@/components/modals/ProcessModal';
import { TaskModal } from '@/components/modals/TaskModal';

export const DocumentExtraction: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: status } = useExtracaoStatus();
  const extracao = useExtrairDocumento();

  const [resultado, setResultado] = useState<ExtracaoResponse | null>(null);

  // Modal states
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientInitialData, setClientInitialData] = useState<any>(null);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processInitialData, setProcessInitialData] = useState<any>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskInitialData, setTaskInitialData] = useState<any>(null);

  const handleExtrair = (ficheiro: File, tipo: string) => {
    setResultado(null);
    extracao.mutate(
      { ficheiro, tipo_processo: tipo },
      {
        onSuccess: (data) => {
          setResultado(data);
          toast({
            title: 'Extração concluída',
            description: `${data.entidades.length} entidade(s) encontrada(s)`,
          });
        },
        onError: (err: any) => {
          toast({
            title: 'Erro na extração',
            description: err.response?.data?.detail || 'Erro ao processar documento',
            variant: 'destructive',
          });
        },
      },
    );
  };

  const handleCriarEntidade = (entidade: EntidadeExtraida) => {
    setClientInitialData({
      tipo: 'singular',
      nome: entidade.nome || '',
      nif: entidade.nif || '',
      morada: entidade.morada || '',
      codigo_postal: entidade.codigo_postal || '',
      localidade: entidade.localidade || '',
      email: entidade.email || '',
      telefone: entidade.telefone || '',
      estado_civil: entidade.estado_civil || '',
    });
    setClientModalOpen(true);
  };

  const handleAbrirEntidade = (id: number) => {
    navigate(`/clientes?entidade=${id}`);
  };

  const handleCriarProcesso = (processo: ProcessoSugerido) => {
    setProcessInitialData({
      titulo: processo.titulo_sugerido || '',
      tipo: processo.tipo_sugerido || '',
      descricao: processo.descricao || '',
    });
    setProcessModalOpen(true);
  };

  const handleCriarTarefas = (tarefas: TarefaSugerida[]) => {
    // Abrir modal para a primeira tarefa; as restantes poderão ser criadas sequencialmente
    if (tarefas.length === 0) return;
    const primeira = tarefas[0];
    setTaskInitialData({
      titulo: primeira.titulo || '',
      descricao: primeira.descricao || '',
      prioridade: primeira.prioridade || 'media',
    });
    setTaskModalOpen(true);

    if (tarefas.length > 1) {
      toast({
        title: `${tarefas.length} tarefas selecionadas`,
        description: 'A primeira será criada agora. Crie as restantes a seguir.',
      });
    }
  };

  if (status && !status.habilitado) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center py-16">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Assistente de Documentos Indisponível
          </h2>
          <p className="text-gray-600">
            A chave da API de IA não está configurada. Contacte o administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ScanSearch className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assistente de Documentos</h1>
            <p className="text-sm text-gray-500">
              Carregue um documento e extraia automaticamente entidades, processos e tarefas
            </p>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <ExtracaoUploadZone
            onExtrair={handleExtrair}
            isLoading={extracao.isPending}
          />
        </div>

        {/* Loading */}
        {extracao.isPending && (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">A analisar documento com IA...</p>
            <p className="text-sm text-gray-400 mt-1">Isto pode demorar alguns segundos</p>
          </div>
        )}

        {/* Results */}
        {resultado && !extracao.isPending && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <ExtracaoReviewPanel
              resultado={resultado}
              onCriarEntidade={handleCriarEntidade}
              onAbrirEntidade={handleAbrirEntidade}
              onCriarProcesso={handleCriarProcesso}
              onCriarTarefas={handleCriarTarefas}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <ClientModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        initialData={clientInitialData}
      />
      <ProcessModal
        isOpen={processModalOpen}
        onClose={() => setProcessModalOpen(false)}
        initialData={processInitialData}
      />
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        initialData={taskInitialData}
      />
    </div>
  );
};
